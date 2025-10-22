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
      categories,
      date,
      contact_person,
      close_registration,
    } = req.body;

    if (
      !name ||
      !address ||
      !description ||
      !categories ||
      !date ||
      !contact_person ||
      !close_registration
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof categories === "string") {
      try {
        categories = JSON.parse(categories);
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Categories must be valid JSON. " + err.message });
      }
    }

    if (!Array.isArray(categories)) {
      return res
        .status(400)
        .json({ error: "Categories must be an array of objects" });
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
      categories,
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
    res
      .status(500)
      .json({ error: "Failed to add new event: " + error.message });
  }
}

async function updateEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingEvent = eventDoc.data();
    const eo_id = req.user.uid;

    let {
      name,
      address,
      description,
      category,
      date,
      contact_person,
      close_registration,
    } = req.body;

    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Invalid category format. Must be valid JSON." });
      }
    }

    if (
      category &&
      (!Array.isArray(category) || typeof category !== "object")
    ) {
      return res.status(400).json({
        error:
          "Category must be an array of objects, e.g. [{id:'cat1',position:'VIP',price:600000}]",
      });
    }

    let posterUrl = existingEvent.poster || null;
    if (req.files && req.files.poster && req.files.poster.length > 0) {
      const posterFile = req.files.poster[0];
      const filePath = `posters/${eo_id}_${Date.now()}_${
        posterFile.originalname
      }`;

      const { data, error: uploadError } = await supabase.storage
        .from("events")
        .upload(filePath, posterFile.buffer, {
          contentType: posterFile.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Poster upload error:", uploadError.message);
        throw new Error("Failed to upload poster to Supabase.");
      }

      posterUrl = supabase.storage.from("events").getPublicUrl(data.path)
        .data.publicUrl;
    }

    let mappingUrl = existingEvent.mapping || null;
    if (req.files && req.files.mapping && req.files.mapping.length > 0) {
      const mappingFile = req.files.mapping[0];
      const filePath = `mappings/${eo_id}_${Date.now()}_${
        mappingFile.originalname
      }`;

      const { data, error: mappingError } = await supabase.storage
        .from("events")
        .upload(filePath, mappingFile.buffer, {
          contentType: mappingFile.mimetype,
          upsert: true,
        });

      if (mappingError) {
        console.error("Mapping upload error:", mappingError.message);
        throw new Error("Failed to upload mapping file to Supabase.");
      }

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

    const result = { id: eventId, ...existingEvent, ...updatedEvent };
    res.status(200).json({
      message: "Event successfully updated",
      event: result,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event: " + error.message });
  }
}

async function cancelEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingEvent = eventDoc.data();

    if (existingEvent.status === "cancelled") {
      return res.status(400).json({ error: "Event is already cancelled" });
    }

    const updatedData = {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };

    await eventRef.update(updatedData);

    res.status(200).json({
      id: eventId,
      ...existingEvent,
      ...updatedData,
    });
  } catch (error) {
    console.error("Error cancelling event:", error);
    res.status(500).json({ error: "Failed to cancel event: " + error.message });
  }
}

module.exports = {
  getEventDataById,
  getEventDataByEO,
  getAllEventData,
  addNewEvent,
  updateEvent,
  cancelEvent,
};
