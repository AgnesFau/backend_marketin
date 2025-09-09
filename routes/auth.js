require("dotenv").config();
var express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const multer = require("multer");
const qs = require("querystring");
const { auth, db } = require("../database/firebase");
const supabase = require("../database/supabase");

const otpStore = new Map();
const upload = multer({ storage: multer.memoryStorage() });
var express = require("express");
var router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* POST login */
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user with email & password (Firebase Authentication)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@gmail.com
 *               password:
 *                 type: string
 *                 example: testuser123
 *     responses:
 *       200:
 *         description: Login success, return token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                 localId:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Wrong email or password
 */
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
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register new user with email, password, username, company name, and logo image
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - companyName
 *               - logo
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email user
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: Password user
 *                 example: myPassword123
 *               username:
 *                 type: string
 *                 description: Username / display name
 *                 example: user123
 *               companyName:
 *                 type: string
 *                 description: Nama organisasi / perusahaan
 *                 example: My Company
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file
 *               role:
 *                 type: String
 *                 example: EO || UMKM
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 uid:
 *                   type: string
 *                   example: firebase-uid
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 username:
 *                   type: string
 *                   example: user123
 *                 companyName:
 *                   type: string
 *                   example: My Company
 *                 role:
 *                   type: String
 *                   example: EO || UMKM
 *                 logoUrl:
 *                   type: string
 *                   example: https://xyz.supabase.co/storage/v1/object/public/logos/user123_logo.png
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Firebase or Supabase error message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Firebase or Supabase error message
 */
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
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* POST send OTP */
/**
 * @openapi
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Email is invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email is required
 */
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

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Email sending failed:", error);
    otpStore.delete(email);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
});

/* POST verify OTP */
/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     summary: OTP Verification
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid OTP
 */
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

/* POST refresh token */
/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Generate new ID token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "YOUR_REFRESH_TOKEN"
 *     responses:
 *       200:
 *         description: Successfully generate new ID token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                   example: "3600"
 *       400:
 *         description: Refresh token is not given
 *       403:
 *         description: Refresh token invalid or expired
 *       500:
 *         description: Failed to process refresh token
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "No refresh token provided" });

    const body = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const refreshResponse = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
      body,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json({
      idToken: refreshResponse.data.id_token,
      expiresIn: refreshResponse.data.expires_in,
    });
  } catch (err) {
    console.error("Refresh token error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error?.message || err.message,
    });
  }
});

module.exports = router;