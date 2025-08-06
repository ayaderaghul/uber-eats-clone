const {Kafka} = require('kafkajs')

const kafka = new Kafka({
    clientId: 'ubereats-clone',
    brokers: ['localhost:9092'] // kafka broker url

})

const producer = kafka.producer()
const consumer = kafka.consumer({groupId: 'ubereats-group'})

module.exports = {kafka, producer, consumer}