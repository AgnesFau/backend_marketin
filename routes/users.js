var express = require("express");
const { auth } = require("../database/database");
const axios = require("axios");
var router = express.Router();

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

module.exports = router;
