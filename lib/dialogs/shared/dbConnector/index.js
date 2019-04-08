const mongoose = require("mongoose");
const schema = require('mongoose').Schema.Types;
const config = require("../../../config.json").db;

const server = config.server;
const server2 = config.server2;
const database = config.database;
const database2 = config.database2;
const database3 = config.database3;

let userProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    chapter1: {
        type: schema.Mixed
        // type: {
        //     questionsPool: { type: schema.Mixed },
        //     answeredQuestions: { type: schema.Mixed },
        //     falseQuestions: { type: schema.Mixed },
        //     language: { type: String },
        //     poolSize: { type: Number }
        // }
    },
    chapter2: {
        type: schema.Mixed
        // type: {
        //     questionsPool: { type: schema.Mixed },
        //     answeredQuestions: { type: schema.Mixed },
        //     falseQuestions: { type: schema.Mixed },
        //     language: { type: String },
        //     poolSize: { type: Number }
        // }
    },
    chapter3: {
        type: schema.Mixed
        // type: {
        //     questionsPool: { type: schema.Mixed },
        //     answeredQuestions: { type: schema.Mixed },
        //     falseQuestions: { type: schema.Mixed },
        //     language: { type: String },
        //     poolSize: { type: Number }
        // }
    },
    chapter4: {
        type: schema.Mixed
        // type: {
        //     questionsPool: { type: schema.Mixed },
        //     answeredQuestions: { type: schema.Mixed },
        //     falseQuestions: { type: schema.Mixed },
        //     language: { type: String },
        //     poolSize: { type: Number }
        // }
    },
    chapter5: {
        type: schema.Mixed
        // type: {
        //     questionsPool: { type: schema.Mixed },
        //     answeredQuestions: { type: schema.Mixed },
        //     falseQuestions: { type: schema.Mixed },
        //     language: { type: String },
        //     poolSize: { type: Number }
        // }
    },
    created_at: { type: Date, default: Date.now }
})

// several Feedback entries possible in one Database
let userFeedbackSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    rating: {
        type: Number
    },
    feedbackText: {
        type: String
    },
    chapter: {
        type: String
    },
    created_at: { type: Date, default: Date.now }
})

let botLoggerSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    question: {
        type: schema.Mixed
    },
    userAnswer: {
        type: String
    },
    isAnswerForLuis: {
        type: Boolean
    },
    luisQuestion: {
        type: String
    },
    luisIntent: {
        type: String
    },
    chapter: {
        type: String
    },
    created_at: { type: Date, default: Date.now }
})

/**
 * Turned Database class into a singleton by returning an instance of the class in the 
 * module.exports statement because we only need a single connection to the database.
 * ES6 makes it very easy to create a singleton (single instance) pattern because 
 * of how the module loader works by caching the response of a previously imported file.
 */
class Database {
    constructor() {
        this._connect()
    }

    _connect() {
        mongoose.connect(`mongodb://${server}/${database}`, { useNewUrlParser: true, autoIndex: false })
            .then(() => {
                console.log(`Database ${database} connection successful`)
            })
            .catch(err => {
                console.error(`Database connection error for ${server} trying ${server2}`)
                mongoose.connect(`mongodb://${server2}/${database}`, { useNewUrlParser: true })
                    .then(() => {
                        console.log(`Database ${database} connection successful`)
                    })
                    .catch(err => {
                        console.error(`Database connection error for ${server2} as well! Check if Database is running!`)
                    })
            })
    }
}

const userDatabase = mongoose.connection.useDb(database);
const feedbackDatabase = mongoose.connection.useDb(database2);
const loggingDatabase = mongoose.connection.useDb(database3);
const userModel = userDatabase.model('userModel', userProfileSchema);
const feedbackModel = feedbackDatabase.model('feedbackModel', userFeedbackSchema);
const loggingModel = loggingDatabase.model('loggingModel', botLoggerSchema);

module.exports = {
    database: new Database(),
    userModel: userModel,
    feedbackModel: feedbackModel,
    loggingModel: loggingModel
}