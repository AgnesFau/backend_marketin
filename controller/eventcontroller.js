const { db } = require("../database/firebase");
const supabase = require("../database/supabase");
  
async function getEventDataById(req, res, next) {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    req.event = eventDoc.data();
    next();
  } catch (error) {
    console.error("Error fetching event data:", error);
    res.status(500).json({ error: "Failed to fetch event data" });
  }
}

async function getEventDataByEO(req, res, next) {
  try {
    const eo_id = req.params.id;
    const eventDocs = await db
      .collection("events")
      .where("eo_id", "==", eo_id)
      .get();

    if (eventDocs.empty) {
      return res.status(404).json({ error: "No events found for this EO" });
    }

    req.events = eventDocs.docs.map((doc) => doc.data());
    next();
  } catch (error) {
    console.error("Error fetching events by EO:", error);
    res.status(500).json({ error: "Failed to fetch events by EO" });
  }
}

async function getAllEventData(req, res, next) {
  try {
    const eventDocs = await db.collection("events").get();

    if (eventDocs.empty) {
      return res.status(404).json({ error: "No events found" });
    }

    req.events = eventDocs.docs.map((doc) => doc.data());
    next();
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ error: "Failed to fetch all events" });
  }
}

async function addNewEvent(req, res, next) {
  try {
    const {
      name,
      address,
      description,
      category,
      price,
      date,
      contact_person,
      close_registration,
    } = req.body;

    if (
      !name ||
      !address ||
      !description ||
      !category ||
      !price ||
      !date ||
      !contact_person ||
      !close_registration
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const eo_id = req.user.uid;

    let posterUrl = null;
    if (req.files && req.files.poster) {
      const posterFile = req.files.poster[0];
      const { data, error: uploadError } = await supabase.storage
        .from("events")
        .upload(`posters/${eo_id}_${posterFile.originalname}`, posterFile.buffer, {
          contentType: posterFile.mimetype,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      posterUrl = supabase.storage.from("events").getPublicUrl(data.path)
        .data.publicUrl;
    }

    let mappingUrl = null;
    if (req.files && req.files.mapping) {
      const mappingFile = req.files.mapping[0];
      const mappingPath = `mappings/${eo_id}_${mappingFile.originalname}`;

      const { data, error: mappingError } = await supabase.storage
        .from("events")
        .upload(mappingPath, mappingFile.buffer, {
          contentType: mappingFile.mimetype,
          upsert: true,
        });

      if (mappingError) throw mappingError;

      mappingUrl = supabase.storage.from("events").getPublicUrl(data.path)
        .data.publicUrl;
    }

    const newEvent = {
      name,
      address,
      description,
      mapping: mappingUrl,
      category,
      price,
      date,
      poster: posterUrl,
      contact_person,
      close_registration,
      eo_id,
      createdAt: new Date().toISOString(),
    };

    const eventRef = await db.collection("events").add(newEvent);

    res.status(201).json({ id: eventRef.id, ...newEvent });
  } catch (error) {
    console.error("Error adding new event:", error);
    res.status(500).json({ error: "Failed to add new event" });
  }
}

module.exports = {
  getEventDataById,
  getEventDataByEO,
  getAllEventData,
  addNewEvent,
};