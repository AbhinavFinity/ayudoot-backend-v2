const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));

// --- CREDENTIALS WILL BE SET IN RENDER ENVIRONMENT ---
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const DIALOGFLOW_PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID;
const TWILIO_SANDBOX_NUMBER = 'whatsapp:+14155238886'; // This is the standard Twilio Sandbox number

// Create Dialogflow session client
const dialogflowSessionClient = new SessionsClient({
  // This will use the GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable automatically
});

// Webhook endpoint for Twilio
app.post('/webhook', async (req, res) => {
    const userMessage = req.body.Body;
    const userPhoneNumber = req.body.From;

    console.log(`Message from ${userPhoneNumber}: ${userMessage}`);

    try {
        const dialogflowResponse = await sendToDialogflow(userMessage, userPhoneNumber);
        const replyText = dialogflowResponse.queryResult.fulfillmentText;
        await sendTwilioMessage(replyText, userPhoneNumber);
    } catch (error) {
        console.error('Error processing message:', error);
    }

    res.status(200).send('OK');
});

// Function to send a query to Dialogflow
async function sendToDialogflow(text, sessionId) {
    const sessionPath = dialogflowSessionClient.projectAgentSessionPath(DIALOGFLOW_PROJECT_ID, sessionId);
    const request = {
        session: sessionPath,
        queryInput: { text: { text: text, languageCode: 'en-US' } },
    };
    const [response] = await dialogflowSessionClient.detectIntent(request);
    console.log('Dialogflow response:', response.queryResult.fulfillmentText);
    return response;
}

// Function to send a reply via Twilio
async function sendTwilioMessage(text, targetNumber) {
    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
        body: text,
        from: TWILIO_SANDBOX_NUMBER,
        to: targetNumber
    });
    console.log(`Sent Twilio message to ${targetNumber}: ${text}`);
}

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});
