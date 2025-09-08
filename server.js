
const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));


const TWILIO_ACCOUNT_SID = 'AC89621955be33f8188c37430f6b435203'; 
const TWILIO_AUTH_TOKEN = '60ffaaa40815406ef3b328b26bf4d0d4';               
const DIALOGFLOW_PROJECT_ID = 'ayudootjaipur-tigf';

const dialogflowSessionClient = new SessionsClient({
  
});

app.post('/webhook', async (req, res) => {
    console.log('Received from Twilio:', JSON.stringify(req.body, null, 2));

    const userMessage = req.body.Body;
    const sessionId = req.body.From || 'default-whatsapp-session';
    
    console.log(`Message from ${sessionId}: ${userMessage}`);

    try {
        const dialogflowResponse = await sendToDialogflow(userMessage, sessionId);
        const replyText = dialogflowResponse.queryResult.fulfillmentText;
        
        if (replyText) {
            await sendTwilioMessage(replyText, sessionId);
        } else {
            console.log('Dialogflow did not return a fulfillment text.');
        }

    } catch (error) {
        console.error('Error processing message:', error);
    }
    
    res.status(200).send('OK');
});

async function sendToDialogflow(text, sessionId) {
    const sessionPath = dialogflowSessionClient.projectAgentSessionPath(DIALOGFLOW_PROJECT_ID, sessionId);
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'en-US',
            },
        },
    };
    const [response] = await dialogflowSessionClient.detectIntent(request);
    console.log('Dialogflow response:', response.queryResult.fulfillmentText);
    return response;
}

async function sendTwilioMessage(text, targetNumber) {
    if (targetNumber === 'default-whatsapp-session') {
        console.error('Cannot send Twilio message: Target phone number is missing.');
        return;
    }

    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
        body: text,
        from: 'whatsapp:+14155238886', // This is the Twilio Sandbox Number
        to: targetNumber
    });
    console.log(`Sent Twilio message to ${targetNumber}: ${text}`);
}

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});
