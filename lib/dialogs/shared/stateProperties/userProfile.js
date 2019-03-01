class UserProfile {
    /**
     * Entity Property constructor.
     *
     * @param {Array} questions answered questions
     * @param {Array} falseQuestions falsly answered questions to repeat
     * @param {String} language choosen language
     */
    constructor(questions, falseQuestions, language) {
        this.answeredQuestions = questions || [];
        this.falseQuestions = falseQuestions || [];
        this.language = language || "German";
    }

    /**
     * 
     * @param {UserProfile} user 
     * @param {String} questionId 
     * @param {Boolean} correct was the given questionId answered correctly
     */
    correct(questionId, correct) {
        if (correct) {
            if (this.falseQuestions.length > 0) {
                let i = this.falseQuestions.indexOf(questionId);
                if (i != -1) {
                    this.falseQuestions.splice(i, 1);
                }
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
                allQuestions.splice(j, 1);
            }
            // delete wrongly answered questions if there are more in the stack than the {maxWrong} filter allows
            j = this.falseQuestions.indexOf(allQuestions[i].id);
            if (j != -1 && count > maxWrong) {
                allQuestions.splice(j, 1);
            } else {
                count++;
            }
        }
        // return the new questions stack
        return allQuestions;
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