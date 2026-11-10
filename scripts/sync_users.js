const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();

async function run() {
  const conn = await mongoose.connect(uri);
  const db = conn.connection.client.db('clinicDB');
  const crypto = require('crypto');

  const superHash = crypto.createHash('sha256').update('Superadmin123').digest('hex');
  const adminHash = crypto.createHash('sha256').update('Password123').digest('hex');

  const clinic = await db.collection('clinics').findOne({ slug: 'ak-sharma' });

  // 1. superadmin@dentalos.com
  await db.collection('users').updateOne(
    { email: 'superadmin@dentalos.com' },
    {
      $set: {
        name: 'SaaS Super Admin',
        email: 'superadmin@dentalos.com',
        password: superHash,
        role: 'admin',
        isActive: true,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  // 2. admin@sharmadental.com
  await db.collection('users').updateOne(
    { email: 'admin@sharmadental.com' },
    {
      $set: {
        name: 'Clinic Administrator',
        email: 'admin@sharmadental.com',
        password: adminHash,
        clinicId: clinic ? clinic._id : null,
        role: 'owner',
        isActive: true,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  // 3. sharma@launchstack.com
  await db.collection('users').updateOne(
    { email: 'sharma@launchstack.com' },
    {
      $set: {
        name: 'Dir Anil kumar',
        email: 'sharma@launchstack.com',
        password: adminHash,
        clinicId: clinic ? clinic._id : null,
        role: 'owner',
        isActive: true,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  console.log('All users synced successfully!');
  process.exit(0);
}
run();
