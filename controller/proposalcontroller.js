const { db } = require("../database/firebase");
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
    };
    
    const proposalRef = await db.collection("umkmproposal").add(proposalData);
    res.status(201).json({ id: proposalRef.id, ...proposalData });
  } catch (error) {
    console.error("Error adding proposal:", error);
    res.status(500).json({ error: "Failed to add proposal" });
  }
}

module.exports = {
  addProposal,
};