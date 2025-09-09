const { db, admin } = require("../database/firebase");
const supabase = require("../database/supabase");

async function addProposal(req, res, next) {
  try {
    const umkmId = req.user.uid;
    if (!umkmId) {
      return res.status(400).json({ error: "UMKM ID is required" });
    }
    const { eventId } = req.body;

    let struk = null;
    if (req.files && req.files.struk) {
      const strukFile = req.files.struk[0];
      const { data, error: uploadError } = await supabase.storage
        .from("events")
        .upload(`struk/${strukFile.originalname}`, strukFile.buffer, {
          contentType: strukFile.mimetype,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      struk = supabase.storage.from("events").getPublicUrl(data.path)
        .data.publicUrl;
    }

    const proposalData = {
      eventId,
      umkmId,
      struk,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const proposalRef = await db.collection("umkmproposal").add(proposalData);
    res.status(201).json({ id: proposalRef.id, ...proposalData });
  } catch (error) {
    console.error("Error adding proposal:", error);
    res.status(500).json({ error: "Failed to add proposal" });
  }
}

async function getAllProposalByEO(req, res, next) {
  try {
    const eoId = req.user.uid;
    if (!eoId) {
      return res.status(400).json({ error: "EO ID is required" });
    }

    const eventsSnap = await db
      .collection("events")
      .where("eo_id", "==", eoId)
      .get();

    if (eventsSnap.empty) {
      return res.status(404).json({ error: "No events found for this EO" });
    }

    const eventIds = eventsSnap.docs.map((doc) => doc.id);

    const proposalPromises = eventIds.map(async (eventId) => {
      const proposalsSnap = await db
        .collection("umkmproposal")
        .where("eventId", "==", eventId)
        .get();

      const proposalPromises = proposalsSnap.docs.map(async (doc) => {
        const proposalData = doc.data();

        let umkmData = null;
        if (proposalData.umkmId) {
          try {
            const umkmQuery = await db
              .collection("users")
              .where("uid", "==", proposalData.umkmId)
              .get();

            if (!umkmQuery.empty) {
              const umkmDoc = umkmQuery.docs[0];

              umkmData = {
                id: umkmDoc.id,
                ...umkmDoc.data(),
              };
            }
          } catch (error) {
            console.error(
              `Error fetching UMKM data for ID ${proposalData.umkmId}:`,
              error
            );
          }
        }

        let eventData = null;
        try {
          const eventDoc = await db.collection("events").doc(eventId).get();
          if (eventDoc.exists) {
            eventData = {
              id: eventDoc.id,
              ...eventDoc.data(),
            };
          }
        } catch (error) {
          console.error(`Error fetching event data for ID ${eventId}:`, error);
        }

        return {
          id: doc.id,
          ...proposalData,
          umkm: umkmData,
          event: eventData,
        };
      });

      return Promise.all(proposalPromises);
    });

    const proposalArrays = await Promise.all(proposalPromises);
    const proposals = proposalArrays.flat();

    if (proposals.length === 0) {
      return res.status(404).json({ error: "No proposals found for this EO" });
    }

    req.proposals = proposals;
    next();
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
}

async function updateProposalStatus(req, res) {
  try {
    const proposalId = req.params.id;
    const { status, description } = req.body;

    if (!proposalId) {
      return res.status(400).json({ error: "Proposal ID is required" });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'accepted' or 'rejected'",
      });
    }

    const proposalRef = db.collection("umkmproposal").doc(proposalId);
    const proposalDoc = await proposalRef.get();

    const eoId = req.user.uid;

    if (!proposalDoc.exists) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const proposalData = proposalDoc.data();

    const eventDoc = await db
      .collection("events")
      .doc(proposalData.eventId)
      .get();

    if (!eventDoc.exists || eventDoc.data().eo_id !== eoId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this proposal" });
    }

    await proposalRef.update({
      status,
      description: description || null,
      updatedAt: new Date(),
    });

    if (status === "accepted") {
      const eventDoc = await db
        .collection("events")
        .doc(proposalData.eventId)
        .get();
      if (eventDoc.exists) {
        eventDoc.ref.update({
          list_umkm: admin.firestore.FieldValue.arrayUnion(proposalData.umkmId),
        });
      } else {
        console.error(`Event with ID ${proposalData.eventId} not found.`);
      }
    }

    res.status(200).json({
      id: proposalDoc.id,
      ...proposalData,
      status,
      description,
    });
  } catch (error) {
    console.error("Error updating proposal status:", error);
    res.status(500).json({ error: "Failed to update proposal status" });
  }
}

module.exports = {
  addProposal,
  getAllProposalByEO,
  updateProposalStatus,
};
