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
    const eo_id = req.user.uid;
    const eventDocs = await db
      .collection("events")
      .where("eo_id", "==", eo_id)
      .get();

    if (eventDocs.empty) {
      return res.status(404).json({ error: "No events found for this EO" });
    }

    req.events = eventDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
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

    req.events = eventDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    next();
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ error: "Failed to fetch all events" });
  }
}

async function addNewEvent(req, res, next) {
  try {
    let {
      name,
      address,
      description,
      category,
      date,
      contact_person,
      close_registration,
    } = req.body;

    if (
      !name ||
      !address ||
      !description ||
      !category ||
      !date ||
      !contact_person ||
      !close_registration
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Category parsed:", category);

    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Category must be valid JSON" + err });
      }
    }

    console.log("Category parsed:", category);

    if (typeof category !== "object" || Array.isArray(category)) {
      return res
        .status(400)
        .json({ error: "Category must be a map of position and price" });
    }

    const eo_id = req.user.uid;
    const status = "active";

    let posterUrl = null;
    if (req.files && req.files.poster) {
      const posterFile = req.files.poster[0];
      const { data, error: uploadError } = await supabase.storage
        .from("events")
        .upload(
          `posters/${eo_id}_${posterFile.originalname}`,
          posterFile.buffer,
          {
            contentType: posterFile.mimetype,
            upsert: true,
          }
        );

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
      date,
      poster: posterUrl,
      contact_person,
      close_registration,
      eo_id,
      status,
      createdAt: new Date().toISOString(),
    };

    const eventRef = await db.collection("events").add(newEvent);

    res.status(201).json({ id: eventRef.id, ...newEvent });
  } catch (error) {
    console.error("Error adding new event:", error);
    res.status(500).json({ error: "Failed to add new event" + err });
  }
}

async function updateEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    let {
      name,
      address,
      description,
      category,
      date,
      contact_person,
      close_registration,
    } = req.body;

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingEvent = eventDoc.data();

    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Category must be valid JSON: " + err });
      }
    }

    if (category && (typeof category !== "object" || Array.isArray(category))) {
      return res
        .status(400)
        .json({ error: "Category must be a map of position and price" });
    }

    const eo_id = req.user.uid;

    let posterUrl = existingEvent.poster || null;
    if (req.files && req.files.poster) {
      const posterFile = req.files.poster[0];
      const { data, error: uploadError } = await supabase.storage
        .from("events")
        .upload(
          `posters/${eo_id}_${posterFile.originalname}`,
          posterFile.buffer,
          {
            contentType: posterFile.mimetype,
            upsert: true,
          }
        );

      if (uploadError) throw uploadError;

      posterUrl = supabase.storage.from("events").getPublicUrl(data.path)
        .data.publicUrl;
    }

    let mappingUrl = existingEvent.mapping || null;
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

    const updatedEvent = {
      ...(name && { name }),
      ...(address && { address }),
      ...(description && { description }),
      ...(category && { category }),
      ...(date && { date }),
      ...(contact_person && { contact_person }),
      ...(close_registration && { close_registration }),
      poster: posterUrl,
      mapping: mappingUrl,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("events").doc(eventId).update(updatedEvent);

    res.status(200).json({ id: eventId, ...existingEvent, ...updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event: " + error.message });
  }
}

module.exports = {
  getEventDataById,
  getEventDataByEO,
  getAllEventData,
  addNewEvent,
  updateEvent,
};
