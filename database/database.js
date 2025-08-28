const admin = require("firebase-admin");

const firebaseConfig = {
  apiKey: "AIzaSyChaoS6Ep5C9fph8_Dohs-XsHo6r6cwIFc",
  authDomain: "marketin-3a1b3.firebaseapp.com",
  projectId: "marketin-3a1b3",
  messagingSenderId: "385478346259",
};

admin.initializeApp(firebaseConfig);

const db = admin.firestore();

const auth = admin.auth();

module.exports = { admin, db, auth };
