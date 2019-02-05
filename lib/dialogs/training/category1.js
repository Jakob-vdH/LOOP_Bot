const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");

class Category1 extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // Clear the guest information and prompt for the guest's name.
                step.values.guestInfo = {};
                return await step.prompt('textPrompt', "What is your name?");
            },
            async function (step) {
                // Save the name and prompt for the room number.
                step.values.guestInfo.userName = step.result;
                return await step.prompt('textPrompt', `Hi ${step.result}. What room will you be staying in?`);
            },
            async function (step) {
                // Save the room number and "sign off".
                step.values.guestInfo.roomNumber = step.result;
                await step.context.sendActivity(`Great! Enjoy your stay in room ${step.result}!`);

                // End the dialog, returning the guest info.
                return await step.endDialog(step.values.guestInfo);
            }
        ]));
    }
}

module.exports.Category1 = Category1;