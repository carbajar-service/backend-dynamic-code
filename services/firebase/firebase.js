const admin = require("firebase-admin");
const config = require("../../config/index.js")

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.FIREBASE_PROJECT_ID,
    privateKeyId: config.FIREBASE_PRIVATE_KEY_ID,
    privateKey: config.FIREBASE_PRIVATE_KEY,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    clientId: config.FIREBASE_CLIENT_ID
  }),
});;

module.exports = admin;
