const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState, CardFactory, MessageFactory } = require("botbuilder");
const { CosmosDbStorage, AzureSqlClient, AzureBotStorage } = require('botbuilder-azure');
const restify = require("restify");
const { LoopBot } = require("./bot");
const { BotConfiguration } = require('botframework-config');
const path = require('path');
const { GifError } = require("./dialogs/shared/gifs");
// create a mongodb connection instance for mongoose
const { database } = require("./dialogs/shared/dbConnector");
// const botbuilder_mongo = require('botbuilder-mongodb');
// const { MongoClient } = require('mongodb'); // v3.x.x
// const { MongoBotStorage } = require('../../botbuilder-storage/src/index');


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
    await context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Oops.", "Es tut mir leid, aber etwas ist bei mir schiefgelaufen, bitte versuche es später noch einmal!\n\n![Error Gif](" + GifError() + ")")));
    // Clear out state
    await conversationState.delete(context);
};

// Define the state store for your Mayu.
// A bot requires a state storage system to persist the dialog and user state between messages.
// For dev: MemoryStorage
// const memoryStorage = new MemoryStorage();
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

let conversationState;
let userState;

/**
 * Tries to connect to various DBs that are not hosted on Azure using provided
 *  Frameworks for Azrue or Botframework SDK v3
 */

// const storage = new CosmosDbStorage({
//     serviceEndpoint: "http://cosmos:27017",
//     authKey: "",
//     databaseId: "BotStorage",
//     collectionId: "ContextData"
// });

// Create access to Cosmos DB storage.
//Add CosmosDB 
// const storage = new CosmosDbStorage({
//     serviceEndpoint: "",
//     authKey: '',
//     databaseId: 'BotStorage',
//     collectionId: "ContextData"
// })

// try {
//     // Connect to your host
//     MongoClient.connect("mongodb://mongo:27017", (err, client) => {
//         if (err) { throw err };

//         // Define the adapter settings
//         const settings = {
//             // Required. This is the collection where all
//             // the conversation state data will be saved.
//             collection: "ContextData",

//             // Optional but recommended!
//             ttl: {
//                 userData: 3600 * 24 * 365, // a year
//                 conversationData: 3600 * 24 * 7, // a week
//                 privateConversationData: 3600 * 24 * 7
//             }
//         };
//         // Select the datebase with the client
//         client = client.db('BotStorage');

//         // Instantiate the adapter with the client and settings.
//         const adapter = new MongoBotStorage(client, settings);

// Create chat bot

//Store session and context into mnongodb
// const mongoOptions = {
//     ip: 'mongo',
//     port: '27017',
//     database: 'BotStorage',
//     collection: 'ContextData',
//     username: '',
//     password: '',
//     queryString: ''
// }

// const storage = botbuilder_mongo.GetMongoDBLayer(mongoOptions);

// var sqlConfig = {
//     userName: '',
//     password: '',
//     server: 'db:3306',
//     // enforceTable: true, // If this property is not set to true it defaults to false. When false if the specified table is not found, the bot will throw an error.
//     options: {
//         database: 'BotStorage',
//         table: 'ContextData',
//         encrypt: true,
//         rowCollectionOnRequestCompletion: true
//     }
// }

// var sqlClient = new AzureSqlClient(sqlConfig);

// var sqlStorage = new AzureBotStorage({ gzipData: false }, sqlClient);

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
//     });
// } catch (err) {
//     console.log(err);
// }

server.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await loop.onTurn(context);
    })

})