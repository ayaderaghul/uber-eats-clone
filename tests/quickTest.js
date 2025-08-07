const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:9092']
});

async function test() {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: 'order_accepted',
    messages: [{ value: 'test message' }],
  });
  await producer.disconnect();
  console.log('✅ Message sent successfully');
}

test().catch(console.error);
