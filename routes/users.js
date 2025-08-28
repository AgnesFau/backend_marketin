var express = require("express");
const axios = require("axios");
const multer = require("multer");

const { createClient } = require("@supabase/supabase-js");
const { auth, db } = require("../database/database");

var router = express.Router();

const supabase = createClient(
  "https://hxicdshfsslwfikokfly.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aWNkc2hmc3Nsd2Zpa29rZmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk4NDcsImV4cCI6MjA3MTk3NTg0N30.GN_how0pBwr_Ffomgotu6xRQ2ar73eR8m8iM_KHt_lI"
);
const upload = multer({ storage: multer.memoryStorage() });

/* POST login */
router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyChaoS6Ep5C9fph8_Dohs-XsHo6r6cwIFc`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    res.status(401).json({ error: "Invalid email or password" + err.message });
  }
});

/* POST register */
router.post("/register", upload.single("logo"), async (req, res) => {
  try {
    const { email, password, username, companyName } = req.body;
    const file = req.file;

    if (!email || !password || !username || !companyName || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });

    const { data, error: uploadError } = await supabase.storage
      .from("organization_logo")
      .upload(`logo/${userRecord.uid}_${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = supabase.storage
      .from("organization_logo")
      .getPublicUrl(`logo/${userRecord.uid}_${file.originalname}`);

    if (urlError) throw urlError;

    const logoUrl = urlData.publicUrl;

    const { error: dbError } = await db.collection("users").add({
      uid: userRecord.uid,
      username,
      companyName,
      logoUrl: logoUrl || "",
    });

    if (dbError) throw dbError;

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      email: userRecord.email,
      username,
      companyName,
      logoUrl,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
