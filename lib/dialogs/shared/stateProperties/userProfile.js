const { shuffle } = require("../helpers");
const { Chapter } = require("./chapter");
// TODO: move into config
const poolSize = 10;

class UserProfile {
    /**
     * Entity Property constructor.
     *
     * @param {Array} questions answered questions
     * @param {Array} falseQuestions falsly answered questions to repeat
     * @param {String} language choosen language
     */
    constructor(chapter1, chapter2, chapter3, chapter4, chapter5, exam) {
        this.chapter1 = chapter1 ? new Chapter(chapter1.questionsPool, chapter1.answeredQuestions, chapter1.falseQuestions, chapter1.language) : new Chapter();
        this.chapter2 = chapter2 ? new Chapter(chapter2.questionsPool, chapter2.answeredQuestions, chapter2.falseQuestions, chapter2.language) : new Chapter();
        this.chapter3 = chapter3 ? new Chapter(chapter3.questionsPool, chapter3.answeredQuestions, chapter3.falseQuestions, chapter3.language) : new Chapter();
        this.chapter4 = chapter4 ? new Chapter(chapter4.questionsPool, chapter4.answeredQuestions, chapter4.falseQuestions, chapter4.language) : new Chapter();
        this.chapter5 = chapter5 ? new Chapter(chapter5.questionsPool, chapter5.answeredQuestions, chapter5.falseQuestions, chapter5.language) : new Chapter();
        this.exam = exam ? new Chapter(exam.questionsPool, exam.answeredQuestions, exam.falseQuestions, exam.language) : new Chapter();


        // this.questionsPool = questionsPool || [];
        // this.answeredQuestions = answeredQuestions || [];
        // this.falseQuestions = falseQuestions || [];
        // this.language = language || "German";
        // this.poolSize = poolSize;
    }

    /**
     * 
     * @param {UserProfile} user 
     * @param {String} questionId 
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
    UserProfile: UserProfile
}