const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { UserProfile } = require("../stateProperties");
const { yesNoPrompt } = require("../prompts");
const { GifGood } = require("../gifs");

const RESETDIALOG = "ResetQuestionPool_Dialog";
const TEXTPROMPT = "textPrompt";
const resetTitel = "**🎉 Glückwunsch 🎉**"
const resetMessage = "**Kapitel abgeschlossen!**\n\n![gif good](" + GifGood() + ")\n\nDu hast alle Fragen in diesem Kapitel abgeschlossen, möchtest du dieses Kapitel nochmal durchlaufen?"; // "nochmal bearbeiten" vllt zu starker Bezug auf "arbeiten"
// const ANTWORT = "Antwort ";

class ResetQuestionsDialog extends ComponentDialog {
    static get Name() { return RESETDIALOG; }
    constructor(onTurnAccessor, userProfileAccessor) {
        super(RESETDIALOG);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = RESETDIALOG;
        this.onTurnAccessor = onTurnAccessor;
        this.userProfileAccessor = userProfileAccessor;
        this.chapter = "";

        this.addDialog(new TextPrompt(TEXTPROMPT));

        this.addDialog(new WaterfallDialog(RESETDIALOG, [
            async function (step) {
                if (step.options && step.options.chapter) {
                    this.chapter = step.options.chapter;
                }
                // const message = MessageFactory.attachment(CardFactory.adaptiveCard(Question1Card))
                // await step.context.sendActivity(message);
                // if (step.options && step.options.dialog) {
                //     this.question = step.options.dialog;
                //     console.log(this.question.id);
                // } else {
                //     await step.sendActivity("Ich konnte leider keine weiteren Fragen finden.");
                //     return await step.endDialog();
                // }
                // let arr = [];
                // for (let i = 1; i <= this.question.answerCount; i++) {
                //     arr.push(ANTWORT + i);
                // }
                return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard(resetTitel, resetMessage, [], yesNoPrompt.arr)));
            },
            async function (step) {
                let tmp = await userProfileAccessor.get(step.context);
                let user = new UserProfile(tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5, tmp.exam);
                console.log(user);
                if (step.result === yesNoPrompt.values.yes) {
                    user[this.chapter].answeredQuestions = [];
                    userProfileAccessor.set(step.context, user);
                    console.log(false);
                    console.log(user);
                    return await step.endDialog({ end: false, skip: true });
                } else {
                    console.log(true);
                    return await step.endDialog({ end: true, skip: false });
                }
            }
        ]));
    }
}

module.exports.ResetQuestionsDialog = ResetQuestionsDialog;