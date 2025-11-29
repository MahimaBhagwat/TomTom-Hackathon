const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // For development, you can use application default credentials
    admin.initializeApp();
  }
}

const db = admin.firestore();

// Reports collection
const reportsCollection = db.collection('reports');
const usersCollection = db.collection('users');
const panicLogsCollection = db.collection('panic_logs');

module.exports = {
  db,
  reportsCollection,
  usersCollection,
  panicLogsCollection
};

