const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { MessageFactory, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { MenuCard } = require('../welcome');
const { SectionDialog } = require('../section');
const { GifError } = require('../shared/gifs');
const { QnADispatcher } = require('../qna');

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
  static get Name() {
    return MAIN_DISPATCHER_DIALOG;
  }

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

    // register dialogset
    this.dialogs = new DialogSet(this.mainDispatcherAccessor);
    // register dialogs
    this.addDialog(new QnADispatcher(this.onTurnAccessor, this.userProfileAccessor));
    this.addDialog(new SectionDialog(this.onTurnAccessor, this.conversationState, this.userProfileAccessor));
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
      if (
        (onTurnProperty === undefined || onTurnProperty.intent === '') &&
        (dc.context.activity.text != '1' || dc.context.activity.text != '2' || dc.context.activity.text != '3' || dc.context.activity.text != '4' || dc.context.activity.text != '5')
      ) {
        // if no intent from the menu is detected analyse message in the QnADispatcher
        await dc.beginDialog(QnADispatcher.Name);
        // after answering the question send the menu again
        await dc.context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(MenuCard)));
      } else {
        // No one has responded so start the right child dialog.
        dialogTurnResult = await this.beginChildDialog(dc, onTurnProperty);
      }
    }

    if (dialogTurnResult === undefined) return await dc.endDialog();

    // Examine result from dc.continue() or from the call to beginChildDialog().
    switch (dialogTurnResult.status) {
      case DialogTurnStatus.complete: {
        // The active dialog finished successfully. Show the main menu.
        await dc.context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(MenuCard)));
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
        case NONE_INTENT:
        case 'chapter_1':
          return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter1' });
        case 'chapter_2':
          return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter2' });
        case 'chapter_3':
          return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter3' });
        case 'chapter_4':
          return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter4' });
        case 'chapter_5':
          return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter5' });
        default:
          break;
      }
    } else if (dc.context.activity.text) {
      // also react on inputted numbers
      if (dc.context.activity.text.includes('1')) {
        return await dc.beginDialog(SectionDialog.Name);
      } else if (dc.context.activity.text.includes('2')) {
        return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter2' });
      } else if (dc.context.activity.text.includes('3')) {
        return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter3' });
      } else if (dc.context.activity.text.includes('4')) {
        return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter4' });
      } else if (dc.context.activity.text.includes('5')) {
        return await dc.beginDialog(SectionDialog.Name, { chapter: 'chapter5' });
      } else {
        return await dc.context.sendActivity(
          MessageFactory.attachment(CardFactory.heroCard('Hmmm...', 'Ich bin auch selber noch am üben... Es tut mir leid ich weiß nicht was du meinst. Bitte versuche es erneut oder klicke eins der Kapitel an.\n\n![Gif Error](' + GifError() + ')'))
        );
      }
    } else {
      return await dc.context.sendActivity(
        MessageFactory.attachment(CardFactory.heroCard('Hmmm...', 'Ich bin auch selber noch am üben... Es tut mir leid ich weiß nicht was du meinst. Bitte versuche es erneut oder klicke eins der Kapitel an.\n\n![Gif Error](' + GifError() + ')'))
      );
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
      // a check if the Dialog is allowed can be placed here if wanted
    } else {
      if (requestedOperation === CANCEL_INTENT) {
        outcome.allowed = false;
        outcome.reason = `Ich kann leider nichts zum abbrechen finden..`;
      }
    }
    return outcome;
  }
}

module.exports = {
  MainDispatcher: MainDispatcher
};
