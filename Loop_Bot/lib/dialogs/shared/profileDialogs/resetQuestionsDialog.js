const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { UserProfile } = require("../stateProperties");
const { yesNoPrompt } = require("../prompts");
const { GifGood } = require("../gifs");
const { FeedbackDialog } = require("../../feedback");

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
        this.addDialog(new FeedbackDialog(this.onTurnAccessor, this.userProfileAccessor));
        this.addDialog(new WaterfallDialog(RESETDIALOG, [
            async function (step) {
                if (step.options && step.options.chapter) {
                    this.chapter = step.options.chapter;
                }
                return await step.beginDialog(FeedbackDialog.Name, { chapter: this.chapter });
            },
            async function (step) {
                return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard(resetTitel, resetMessage, [], yesNoPrompt.arr)));
            },
            async function (step) {
                let tmp = await userProfileAccessor.get(step.context);
                let user = new UserProfile(tmp.userId, tmp.currentChapter, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
                if (step.result === yesNoPrompt.values.yes) {
                    user[this.chapter].answeredQuestions = [];
                    await user.updateInDb();
                    userProfileAccessor.set(step.context, user);
                    return await step.endDialog({ end: false, skip: true });
                } else {
                    return await step.endDialog({ end: true, skip: false });
                }
            }
        ]));
    }
}

module.exports.ResetQuestionsDialog = ResetQuestionsDialog;