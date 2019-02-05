const { TurnContext, ActivityTypes, CardFactory, MessageFactory } = require("botbuilder");
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MainDispatcher } = require("./dialogs/dispatcher/index");
const { WelcomeCard } = require('./dialogs/welcome');
const { OnTurnProperty } = require('./dialogs/shared/stateProperties');

// State properties
const ON_TURN_PROPERTY = 'onTurnStateProperty';
const DIALOG_STATE_PROPERTY = 'dialogStateProperty';

/**
 *
 * Bot Class is responsible for 4 main things -
 *   1. Handle different types of activities
 *   2. Process incoming activities and extract relevant information into an onTurnProperty object
 *   3. Route message to or start an instance of main dispatcher
 *   4. Welcome user(s) that might have joined the conversation
 *
 */
class LoopBot {

    /**
     * Bot constructor.
     *
     * @param {ConversationState} conversation state object
     * @param {UserState} user state object
     * @param {BotConfiguration} bot configuration
     *
     */
    constructor(conversationState, userState) {
        if (!conversationState) throw new Error('Missing parameter. Conversation state is required.');
        if (!userState) throw new Error('Missing parameter. User state is required.');
        //if (!botConfig) throw new Error('Missing parameter. Bot configuration is required.');

        // Create state property accessors.
        this.onTurnAccessor = conversationState.createProperty(ON_TURN_PROPERTY);
        this.dialogAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Add main dispatcher.
        this.dialogs = new DialogSet(this.dialogAccessor);
        this.dialogs.add(new MainDispatcher(this.onTurnAccessor, conversationState, userState));

        this.conversationState = conversationState;
        this.userState = userState;
    }

    // /**
    //  * @param {TurnContext} on turn context object.
    //  */
    // async onTurn(turnContext) {
    //     if (turnContext.activity.type === ActivityTypes.Message) {
    //         await turnContext.sendActivity(`Hi! You said '${turnContext.activity.text}'`);
    //     } else {
    //         await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    //     }
    // }

    /**
     * On turn method.
     * Responsible for processing turn input, gather relevant properties,
     * and continues or begins main dispatcher.
     *
     * @param {TurnContext} Turn context object
     *
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about message and other activity types.
        switch (turnContext.activity.type) {
            case ActivityTypes.Message:
                // Process card input.
                // All cards used in this sample are adaptive cards and contain a custom intent + entity payload.
                let onTurnProperties = await this.detectIntentAndEntitiesFromCardInput(turnContext);
                if (onTurnProperties === undefined) break;

                // Set the state with gathered properties (intent/ entities) through the onTurnAccessor.
                await this.onTurnAccessor.set(turnContext, onTurnProperties);

                // Create dialog context.
                const dc = await this.dialogs.createContext(turnContext);

                // Continue outstanding dialogs.
                await dc.continueDialog();

                // Begin main dialog if no outstanding dialogs/ no one responded.
                if (!dc.context.responded) {
                    await dc.beginDialog(MainDispatcher.Name);
                }
                break;
            case ActivityTypes.ConversationUpdate:
                // Welcome user.
                await this.welcomeUser(turnContext);
                break;
            default:
                // Handle other activity types as needed.
                break;
        }

        // Persist state.
        // Hint: You can get around explicitly persisting state by using the autoStateSave middleware.
        await this.conversationState.saveChanges(turnContext);
        await this.userState.saveChanges(turnContext);
    }

    /**
     * Async helper method to welcome all users that have joined the conversation.
     *
     * @param {TurnContext} context conversation context object
     *
     */
    async welcomeUser(turnContext) {
        // Do we have any new members added to the conversation?
        if (turnContext.activity.membersAdded.length !== 0) {
            // Iterate over all new members added to the conversation
            for (var idx in turnContext.activity.membersAdded) {
                // Greet anyone that was not the target (recipient) of this message
                // 'bot' is the recipient for events from the channel,
                // turnContext.activity.membersAdded === turnContext.activity.recipient.Id indicates the
                // bot was added to the conversation.
                if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                    // Welcome user.
                    await turnContext.sendActivity(`Hi, ich bin der Loop-Bot und hier, um dir beim Üben für den Online-Kurs "Lernen objekt-orientierter Programmierung" zu helfen!`);

                    // Send welcome card.
                    await turnContext.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(WelcomeCard)));
                }
            }
        }
    }

    /**
     * Async helper method to get on turn properties from cards
     *
     * - All cards for this bot -
     *   1. Are adaptive cards. See https://adaptivecards.io to learn more.
     *   2. All cards include an 'intent' field under 'data' section and can include entities recognized.
     *
     * @param {TurnContext} turn context object
     *
     */
    async detectIntentAndEntitiesFromCardInput(turnContext) {
        // Handle card input (if any), update state and return.
        if (turnContext.activity.value !== undefined) {
            return OnTurnProperty.fromCardInput(turnContext.activity.value);
        }

        // Acknowledge attachments from user.
        if (turnContext.activity.attachments && turnContext.activity.attachments.length !== 0) {
            await turnContext.sendActivity(`Bitte schicke mir keine Anhänge! Diese werden von mir missachtet.`);
            return undefined;
        }

        // Nothing to do for this turn if there is no text specified.
        if (turnContext.activity.text === undefined || turnContext.activity.text.trim() === '') {
            return undefined;
        }
        return new OnTurnProperty();
    }
}

module.exports.LoopBot = LoopBot;