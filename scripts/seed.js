// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const connectDB = require('../src/config/db');
const User = require('../src/models/userModel');

(async () => {
  try {
    await connectDB();

    // Resolve file path reliably no matter where npm is run from
    const file = path.resolve(__dirname, '../data/users.sample.json');

    if (!fs.existsSync(file)) {
      throw new Error(`Seed file not found: ${file}`);
    }

    const users = JSON.parse(fs.readFileSync(file, 'utf8'));

    // wipe & seed (remove deleteMany if you want additive seeds)
    await User.deleteMany({});
    await User.create(users); // triggers password hashing hook

    console.log(`✅ Seeded ${users.length} users`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
})();
