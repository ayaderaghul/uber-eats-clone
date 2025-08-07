const initializeRabbitMQ = require('./rabbitmq');
// const initializeDatabase = require('./database');
// ... other initializers ...

module.exports = async function initializeApp() {
  try {
    // await initializeDatabase();
    await initializeRabbitMQ();
    // ... other initializations ...
    console.log('🚀 All systems initialized');
  } catch (error) {
    console.error('🔥 Initialization failed:', error);
    process.exit(1);
  }
};