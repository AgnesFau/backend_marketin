require("dotenv").config();
var express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { auth, db } = require("../database/firebase");
const supabase = require("../database/supabase");

const otpStore = new Map();
const upload = multer({ storage: multer.memoryStorage() });
var express = require('express');
var router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { email, password, username, companyName, role } = req.body;
    const file = req.file;

    if (!email || !password || !username || !companyName || !file || !role) {
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
      role,
    });

    if (dbError) throw dbError;

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      email: userRecord.email,
      username,
      companyName,
      logoUrl,
      role,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* POST send OTP */
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore.set(email, { otp, expiresAt });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
      `,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Email sending failed:", error);
    otpStore.delete(email);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
});

/* POST verify OTP */
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore.get(email);

  if (!record)
    return res.status(400).json({ error: "No OTP sent to this email" });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP expired" });
  }
  if (otp !== record.otp) return res.status(400).json({ error: "Invalid OTP" });

  otpStore.delete(email);
  res.json({ message: "OTP verified successfully" });
});

module.exports = router;