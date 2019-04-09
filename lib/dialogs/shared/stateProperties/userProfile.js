const { Chapter } = require("./chapter");
const { userModel } = require("../dbConnector");

class UserProfile {
    /**
     * Entity Property constructor.
     * @param {String} userId sets the id of the current user, to save the current quiz progress
     * @param {Chapter} chapter1 data of chapter1 if existing
     * @param {Chapter} chapter2 data of chapter2 if existing
     * @param {Chapter} chapter3 data of chapter3 if existing
     * @param {Chapter} chapter4 data of chapter4 if existing
     * @param {Chapter} chapter5 data of chapter5 if existing
     */
    constructor(userId, chapter1, chapter2, chapter3, chapter4, chapter5) {
        this.userId = userId || "annonymous";
        this.chapter1 = chapter1 ? new Chapter(chapter1.questionsPool, chapter1.answeredQuestions, chapter1.falseQuestions, chapter1.language, chapter1.feedback) : new Chapter();
        this.chapter2 = chapter2 ? new Chapter(chapter2.questionsPool, chapter2.answeredQuestions, chapter2.falseQuestions, chapter2.language, chapter2.feedback) : new Chapter();
        this.chapter3 = chapter3 ? new Chapter(chapter3.questionsPool, chapter3.answeredQuestions, chapter3.falseQuestions, chapter3.language, chapter3.feedback) : new Chapter();
        this.chapter4 = chapter4 ? new Chapter(chapter4.questionsPool, chapter4.answeredQuestions, chapter4.falseQuestions, chapter4.language, chapter4.feedback) : new Chapter();
        this.chapter5 = chapter5 ? new Chapter(chapter5.questionsPool, chapter5.answeredQuestions, chapter5.falseQuestions, chapter5.language, chapter5.feedback) : new Chapter();
    }

    /**
     * Call to update userProfil in DB as well
     */
    async updateInDb() {
        let manager = new userProfileManager();
        await manager.updateExistingUser({ userId: this.userId, chapter1: this.chapter1, chapter2: this.chapter2, chapter3: this.chapter3, chapter4: this.chapter4, chapter5: this.chapter5 });
    }
}

/**
 * User Profile Manager for Database
 */
class userProfileManager {
    constructor() {
    }

    /**
     * CRUD Operations for DB connection
     */

    async getUser(userId) {
        return new Promise((resolve, reject) => {
            userModel
                .find({
                    userId: userId
                })
                .limit(1)
                .lean()
                .then(doc => {
                    if (doc.length == 1) {
                        resolve(doc[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject(null);
                })
        })
    }

    async createUser(userIn) {
        let user = new userModel(userIn);
        user.save()
            .then(doc => {
                console.log(`New User created with id ${doc.userId} `);
            })
            .catch(err => {
                console.error(err);
            })
    }

    async updateExistingUser(user) {
        userModel
            .findOneAndUpdate(
                { userId: user.userId },             // search query
                user,                                // field:values to update, in this case already defined by user object 
                {
                    new: true,                       // return updated doc
                    //runValidators: true              // validate before update
                })
            .lean()
            .then(doc => {
                // console.log(doc)
            })
            .catch(err => {
                console.error(err)
            })
    }

    async deleteExistingUser() {
        // 
    }

}

module.exports = {
    UserProfile: UserProfile,
    UserProfileManager: userProfileManager
}