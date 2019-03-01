const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { UserProfile } = require("../stateProperties");

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
                let arr = [];
                for (let i = 1; i <= this.question.answerCount; i++) {
                    arr.push(ANTWORT + i);
                }
                return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard(this.question.mkdTitel, this.question.mkdText, [], arr)));
            },
            async function (step) {
                let tmp = await userProfileAccessor.get(step.context);
                let user = new UserProfile(tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
                console.log(user);
                console.log(step.result);
                // TODO create helper to check if question id needs to change from false to correct or vice versa!!
                if (step.result === ANTWORT + this.question.rightAnswerNr) {
                    await step.context.sendActivity("✅ " + this.question.mkdAnwser);
                    user.correct(this.question.id, true);
                    userProfileAccessor.set(step.context, user);
                } else {
                    await step.context.sendActivity("❌ " + this.question.mkdAnwser);
                    user.correct(this.question.id, false);
                    userProfileAccessor.set(step.context, user);
                }
                console.log(user);
                return await step.endDialog();
            }
        ]));
    }
}

module.exports.Question1 = Question1;