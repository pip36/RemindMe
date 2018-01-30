'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json())

const axios = require('axios')
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
        
        // Gets the body of the webhook event
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        }

      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {

      res.sendStatus(404);
    }
  
  });

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let verifyToken = process.env.VERIFY_TOKEN
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === verifyToken) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

  app.get('/', (req,res) => {
      res.send('Running...')
  })

    // Handles messages events
    function handleMessage(sender_psid, received_message) {
        let response;

        // Check if the message contains text
        if (received_message.text) {    
      
          // Create the payload for a basic text message
          response = {
            "text": `You sent the message: "${received_message.text}".`
          }
        }  
        
        // Sends the response message
        callSendAPI(sender_psid, response);    
      
    }

    // Handles messaging_postbacks events
    function handlePostback(sender_psid, received_postback) {

    }

    // Sends response messages via the Send API
    function callSendAPI(sender_psid, response) {
        // Construct the message body
        let request_body = {
            "recipient": {
                "id": sender_psid
            },
            "message": response
        }

        // Send the HTTP request to the Messenger Platform
        axios.post('https://graph.facebook.com/v2.6/me/messages?access_token=' + PAGE_ACCESS_TOKEN, request_body)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
    }

app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));