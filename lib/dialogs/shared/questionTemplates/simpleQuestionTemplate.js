const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { UserProfile, Chapter, saveLog } = require("../stateProperties");
const { GifGood } = require("../gifs");
const { QnADispatcher } = require("../../qna");

const QUESTION_1 = "Question_1";
const TEXTPROMPT = "textPrompt";
const ANTWORT = "Antwort ";

class SimpleQuestion extends ComponentDialog {
    static get Name() { return QUESTION_1; }
    constructor(onTurnAccessor, userProfileAccessor) {
        super(QUESTION_1);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = QUESTION_1;
        this.onTurnAccessor = onTurnAccessor;
        this.userProfileAccessor = userProfileAccessor;
        this.question = {};
        this.number = 0;
        this.total = 0;
        this.chapter = "chapter1";

        this.addDialog(new TextPrompt(TEXTPROMPT));

        this.addDialog(new QnADispatcher(this.onTurnAccessor, this.userProfileAccessor));

        this.addDialog(new WaterfallDialog(QUESTION_1, [
            async function (step) {
                // const message = MessageFactory.attachment(CardFactory.adaptiveCard(Question1Card))
                // await step.context.sendActivity(message);
                let user = new UserProfile();
                user = await userProfileAccessor.get(step.context);
                if (step.options && step.options.chapter) {
                    this.chapter = step.options.chapter;
                    this.question = user[this.chapter].questionsPool[0];
                } else {
                    await step.context.sendActivity("Ich konnte leider keine weiteren Fragen finden.");
                    return await step.endDialog();
                }
                if (step.options && step.options.total && step.options.number) {
                    this.number = step.options.number;
                    this.total = step.options.total;
                }
                let arr = [];
                for (let i = 1; i <= this.question.answerCount; i++) {
                    arr.push(ANTWORT + i);
                }
                return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard("(" + this.number + "/" + this.total + ") - " + this.question.mkdTitel, this.question.mkdText, [], arr)));
            },
            async function (step) {
                // if an answer to the question was choosen
                if (step.result.indexOf(ANTWORT) !== -1) {
                    let tmp = await userProfileAccessor.get(step.context);
                    let user = new UserProfile(tmp.userId, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
                    // let user = new UserProfile(tmp.questionsPool, tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
                    // if the right answer was choosen
                    if (step.result === ANTWORT + this.question.rightAnswerNr) {
                        await step.context.sendActivity("✅ " + this.question.mkdAnwser);
                        // let c = new Chapter();
                        // c = user[this.chapter];
                        // c.correct(this.question.id, true);
                        // // correct(this.question.id, true);
                        // user[this.chapter] = c;
                        user[this.chapter].correct(this.question.id, true);
                        saveLog(user.userId, this.question, this.question.rightAnswerNr, false, "", this.chapter);
                        if (user[this.chapter].answeredQuestions.length % (user[this.chapter].poolSize / 2) == 0) {
                            await step.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Klasse, mach weiter so!", "![Good Job](" + GifGood() + ")")))
                        }
                    } else {
                        await step.context.sendActivity("❌ " + this.question.mkdAnwser);
                        user[this.chapter].correct(this.question.id, false);
                        const answer = step.result.substring(
                            step.result.lastIndexOf(ANTWORT) + 8,
                            step.result.length
                        );
                        saveLog(user.userId, this.question, answer, false, "", this.chapter);
                    }
                    await user.updateInDb();
                    userProfileAccessor.set(step.context, user);
                    return await step.endDialog({ end: false });
                } else {
                    return await step.beginDialog(QnADispatcher.Name, { chapter: this.chapter, question: this.question });
                }
            },
            async function (step) {
                return await step.endDialog({ skip: true });
            }
        ]));
    }
}

module.exports.SimpleQuestion = SimpleQuestion;