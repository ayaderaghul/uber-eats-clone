const mongoose = require('mongoose');
const User = require('../src/models/User'); // Adjust path if needed
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    await User.collection.createIndex({ location: '2dsphere' });

    console.log('✅ 2dsphere index created on User.location');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to create index:', err);
    process.exit(1);
  });
