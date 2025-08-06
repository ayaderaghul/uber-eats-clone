const {consumer} = require('../config/kafka')

const runNotificationConsumer = async() =>{
    await consumer.connect()
    await consumer.subscribe({topic: 'restaurant-events', fromBeginning: true})

    await consumer.run({
        eachMessage: async({topic, partition, message}) =>{
            const event=JSON.parse(message.value.toString())
            console.log('notification received', event)

            if(message.key.toString() === 'restaurant-created') {
                console.log(`sending welcome email for ${event.name}`)
            }
        }
    })
}

module.exports = runNotificationConsumer