const { shuffle } = require("../helpers");
const { Chapter } = require("./chapter");
const { userModel } = require("../dbConnector");
// TODO: move into config
const poolSize = 10;

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

        // this.questionsPool = questionsPool || [];
        // this.answeredQuestions = answeredQuestions || [];
        // this.falseQuestions = falseQuestions || [];
        // this.language = language || "German";
        // this.poolSize = poolSize;
        // this._userProfileManager = new userProfileManager();
        // this.userProfileManager.createUser({ userId, chapter1, chapter2, chapter3, chapter4, chapter5 });
        // this.userProfileManager.proxyfunction({ userId, chapter1, chapter2, chapter3, chapter4, chapter5 });
    }

    /**
     * @param {Chapter} chapter chapter data
     * @param {String} questionId questionId of question to be corrected
     * @param {Boolean} correct was the given questionId answered correctly
     */
    correct(chapter, questionId, correct) {
        if (correct) {
            if (chapter.falseQuestions.length > 0) {
                chapter.falseQuestions = this.arrayRemove(chapter.falseQuestions, questionId);
                // let i = this.falseQuestions.indexOf(questionId);
                // if (i != -1) {
                //     this.falseQuestions.splice(i, 1);
                // }

            }
            if (chapter.answeredQuestions.find(id => id === questionId) === undefined) {
                chapter.answeredQuestions.push(questionId);
            }
        } else {
            if (chapter.answeredQuestions.length > 0) {
                let i = chapter.answeredQuestions.indexOf(questionId);
                if (i != -1) {
                    chapter.answeredQuestions.splice(i, 1);
                }
            }
            if (chapter.falseQuestions.find(id => id === questionId) === undefined) {
                chapter.falseQuestions.push(questionId);
            }
        }
        if (chapter.questionsPool.length > 0) {
            let i = chapter.questionsPool.findIndex(q => q.id === questionId);
            if (i != -1) {
                chapter.questionsPool.splice(i, 1);
            }
        }
        return chapter;
    }

    /**
     * @param {Array} allQuestions all question in an chapter
     */
    getPossibleQuestions(allQuestions) {
        // count included previous wrongly answered questions
        let count = 0;
        // Filter for how many previous wrongly answered questions can be in the pool per chapter
        let maxWrong = 3;

        // check for all questions in the stack if the user already answered one correctly previously and add some wrongly answered questions
        for (let i = 0; i < allQuestions.length; i++) {
            // check if 
            let j = this.answeredQuestions.indexOf(allQuestions[i].id);
            if (j != -1) {
                allQuestions.splice(i, 1);
            }
            // delete wrongly answered questions if there are more in the stack than the {maxWrong} filter allows
            j = this.falseQuestions.indexOf(allQuestions[i].id);
            if (j != -1 && count > maxWrong) {
                allQuestions.splice(i, 1);
            } else {
                count++;
            }
        }
        // return the new questions stack
        return allQuestions;
    }

    /**
     * Create new Questions Pool for a chapter based on
     * @param {Array} categoryQuestions 
     */
    createPool(categoryQuestions) {
        let randomUsed = [];
        let random;

        // reset existing pool
        if (this.questionsPool.length != 0) {
            this.questionsPool = [];
        }
        if (this.falseQuestions.length != 0) {
            this.falseQuestions = [];
        }

        // if there are enough given questions to create a pool, pick them by random
        if (categoryQuestions.length >= poolSize && categoryQuestions.length - this.answeredQuestions.length >= poolSize) {
            // for loop to create a random question pool from categoryQuestions until poolsize is reached
            for (let i = poolSize; i > 0; i--) {
                // create random number and check if random number is already used to pick a question or if not, if the question was answered previously
                do {
                    random = Math.floor((Math.random() * categoryQuestions.length));
                }
                while (randomUsed.indexOf(random) != -1 || this.answeredQuestions.indexOf(categoryQuestions[random].id) != -1)
                // -> we got a new question to push in the pool
                // push random number in the randomUsed array, so we know not to use it again in this
                randomUsed.push(random);
                // push new question into the question pool
                this.questionsPool.push(categoryQuestions[random]);
            }
            this.questionsPool = shuffle(this.questionsPool);
        } else {
            // else just shuffle the given questions and return them as new pool
            for (let i = 0; i < categoryQuestions.length; i++) {
                // check if each question has been answered before, if not add to pool
                if (this.answeredQuestions.indexOf(categoryQuestions[i].id) === -1) {
                    this.questionsPool.push(categoryQuestions[i]);
                }
            }
            this.questionsPool = shuffle(this.questionsPool);
        }
        updateInDb();
    }


    /**
     * Removes all values from an @param {Array} array (first level) that are equal to the @param {String} value
     */
    arrayRemove(arr, value) {
        return arr.filter(function (ele) {
            return ele != value;
        });
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

    async createNewUserIfNotExisting(userIn) {
        return new Promise((resolve, reject) => {
            let user = this.loadExistingUser(userIn.userId);
            // user.lenght is 1, if a user was found
            // console.log(user);
            if (user.length == 1) {
                resolve(user[0]);
            } else {
                user = this.createUser(userIn);
                // console.log(user);
                if (user != null) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            }
        });
    }

    /**
     * CRUD Operations for DB connection
     */

    async createUser(userIn) {
        //return new Promise((resolve, reject) => {
        let user = new userModel(userIn);
        user.save()
            .then(doc => {
                console.log(`New User created with id ${doc.userId} `);
                //resolve(doc);
            })
            .catch(err => {
                console.error(err);
                //reject(null);
            })
        //});
    }

    async updateExistingUser(user) {
        userModel
            .findOneAndUpdate(
                { userId: user.userId },             // search query
                user,
                // {
                //     userId: user.userId,
                //     chapter1: user.chapter1,
                //     chapter2: user.chapter2,
                //     chapter3: user.chapter3,
                //     chapter4: user.chapter4,
                //     chapter5: user.chapter5
                // },                                // field:values to update, in this case already defined by user object 
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

/**
 * HELPER
 */
// const correct = function (userT, questionId, correct) {
//     let user = userT;
//     console.log("!!!!!!!");
//     if (correct) {
//         if (user.falseQuestions.length > 0) {
//             let i = user.falseQuestions.indexOf(questionId);
//             if (i != -1) {
//                 user.falseQuestions.splice(i, 1);
//             }
//             // for (var i = user.falseQuestions.length - 1; i--;) {
//             //     console.log(1);
//             //     if (user.falseQuestions[i] === questionId) user.falseQuestions.splice(i, 1);
//             // }
//         }
//         if (user.answeredQuestions.find(id => id === questionId) === undefined) {
//             user.answeredQuestions.push(questionId);
//         }
//     } else {
//         if (user.answeredQuestions.length > 0) {
//             let i = user.answeredQuestions.indexOf(questionId);
//             if (i != -1) {
//                 user.answeredQuestions.splice(i, 1);
//             }
//             // for (let i = user.answeredQuestions.length - 1; i--;) {
//             //     console.log(2);
//             //     if (user.answeredQuestions[i] === questionId) user.answeredQuestions.splice(i, 1);
//             // }
//         }
//         if (user.falseQuestions.find(id => id === questionId) === undefined) {
//             user.falseQuestions.push(questionId);
//         }
//     }
//     return user;
// }

module.exports = {
    UserProfile: UserProfile,
    UserProfileManager: userProfileManager
}