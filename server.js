require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || '1010';


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors())
app.use(express.json())


const userRoute = require('./routes/user')
app.use('/api/user', userRoute)

const apiRoute = require('./routes/apiv1')
app.use('/api/v1', apiRoute)




app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "ABC123"; // Use the same token you entered in the Verify token field
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {            
            res.sendStatus(403);
        }
    }
});

app.post('/webhook', async (req, res) => {
    const body = req.body;
    console.log("Received webhook event:", JSON.stringify(body, null, 2));

    // Check if the event is for the WhatsApp Business Account and has message data
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            // Check for message updates in the changes array
            entry.changes.forEach(change => {
                if (change.value && change.value.messages) {
                    // Loop through each message
                    change.value.messages.forEach(message => {
                        console.log("Received message from user:", message);
                        // Access message text, sender ID, etc.
                        const messageText = message.text ? message.text.body : null;
                        const senderId = message.from;
                        console.log("Message Text:", messageText);
                        console.log("Sender ID:", senderId);
                    });
                }
            });
        });
    }
    res.status(200).end();
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
