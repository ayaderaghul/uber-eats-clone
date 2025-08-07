const amqp = require('amqplib');

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            ORDER_CREATED: 'order_created',
            DRIVER_RESPONSES: 'driver_responses',
            ORDER_ACCEPTED: 'order_accepted',
            ORDER_CANCELLED: 'order_cancelled'
        };
        this.exchanges = {
            ORDER_EVENTS: 'order_events',
            DRIVER_NOTIFICATIONS: 'driver_notifications'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect('amqp://admin:password@localhost');
            this.channel = await this.connection.createChannel();
            
            // Declare exchanges first
            await this.channel.assertExchange(this.exchanges.ORDER_EVENTS, 'fanout', { durable: true });
            await this.channel.assertExchange(this.exchanges.DRIVER_NOTIFICATIONS, 'direct', { durable: true });
            
            // Declare queues
            await this.channel.assertQueue(this.queues.ORDER_CREATED, { durable: true });
            await this.channel.assertQueue(this.queues.DRIVER_RESPONSES, { durable: true });
            await this.channel.assertQueue(this.queues.ORDER_ACCEPTED, { 
                durable: true,
                deadLetterExchange: '',
                deadLetterRoutingKey: this.queues.ORDER_CANCELLED
            });
            await this.channel.assertQueue(this.queues.ORDER_CANCELLED, { durable: true });
            
            // Bind queues to exchanges
            await this.channel.bindQueue(this.queues.ORDER_CREATED, this.exchanges.ORDER_EVENTS, '');
            await this.channel.bindQueue(this.queues.DRIVER_RESPONSES, this.exchanges.DRIVER_NOTIFICATIONS, 'response');
            
            console.log('RabbitMQ connected and setup complete');
            return this;
        } catch (error) {
            console.error('RabbitMQ connection error:', error);
            throw error;
        }
    }

    async publish(exchange, routingKey, message, options = {}) {
        if (!this.channel) {
            await this.connect();
        }
        try {
            await this.channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true, ...options }
            );
        } catch (error) {
            console.error('Publish error:', error);
            throw error;
        }
    }

    async assertQueue(queue, options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel.assertQueue(queue, options);
  }

  async bindQueue(queue, exchange, routingKey) {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel.bindQueue(queue, exchange, routingKey);
  }

  async getChannel() {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel;
  }

  

    async consume(queue, callback, options = {}) {
        if (!this.channel) {
            await this.connect();
        }
        try {
            await this.channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        this.channel.ack(msg);
                    } catch (error) {
                        console.error('Message processing error:', error);
                        this.channel.nack(msg, false, false);
                    }
                }
            }, options);
        } catch (error) {
            console.error('Consume error:', error);
            throw error;
        }
    }

    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}

// Singleton instance
const rabbitmq = new RabbitMQ();
module.exports = rabbitmq;