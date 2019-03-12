const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState, CardFactory, MessageFactory } = require("botbuilder");
const restify = require("restify");
const { LoopBot } = require("./bot");
const { BotConfiguration } = require('botframework-config');
const path = require('path');
const { GifError } = require("./dialogs/shared/gifs");


// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
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
    await context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Oops.", "Es tut mir leid, aber etwas ist bei mir schiefgelaufen, bitte versuche es später noch einmal!\n![Error Gif](" + GifError() + ")")));
    // Clear out state
    await conversationState.delete(context);
};

// Define the state store for your Mayu.
// A bot requires a state storage system to persist the dialog and user state between messages.
// For dev: MemoryStorage
const memoryStorage = new MemoryStorage();
// For prod: in a SQL Db
// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });

// Create conversation and user state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);


// Map the contents to the required format for `LuisRecognizer`.
const luisApplication = {
    applicationId: "", // luisConfig.appId,
    endpointKey: "", // luisConfig.subscriptionKey || luisConfig.authoringKey,
    endpoint: "" // luisConfig.getEndpoint()
};

// Create configuration for LuisRecognizer's runtime behavior.
const luisPredictionOptions = {
    includeAllIntents: true,
    log: true,
    staging: false
};

let loop;
try {
    loop = new LoopBot(conversationState, userState);
} catch (err) {
    console.error(`[botInitializationError]: ${err}`);
    process.exit();
}

server.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await loop.onTurn(context);
    })

})