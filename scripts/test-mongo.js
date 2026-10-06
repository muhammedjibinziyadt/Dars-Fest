const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env manually to avoid dotenv dependency issues if not installed
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
}

const uri = env.MONGODB_URI;
console.log('MongoDB URI present:', !!uri);

if (!uri) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then(async () => {
    console.log('Successfully connected to MongoDB!');
    console.log('Database name:', mongoose.connection.name);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing collections in MongoDB:', collections.map(c => c.name));
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
