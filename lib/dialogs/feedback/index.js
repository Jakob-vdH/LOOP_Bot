const { ComponentDialog, TextPrompt, DialogSet, WaterfallDialog, Dialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { Feedback, UserProfile } = require("../shared/stateProperties");
const { feedBackCard } = require("./ressources/feedbackCard");
const { GifThanks } = require("../shared/gifs");
const alwaysFeedback = require("../../config.json").alwaysFeedback;

const FEEDBACK = "Feedback";
const TEXTPROMPT = "textprompt";

class FeedbackDialog extends ComponentDialog {
    static get Name() { return FEEDBACK }
    constructor(onTurnAccessor, userProfileAccessor) {
        super(FEEDBACK);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = FEEDBACK;
        this.onTurnAccessor = onTurnAccessor;
        this.userProfileAccessor = userProfileAccessor;

        this.addDialog(new TextPrompt(TEXTPROMPT));

        this.addDialog(new WaterfallDialog(FEEDBACK, [
            async function (step) {
                if (step.options && step.options.chapter) {
                    this.chapter = step.options.chapter;
                }
                let user = await userProfileAccessor.get(step.context);
                if (alwaysFeedback || user[this.chapter].feedback == false) {
                    await step.context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(feedBackCard)));
                    return Dialog.EndOfTurn;
                } else {
                    return await step.next();
                }
            },
            async function (step) {
                let tmp = await userProfileAccessor.get(step.context);
                let user = new UserProfile(tmp.userId, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
                let onTurnProperty = await onTurnAccessor.get(step.context);
                if (onTurnProperty.entities.length > 0 && onTurnProperty.entities[0].entityValue[0] != "") {
                    let feedback = new Feedback(user.userId, onTurnProperty.entities[0].entityValue[0], onTurnProperty.entities[1].entityValue[0], this.chapter);
                    await feedback.saveToDB();
                    user[this.chapter].feedback = true;
                    await user.updateInDb();
                    this.userProfileAccessor.set(step.context, user);
                    await step.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Vielen Dank für dein Feedback 😊.", "![GifThanks](" + GifThanks() + ")")));
                }
                return await step.endDialog();
            }
        ]));
    }
}

module.exports.FeedbackDialog = FeedbackDialog;