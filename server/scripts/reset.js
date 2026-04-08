import mongoose from 'mongoose';
import fs from 'fs';

const mongoUri = fs.readFileSync('../credentials.txt', 'utf8').split('\n').find(l => l.startsWith('mongodb')).trim();

async function run() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const collectionsToDrop = [
    'reservations',
    'foliocharges',
    'invoices',
    'payments',
    'housekeepingtasks',
    'maintenancerequests',
    'servicerequests',
    'feedbacks',
    'inquiries',
    'notifications',
    'auditlogs'
  ];

  for (const collName of collectionsToDrop) {
    try {
      await db.collection(collName).deleteMany({});
      console.log('Cleared collection:', collName);
    } catch (e) {
      console.log('Skipping or error for:', collName, e.message);
    }
  }

  // Reset rooms
  await db.collection('rooms').updateMany({}, { 
    $set: { 
      status: 'available', 
      housekeepingStatus: 'clean' 
    } 
  });
  console.log('Reset all rooms to available and clean');

  process.exit(0);
}

run();
