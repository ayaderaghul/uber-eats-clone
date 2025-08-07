const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Find all users where location is malformed
  const brokenUsers = await User.find({ 'location.coordinates.type': 'Point' });

  for (const user of brokenUsers) {
    // Example fix: set a default coordinates value or remove the location
    user.location = {
      type: 'Point',
      coordinates: [0, 0], // You may want to set meaningful default
    };
    await user.save();
    console.log(`Fixed user: ${user._id}`);
  }

  mongoose.connection.close();
})();
