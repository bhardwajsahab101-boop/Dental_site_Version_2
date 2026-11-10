const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();

async function run() {
  const conn = await mongoose.connect(uri);
  const crypto = require('crypto');
  const adminHash = crypto.createHash('sha256').update('Password123').digest('hex');

  // Update in dentalos
  const dentalosDb = conn.connection.client.db('dentalos');
  await dentalosDb.collection('users').updateOne(
    { email: 'sharma@launchstack.com' },
    { $set: { password: adminHash } }
  );
  console.log('Updated sharma@launchstack.com password in dentalos to Password123');

  process.exit(0);
}
run();
