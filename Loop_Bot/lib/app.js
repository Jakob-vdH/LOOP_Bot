const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState, CardFactory, MessageFactory } = require('botbuilder');
const restify = require('restify');
const { LoopBot } = require('./bot');
const { BotConfiguration } = require('botframework-config');
const path = require('path');
const { GifError } = require('./dialogs/shared/gifs');
// create a mongodb connection instance for mongoose
const { database } = require('./dialogs/shared/dbConnector');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log(`${server.name} listening on ${server.url}`);
});

// Create chat connector for communicating with the Bot Framework Service
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${error.message} \n ${error.stack} \n ${context}`);
  // Send a message to the user
  await context.sendActivity(MessageFactory.attachment(CardFactory.heroCard('Oops.', 'Es tut mir leid, aber etwas ist bei mir schiefgelaufen, bitte versuche es später noch einmal!\n\n![Error Gif](' + GifError() + ')')));
  // Clear out state
  await conversationState.delete(context);
};

let conversationState;
let userState;

const memoryStorage = new MemoryStorage();

// Configure the bot to use the adapter.
// Create conversation and user state with in-memory storage provider.
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

let loop;
try {
  loop = new LoopBot(conversationState, userState);
} catch (err) {
  console.error(`[botInitializationError]: ${err}`);
  process.exit();
}

server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async context => {
    await loop.onTurn(context);
  });
});
