const { ComponentDialog, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { MessageFactory, CardFactory } = require('botbuilder');
const { UserProfile, Chapter, saveLog } = require('../stateProperties');
const { GifGood } = require('../gifs');
const { QnADispatcher } = require('../../qna');

const QUESTION_1 = 'Question_1';
const TEXTPROMPT = 'textPrompt';
const ANTWORT = 'Antwort ';

class SimpleQuestion extends ComponentDialog {
  static get Name() {
    return QUESTION_1;
  }
  constructor(onTurnAccessor, userProfileAccessor) {
    super(QUESTION_1);

    // ID of the child dialog that should be started anytime the component is started.
    this.initialDialogId = QUESTION_1;
    this.onTurnAccessor = onTurnAccessor;
    this.userProfileAccessor = userProfileAccessor;
    this.question = {};
    this.number = 0;
    this.total = 0;
    this.chapter = 'chapter1';

    this.addDialog(new TextPrompt(TEXTPROMPT));

    this.addDialog(new QnADispatcher(this.onTurnAccessor, this.userProfileAccessor));

    this.addDialog(
      new WaterfallDialog(QUESTION_1, [
        async function(step) {
          // const message = MessageFactory.attachment(CardFactory.adaptiveCard(Question1Card))
          // await step.context.sendActivity(message);
          // load local user profile
          let user = new UserProfile();
          user = await userProfileAccessor.get(step.context);
          // load dialog options / parameters
          if (step.options && step.options.chapter) {
            this.chapter = step.options.chapter;
            this.question = user[this.chapter].questionsPool[0];
          } else {
            await step.context.sendActivity('Ich konnte leider keine weiteren Fragen finden.');
            return await step.endDialog();
          }
          if (step.options && step.options.total && step.options.number >= 0) {
            this.number = step.options.number;
            this.total = step.options.total;
          }
          // create dynamic answer button array
          let arr = [];
          for (let i = 1; i <= this.question.answerCount; i++) {
            arr.push(ANTWORT + i);
          }
          // send question message including the learner's progress, the question title, the questions text and the create button array
          return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard('(' + this.number + '/' + this.total + ') - ' + this.question.mkdTitel, this.question.mkdText, [], arr)));
        },
        async function(step) {
          // check if an answer to the question was choosen, or if a question was asked
          if (step.result.indexOf(ANTWORT) !== -1 || step.result.indexOf('antwort') !== -1 || typeof step.result == 'number') {
            // load local user profile
            let tmp = await userProfileAccessor.get(step.context);
            let user = new UserProfile(tmp.userId, tmp.currentChapter, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
            // let user = new UserProfile(tmp.questionsPool, tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
            // check if the right answer was choosen (also check hand typed answer options)
            if (step.result === ANTWORT + this.question.rightAnswerNr || step.result === 'antwort' + this.question.rightAnswerNr || step.result == this.question.rightAnswerNr) {
              // send feedback including the explanation
              await step.context.sendActivity('✅ Richtig\n' + this.question.mkdAnswer);
              // Move assingment to correctly answered
              user[this.chapter].correct(this.question.id, true);
              saveLog(user.userId, this.question, this.question.rightAnswerNr, false, '', this.chapter);
              if (user[this.chapter].answeredQuestions.length % (user[this.chapter].poolSize / 2) == 0) {
                // display motivational message
                await step.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard('Klasse, mach weiter so!', '![Good Job](' + GifGood() + ')')));
              }
            } else {
              // send feedback including the explanation
              await step.context.sendActivity('❌ Leider falsch\n' + this.question.mkdAnswer);

              // Move assingment to incorrectly answered
              if (this.question.keyword) {
                user[this.chapter].correct(this.question.id, false, this.question.keyword);
              } else {
                user[this.chapter].correct(this.question.id, false);
              }

              // call recommender function to check if the user has problems in topics
              let recommendation = user[this.chapter].recommendTopic();
              if (recommendation != false) {
                await step.context.sendActivity(
                  "Ich habe bemerkt, dass du Fragen zu dem Thema '" +
                    recommendation.keyword +
                    "' noch nicht ganz gemeistert hast.\n\n[Klicke hier, wenn du '" +
                    recommendation.keyword +
                    "' noch einmal wiederholen möchtest.](" +
                    recommendation.url +
                    ')'
                );
              }

              // get answer number to save in log
              const answer = step.result.substring(step.result.lastIndexOf(ANTWORT) + 8, step.result.length);
              saveLog(user.userId, this.question, answer, false, '', this.chapter);
            }
            // update the user profile in the database
            await user.updateInDb();
            // update local user profile
            userProfileAccessor.set(step.context, user);
            return await step.endDialog({ end: false });
          } else {
            // if the user did not pick an answer, but send something different, start the QnADispatcher to analyse the user input and
            return await step.beginDialog(QnADispatcher.Name, { chapter: this.chapter, question: this.question });
          }
        },
        async function(step) {
          return await step.endDialog({ skip: true });
        }
      ])
    );
  }
}

module.exports.SimpleQuestion = SimpleQuestion;
