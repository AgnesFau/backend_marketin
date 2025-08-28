var express = require("express");
const { auth } = require("../database/database");
var router = express.Router();

/* GET all users */
router.get("/getallusers", async function (req, res, next) {
  try {
    const listUsers = await auth.listUsers(1000);
    const users = listUsers.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      disabled: user.disabled,
      metadata: user.metadata,
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
