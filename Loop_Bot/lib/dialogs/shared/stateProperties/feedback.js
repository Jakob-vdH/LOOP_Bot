const { feedbackModel } = require("../dbConnector");
const annonymizedFeedback = require("../../../config.json").annonymizedFeedback;

class Feedback {
    constructor(userId, rating, feedbackText, chapter) {
        this.userId = userId;
        this.rating = rating;
        this.feedbackText = feedbackText;
        this.chapter = chapter;
    }

    saveToDB() {
        let userId = this.userId;
        if (annonymizedFeedback) {
            userId = "annonymous";
        }
        let feedback = new feedbackModel({ userId: userId, rating: this.rating, feedbackText: this.feedbackText, chapter: this.chapter });
        feedback.save()
            .then(doc => {
                console.log(`New Feedback entry created with user id ${doc.userId} `);
                //resolve(doc);
            })
            .catch(err => {
                console.error(err);
                //reject(null);
            })
        //});
    }
}

module.exports = { Feedback: Feedback };