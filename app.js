var express = require("express");
var swaggerDoc = require("swagger-jsdoc");
var swaggerUI = require("swagger-ui-express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var testsRouter = require("./routes/tests");
var authRouter = require("./routes/auth");

var app = express();

var options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "MarketiIn API",
      version: "1.0.0",
      description: "API documentation for MarketiIn",
    },
  },
  apis: ["app.js"],
};

var swagger = swaggerDoc(options);
app.use("/swaggerdocs", swaggerUI.serve, swaggerUI.setup(swagger));

/**
 * @openapi
 * /tests/hello:
 *   get:
 *     description: "Returns a hello world message"
 *     responses:
 *       200:
 *         description: "A hello world message"
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
 * /auth/register:
 *   post:
 *     summary: Register user baru dengan email, password, username, nama organisasi, dan logo image
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
 *         description: User berhasil terdaftar
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
 *         description: Error server atau upload gagal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Firebase or Supabase error message
 * /auth/send-otp:
 *   post:
 *     summary: Mengirim OTP ke email
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
 *         description: OTP berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Email tidak ada / invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email is required
 * /auth/verify-otp:
 *   post:
 *     summary: Verifikasi OTP
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
 *         description: OTP berhasil diverifikasi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: OTP salah atau expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid OTP
 */

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/tests", testsRouter);

module.exports = app;