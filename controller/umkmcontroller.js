const { db } = require("../database/firebase");

async function getAllUMKMData(req, res, next) {
  try {
    const umkmDocs = await db
      .collection("users")
      .where("role", "==", "UMKM")
      .get();

    if (umkmDocs.empty) {
      return res.status(404).json({ error: "No UMKM found" });
    }

    req.umkm = umkmDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    next();
  } catch (error) {
    console.error("Error fetching all UMKM:", error);
    res.status(500).json({ error: "Failed to fetch all UMKM" });
  }
}

module.exports = { getAllUMKMData };
