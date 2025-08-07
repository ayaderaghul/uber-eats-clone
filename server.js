const runNotificationConsumer = require('./src/services/notificationService')
const initializeApp = require('./src/initializers')

const app = require('./src/app')
const PORT = process.env.PORT || 5000

initializeApp().then(() => {
    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`)
        runNotificationConsumer()
    })
})


