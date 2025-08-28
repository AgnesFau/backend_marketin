var express = require("express");
var swaggerDoc = require("swagger-jsdoc");
var swaggerUI = require("swagger-ui-express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var testsRouter = require("./routes/tests");

var app = express();

var options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Yareu API",
      version: "1.0.0",
      description: "API documentation for Yareu",
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
 * /users/login:
 *   post:
 *     summary: Login user dengan email & password (Firebase Authentication)
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
 *         description: Login sukses, return token
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
 *         description: Email atau password salah
 */

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/tests", testsRouter);

module.exports = app;
