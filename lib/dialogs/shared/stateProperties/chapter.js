const { shuffle } = require("../helpers");
// TODO: move into config
const poolSize = 10;

class Chapter {
    /**
     * Entity Property constructor.
     *
     * @param {Array} questionsPool questions to answer
     * @param {Array} answeredQuestions answered questions
     * @param {Array} falseQuestions falsly answered questions to repeat
     * @param {String} language choosen language
     */
    constructor(questionsPool, answeredQuestions, falseQuestions, language) {
        this.questionsPool = questionsPool || [];
        this.answeredQuestions = answeredQuestions || [];
        this.falseQuestions = falseQuestions || [];
        this.language = language || "German";
        this.poolSize = poolSize;
    }

    /**
     * 
     * @param {String} questionId 
     * @param {Boolean} correct was the given questionId answered correctly
     */
    correct(questionId, correct) {
        if (correct) {
            if (this.falseQuestions.length > 0) {
                this.falseQuestions = this.arrayRemove(this.falseQuestions, questionId);
                // let i = this.falseQuestions.indexOf(questionId);
                // if (i != -1) {
                //     this.falseQuestions.splice(i, 1);
                // }

            }
            if (this.answeredQuestions.find(id => id === questionId) === undefined) {
                this.answeredQuestions.push(questionId);
            }
        } else {
            if (this.answeredQuestions.length > 0) {
                let i = this.answeredQuestions.indexOf(questionId);
                if (i != -1) {
                    this.answeredQuestions.splice(i, 1);
                }
            }
            if (this.falseQuestions.find(id => id === questionId) === undefined) {
                this.falseQuestions.push(questionId);
            }
        }
        if (this.questionsPool.length > 0) {
            let i = this.questionsPool.findIndex(q => q.id === questionId);
            if (i != -1) {
                this.questionsPool.splice(i, 1);
            }
        }
    }

    /**
     * 
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
     * Create new Questions Pool
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
                console.log(random);
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
        console.log(this.questionsPool);
    }


    /**
     * Removes all values from an @param {Array} array (first level) that are equal to the @param {String} value
     */
    arrayRemove(arr, value) {
        return arr.filter(function (ele) {
            return ele != value;
        });
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
    Chapter: Chapter
}