const { UserRecord } = require("firebase-admin/auth");
const { auth, db } = require("../database/firebase");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; 

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function getUserData(req, res, next) {
  try {
    const uid = req.user.uid;

    const userDoc = await db
      .collection("users")
      .where("uid", "==", uid)
      .get();
    if (userDoc.empty) {
      return res.status(404).json({ error: "User not found in database" });
    }

    req.user = {
      uid,
      email: req.user.email,
      ...userDoc.docs[0].data(),
    };

    next();
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
}

module.exports = { authenticateToken, getUserData };