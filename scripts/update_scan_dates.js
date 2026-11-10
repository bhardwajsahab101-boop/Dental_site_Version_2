const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();

async function run() {
  const conn = await mongoose.connect(uri);
  const db = conn.connection.client.db('dentalos');
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const scans = await db.collection('scandocuments').find({}).toArray();
  for (const s of scans) {
    if (Array.isArray(s.entries) && s.entries.length > 0) {
      const updatedEntries = s.entries.map(e => {
        return {
          ...e,
          fields: {
            ...e.fields,
            visitDate: {
              value: todayStr,
              confidence: 100,
              flag: 'high'
            }
          }
        };
      });
      await db.collection('scandocuments').updateOne(
        { _id: s._id },
        { $set: { entries: updatedEntries } }
      );
      console.log('Updated scan:', s._id, 'with today date:', todayStr);
    }
  }
  console.log('All scans successfully updated to today:', todayStr);
  process.exit(0);
}
run();

