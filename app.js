var express = require("express");
var swaggerDoc = require("swagger-jsdoc");
var swaggerUI = require("swagger-ui-express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["app.js", "routes/*.js"],
};

var swagger = swaggerDoc(options);
app.use("/swaggerdocs", swaggerUI.serve, swaggerUI.setup(swagger));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);

module.exports = app;
