const { loggingModel } = require("../dbConnector");
const annonymizedLogger = require("../../../config.json").annonymizedLogger;

function saveToDB(userID, question, userAnswer, isAnswerForLuis, luisQuestion, luisIntent, chapter) {
    let userId = userID;
    if (annonymizedLogger) {
        userId = "annonymous";
    }
    let log = new loggingModel({ userId: userId, question: question, userAnswer: userAnswer, isAnswerForLuis: isAnswerForLuis, luisQuestion: luisQuestion, luisIntent: luisIntent, chapter: chapter });
    log.save()
        .then(doc => {
            console.log(`New Log entry created with user id ${doc.userId} `);
        })
        .catch(err => {
            console.error(err);
        })
}

module.exports = { saveLog: saveToDB };