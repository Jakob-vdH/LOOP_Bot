const { shuffle } = require("../helpers");
const poolSize = require("../../../config.json").poolSize;
const Recommender = require("./recommenderDictionary.json");
const recommenderFilter = require("../../../config.json").recommender.countTo; //  3; //TODO: in config

class Chapter {
    /**
     * Entity Property constructor.
     *
     * @param {Array} questionsPool questions to answer
     * @param {Array} answeredQuestions answered questions
     * @param {Array} falseQuestions falsly answered questions to repeat
     * @param {String} language choosen language
     */
    constructor(questionsPool, answeredQuestions, falseQuestions, language, feedback) {
        this.questionsPool = questionsPool || [];
        this.answeredQuestions = answeredQuestions || [];
        this.falseQuestions = falseQuestions || [];
        this.language = language || "German";
        this.poolSize = poolSize;
        this.feedback = feedback || false;
    }

    /**
     * 
     * @param {String} questionId 
     * @param {Boolean} correct was the given questionId answered correctly
     */
    correct(questionId, correct, keyword) {
        if (correct) {
            if (this.falseQuestions.length > 0) {
                this.falseQuestions = this.arrayRemove(this.falseQuestions, questionId);

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
                if (keyword) {
                    this.falseQuestions.push({ id: questionId, keyword: keyword });
                } else {
                    this.falseQuestions.push({ id: questionId });
                }
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
     * Create new Questions Pool - moved from UserProfile Class
     * @param {Array} questionsFromJson 
     */
    createPool(questionsFromJson) {
        let randomUsed = [];
        let random;
        let categoryQuestions = []
        let tmp = {};

        // generate question array
        for (let i = 0; i < questionsFromJson.length; i++) {
            tmp = this.generateQuestion(questionsFromJson[i]);
            // check if question was generated correctly
            if (tmp != null) {
                categoryQuestions.push(tmp);
            }
        }

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
            return ele.id != value;
        });
    }

    /**
     * @param {Object} questions question data in Json object format from questions.json 
     * should consist of mkdTexts:Array && mkdTitel:String && mkdQuestions:Array && mkdAnwsers:Array
     */
    generateQuestion(questions) {
        if (questions && questions.mkdTexts && questions.mkdTitel && questions.mkdQuestions && questions.mkdAnswers && questions.keyword) {
            let question = {
                id: "",
                mkdTitel: "",
                mkdText: "",
                mkdAnswer: "",
                answerCount: 0,
                rightAnswerNr: 0,
                keyword: ""
            }
            // get random question "seed" to have random attributes in the question for example / more than one question option in one question
            const random = Math.floor((Math.random() * questions.mkdTexts.length));
            // create base question with random seed - Titel of chapter category always stays the same in a question
            question.mkdTitel = questions.mkdTitel;
            question.mkdText = questions.mkdTexts[random].texts;
            question.id = questions.id;
            // shuffel possible answers order
            const questionOptions = shuffle(questions.mkdQuestions);
            // create question string from shuffled questions array
            for (let i = 0; i < questionOptions.length; i++) {

                // add question option to new question
                question.mkdText += "\n\n**(" + (i + 1) + ")** " + questionOptions[i].texts[random].answerOption;

                // check if current question option is the right answer
                if (questionOptions[i].right) {
                    question.rightAnswerNr = i + 1;
                }

                //increase answerCount
                question.answerCount++;
            }
            // set right answer text
            question.mkdAnswer = questions.mkdAnswers[random].texts + "\n( richtig ist **Antwort " + question.rightAnswerNr + "** )";
            question.keyword = questions.keyword;
            return question;
        } else {
            console.error("Tried to generate Question from not accepted input format:\n" + questions);
            return null;
        }
    }

    /**
     * Recommender function that checks if the user answer questions for recurring keywords wrong
     */
    recommendTopic() {
        for (var i = 0; i < this.falseQuestions.length; i++) {
            if (this.falseQuestions[i].keyword) {
                let keyword = this.falseQuestions[i].keyword;
                let count = this.countInArray(this.falseQuestions, keyword);
                if (count >= recommenderFilter) {
                    if (Recommender[keyword] != undefined) {
                        return { url: Recommender[keyword], keyword: keyword };
                    }
                }
            }
        }
        return false;
    }

    countInArray(array, keyword) {
        var count = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i].keyword) {
                if (array[i].keyword === keyword) {
                    count++;
                }
            }
        }
        return count;
    }
}

module.exports = {
    Chapter: Chapter
}