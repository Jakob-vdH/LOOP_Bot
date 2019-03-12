const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { UserProfile } = require("../stateProperties");
const { GifGood } = require("../gifs");

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

        this.addDialog(new TextPrompt(TEXTPROMPT));

        this.addDialog(new WaterfallDialog(QUESTION_1, [
            async function (step) {
                // const message = MessageFactory.attachment(CardFactory.adaptiveCard(Question1Card))
                // await step.context.sendActivity(message);
                if (step.options && step.options.dialog) {
                    this.question = step.options.dialog;
                    console.log(this.question.id);
                } else {
                    await step.sendActivity("Ich konnte leider keine weiteren Fragen finden.");
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
                let tmp = await userProfileAccessor.get(step.context);
                let user = new UserProfile(tmp.questionsPool, tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
                if (step.result === ANTWORT + this.question.rightAnswerNr) {
                    await step.context.sendActivity("✅ " + this.question.mkdAnwser);
                    user.correct(this.question.id, true);
                    userProfileAccessor.set(step.context, user);
                    if (user.answeredQuestions.length % 5 == 0) {
                        await step.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Mach weiter so!", "![Good Job](" + GifGood() + ")")))
                    }
                } else {
                    await step.context.sendActivity("❌ " + this.question.mkdAnwser);
                    user.correct(this.question.id, false);
                    userProfileAccessor.set(step.context, user);
                }
                console.log(user);
                return await step.endDialog({ end: false });
            }
        ]));
    }
}

module.exports.SimpleQuestion = SimpleQuestion;