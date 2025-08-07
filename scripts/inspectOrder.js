// inspect-queue.js
const amqp = require('amqplib');

async function inspectQueue(queueName) {
  const conn = await amqp.connect('amqp://admin:password@localhost');
  const channel = await conn.createChannel();
  
  // Get message without acking (will remain in queue)
  const msg = await channel.get(queueName, { noAck: false });
  
  if (msg) {
    console.log('Message content:', msg.content.toString());
    // channel.nack(msg, false, true); // Return to queue
  } else {
    console.log('No messages in queue');
  }
  
  await channel.close();
  await conn.close();
}

inspectQueue('order_created').catch(console.error);