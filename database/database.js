const admin = require("firebase-admin");

const serviceAccount = require("../marketin-3a1b3-firebase-adminsdk-fbsvc-cfaef28dc2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore
const db = admin.firestore();

// Authentication
const auth = admin.auth();

module.exports = { admin, db, auth };
