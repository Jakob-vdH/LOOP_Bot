const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { LuisRecognizer } = require("botbuilder-ai");
const { WelcomeCard } = require("../welcome");
const { Chapter1 } = require("../chapter_1");
const { GifError } = require("../shared/gifs");
const { QnADispatcher } = require("../qna");

// const {  } = from "../../dialogs";
// const { GenSuggestedQueries } = require('../shared/helpers');
const { OnTurnProperty } = require('../shared/stateProperties');

// dialog name
const MAIN_DISPATCHER_DIALOG = 'MainDispatcherDialog';

// LUIS service type entry in the .bot file for dispatch.
// const LUIS_CONFIGURATION = 'cafeDispatchModel';

// const for state properties
const USER_PROFILE_PROPERTY = 'userProfile';
const MAIN_DISPATCHER_STATE_PROPERTY = 'mainDispatcherState';
const RESERVATION_PROPERTY = 'reservationProperty';

// const for cancel and none intent names
const NONE_INTENT = 'None';
const CANCEL_INTENT = 'Cancel';

// Query property from ../whatCanYouDo/resources/whatCanYHouDoCard.json
// When user responds to what can you do card, a query property is set in response.
// const QUERY_PROPERTY = 'query';

class MainDispatcher extends ComponentDialog {
    static get Name() { return MAIN_DISPATCHER_DIALOG; }

    /**
     * Constructor.
     *
     * // @param {BotConfiguration} botConfig bot configuration
     * @param {StatePropertyAccessor} onTurnAccessor
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     */
    constructor(onTurnAccessor, conversationState, userState) {
        super(MAIN_DISPATCHER_DIALOG);

        // if (!botConfig) throw new Error('Missing parameter. Bot Configuration is required.');
        if (!onTurnAccessor) throw new Error('Missing parameter. On turn property accessor is required.');
        if (!conversationState) throw new Error('Missing parameter. Conversation state is required.');
        if (!userState) throw new Error('Missing parameter. User state is required.');

        // Create state objects for user, conversation and dialog states.
        this.userProfileAccessor = conversationState.createProperty(USER_PROFILE_PROPERTY);
        this.mainDispatcherAccessor = conversationState.createProperty(MAIN_DISPATCHER_STATE_PROPERTY);
        this.reservationAccessor = conversationState.createProperty(RESERVATION_PROPERTY);
        this.conversationState = conversationState;

        // keep on turn accessor and bot configuration
        this.onTurnAccessor = onTurnAccessor;

        // add dialogs
        this.dialogs = new DialogSet(this.mainDispatcherAccessor);
        // über eine for-loop alle Dialoge dynamisch hinzufügen
        this.addDialog(new QnADispatcher(this.onTurnAccessor, this.userProfileAccessor));
        this.addDialog(new Chapter1(this.onTurnAccessor, this.conversationState, this.userProfileAccessor));
        // this.addDialog(new Category1("CATEGORY1"));
        // this.addDialog(new QnADialog(botConfig, this.userProfileAccessor));
        // this.addDialog(new WhoAreYouDialog(botConfig, conversationState, this.userProfileAccessor, onTurnAccessor, this.reservationAccessor));
        // this.addDialog(new BookTableDialog(botConfig, this.reservationAccessor, onTurnAccessor, this.userProfileAccessor, conversationState));

        // add recognizer
        // const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        // if (!luisConfig || !luisConfig.appId) throw new Error(`Cafe Dispatch LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information.\n`);
        // this.luisRecognizer = new LuisRecognizer({
        //     applicationId: luisConfig.appId,
        //     endpoint: luisConfig.getEndpoint(),
        //     // CAUTION: Authoring key is used in this example as it is appropriate for prototyping.
        //     // When implimenting for deployment/production, assign and use a subscription key instead of an authoring key.
        //     endpointKey: luisConfig.authoringKey
        // });
    }

    /**
     * Override onBeginDialog
     *
     * @param {DialogContext} dc dialog context
     * @param {Object} options dialog turn options
     */
    async onBeginDialog(dc, options) {
        // Override default begin() logic with bot orchestration logic
        return await this.mainDispatch(dc);
    }

    /**
     * Override onContinueDialog
     *
     * @param {DialogContext} dc dialog context
     */
    async onContinueDialog(dc) {
        // Override default continue() logic with bot orchestration logic
        return await this.mainDispatch(dc);
    }

    /**
     * Main Dispatch
     *
     * This method examines the incoming turn property to determine
     * 1. If the requested operation is permissible - e.g. if user is in middle of a dialog,
     *    then an out of order reply should not be allowed.
     * 2. Calls any outstanding dialogs to continue
     * 3. If results is no-match from outstanding dialog .OR. if there are no outstanding dialogs,
     *    decide which child dialog should begin and start it.
     * 4. Bot also uses a dispatch LUIS model in the child dialog QnADispatcher
     *
     * @param {DialogContext} dialog context
     */
    async mainDispatch(dc) {
        let dialogTurnResult;
        // get on turn property through the property accessor
        let onTurnProperty = await this.onTurnAccessor.get(dc.context);

        // Evaluate if the requested operation is possible/ allowed.
        const reqOpStatus = await this.isRequestedOperationPossible(dc.activeDialog, onTurnProperty.intent);
        if (!reqOpStatus.allowed) {
            await dc.context.sendActivity(reqOpStatus.reason);
            // Initiate re-prompt for the active dialog.
            await dc.repromptDialog();
            return { status: DialogTurnStatus.waiting };
        } else {
            // continue any outstanding dialogs
            dialogTurnResult = await dc.continueDialog();
        }

        // This will only be empty if there is no active dialog in the stack.
        if (!dc.context.responded && dialogTurnResult !== undefined && dialogTurnResult.status !== DialogTurnStatus.complete) {
            // If incoming on turn property does not have an intent, call LUIS and get an intent.
            if (onTurnProperty === undefined || onTurnProperty.intent === '') {
                // Call to LUIS recognizer to get intent + entities

                await dc.beginDialog(QnADispatcher.Name);
                await dc.context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(WelcomeCard)));
                // const LUISResults = await this.luisRecognizer.recognize(dc.context);

                // // Return new instance of on turn property from LUIS results.
                // // Leverages static fromLUISResults method
                // onTurnProperty = OnTurnProperty.fromLUISResults(LUISResults);
            }

            // No one has responded so start the right child dialog.
            dialogTurnResult = await this.beginChildDialog(dc, onTurnProperty);
        }

        if (dialogTurnResult === undefined) return await dc.endDialog();

        // Examine result from dc.continue() or from the call to beginChildDialog().
        switch (dialogTurnResult.status) {
            case DialogTurnStatus.complete: {
                // The active dialog finished successfully. Ask user if they need help with anything else.
                await dc.context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(WelcomeCard)));
                //await dc.context.sendActivity("Is there anything else I can help you with?");
                //MessageFactory.suggestedActions(GenSuggestedQueries(), `Is there anything else I can help you with?`));
                break;
            }
            case DialogTurnStatus.waiting: {
                // The active dialog is waiting for a response from the user, so do nothing
                break;
            }
            case DialogTurnStatus.cancelled: {
                // The active dialog's stack has been cancelled
                await dc.cancelAllDialogs();
                break;
            }
        }
        return dialogTurnResult;
    }

    /**
     * Method to begin appropriate child dialog based on user input
     *
     * @param {DialogContext} dc
     * @param {OnTurnProperty} onTurnProperty
     */
    async beginChildDialog(dc, onTurnProperty) {
        // set on turn property with LUIS results
        await this.onTurnAccessor.set(dc.context, onTurnProperty);
        if (onTurnProperty.intent.length > 0) {
            // Start appropriate child dialog based on intent
            switch (onTurnProperty.intent) {
                // Help, ChitChat and QnA share the same QnA Maker model. So just call the QnA Dialog.
                // case QnADialog.Name:
                // case ChitChatDialog.Name:
                // case HelpDialog.Name:
                //     return await dc.beginDialog(QnADialog.Name);
                // case BookTableDialog.Name:
                //     return await dc.beginDialog(BookTableDialog.Name);
                // case WhoAreYouDialog.Name:
                //     return await dc.beginDialog(WhoAreYouDialog.Name);
                // case WhatCanYouDoDialog.Name:
                //     return await this.beginWhatCanYouDoDialog(dc, onTurnProperty);
                case NONE_INTENT:
                case "chapter_1":
                    return await dc.beginDialog(Chapter1.Name, { chapter: "chapter1" });
                case "chapter_2":
                    return await dc.beginDialog(Chapter1.Name, { chapter: "chapter2" });
                case "chapter_3":
                    return await dc.beginDialog(Chapter1.Name, { chapter: "chapter3" });
                case "chapter_4":
                    return await dc.beginDialog(Chapter1.Name, { chapter: "chapter4" });
                case "chapter_5":
                    return await dc.beginDialog(Chapter1.Name, { chapter: "chapter5" });
                default:
                // return await dc.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Hmmm...", "Ich bin auch selber noch am üben... Es tut mir leid ich weiß nicht was du meinst.\n\n![Gif Error](" + GifError() + ")")));
                //return await dc.context.sendActivity(`Follow [this link](https://www.bing.com/search?q=${dc.context.activity.text}) to search the web!`);
            }
        } else if (dc.context.activity.text) {
            if (dc.context.activity.text.includes("1")) {
                return await dc.beginDialog(Chapter1.Name);
            } else if (dc.context.activity.text.includes("2")) {
                return await dc.beginDialog(Chapter1.Name, { chapter: "chapter2" });
            } else if (dc.context.activity.text.includes("3")) {
                return await dc.beginDialog(Chapter1.Name, { chapter: "chapter3" });
            } else if (dc.context.activity.text.includes("4")) {
                return await dc.beginDialog(Chapter1.Name, { chapter: "chapter4" });
            } else if (dc.context.activity.text.includes("5")) {
                return await dc.beginDialog(Chapter1.Name, { chapter: "chapter5" });
            } else {
                return await dc.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Hmmm...", "Ich bin auch selber noch am üben... Es tut mir leid ich weiß nicht was du meinst. Bitte versuche es erneut oder klicke eins der Kapitel an.\n\n![Gif Error](" + GifError() + ")")));
            }
        } else {
            return await dc.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("Hmmm...", "Ich bin auch selber noch am üben... Es tut mir leid ich weiß nicht was du meinst. Bitte versuche es erneut oder klicke eins der Kapitel an.\n\n![Gif Error](" + GifError() + ")")))
        }
    }

    /**
     * Method to evaluate if the requested user operation is possible.
     * User could be in the middle of a multi-turn dialog where interruption might not be possible or allowed.
     *
     * @param {String} activeDialog
     * @param {String} requestedOperation
     * @returns {Object} outcome object
     */
    async isRequestedOperationPossible(activeDialog, requestedOperation) {
        let outcome = { allowed: true, reason: '' };
        if (requestedOperation === undefined) return outcome;
        if (activeDialog !== undefined && activeDialog.id !== undefined) {
            // E.g. What_can_you_do is not possible when you are in the middle of Who_are_you dialog
            // if (requestedOperation === WhatCanYouDoDialog.Name) {
            //     if (activeDialog.id === WhoAreYouDialog.Name) {
            //         outcome.allowed = false;
            //         outcome.reason = `Sorry! I'm unable to process that. You can say 'cancel' to cancel this conversation..`;
            //     }
            // }
        } else {
            if (requestedOperation === CANCEL_INTENT) {
                outcome.allowed = false;
                outcome.reason = `Sure, but there is nothing to cancel..`;
            }
        }
        return outcome;
    }

    // /**
    //  * Helper method to begin what can you do dialog.
    //  *
    //  * @param {DialogContext} dc dialog context
    //  * @param {OnTurnProperty} onTurnProperty
    //  */
    // async beginWhatCanYouDoDialog(dc, onTurnProperty) {
    //     // Handle case when user interacted with the what can you do card.
    //     // What can you do card sends a custom data property with intent name, text value and possible entities.
    //     // See ../whatCanYouDo/resources/whatCanYouDoCard.json for card definition.
    //     let queryProperty = (onTurnProperty.entities || []).filter(item => item.entityName === QUERY_PROPERTY);
    //     if (queryProperty.length !== 0) {
    //         let parsedJSON;
    //         try {
    //             parsedJSON = JSON.parse(queryProperty[0].entityValue);
    //         } catch (err) {
    //             return await dc.context.sendActivity(`Choose a query from the card drop down before you click 'Let's talk!'`);
    //         }
    //         if (parsedJSON.text !== undefined) {
    //             dc.context.activity.text = parsedJSON.text;
    //             await dc.context.sendActivity(`You said: '${dc.context.activity.text}'`);
    //         }
    //         // create a set a new on turn property
    //         let newOnTurnProperty = OnTurnProperty.fromCardInput(parsedJSON);
    //         await this.onTurnAccessor.set(dc.context, newOnTurnProperty);
    //         return await this.beginChildDialog(dc, newOnTurnProperty);
    //     }
    //     return await dc.beginDialog(WhatCanYouDoDialog.Name);
    // }

};

module.exports = {
    MainDispatcher: MainDispatcher
}