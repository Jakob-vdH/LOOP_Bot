const { ComponentDialog, DialogSet, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { MessageFactory, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const answers = require('./ressources/answers.js');
const { OnTurnProperty, saveLog } = require('../shared/stateProperties');
const config = require('../../config.json').luis;

// LUIS service type entry in the .bot file for dispatch.
// const LUIS_CONFIGURATION = 'cafeDispatchModel';

// dialog name
const QNA_DISPATCHER_DIALOG = 'QnADispatcherDialog';
const TEXTPROMPT = 'textPrompt';

class QnADispatcher extends ComponentDialog {
  static get Name() {
    return QNA_DISPATCHER_DIALOG;
  }

  /**
   * Constructor.
   *
   * // @param {BotConfiguration} botConfig bot configuration
   * @param {StatePropertyAccessor} onTurnAccessor
   * @param {ConversationState} conversationState
   * @param {UserState} userState
   */
  constructor(onTurnAccessor, userProfileAccessor) {
    super(QNA_DISPATCHER_DIALOG);

    // if (!botConfig) throw new Error('Missing parameter. Bot Configuration is required.');
    if (!onTurnAccessor) throw new Error('Missing parameter. On turn property accessor is required.');
    if (!userProfileAccessor) throw new Error('Missing parameter. userProfileAccessor is required.');

    // keep on turn accessor and bot configuration
    this.onTurnAccessor = onTurnAccessor;
    this.initialDialogId = QNA_DISPATCHER_DIALOG;
    // add dialogs
    this.dialogs = new DialogSet(this.mainDispatcherAccessor);
    this.addDialog(new TextPrompt(TEXTPROMPT));

    // Add the LUIS recognizer.
    // TODO add LUIS CONFIG
    // const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
    // if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n');
    // const luisEndpoint = luisConfig.region && luisConfig.region.indexOf('https://') === 0 ? luisConfig.region : luisConfig.getEndpoint();
    // Map the contents to the required format for `LuisRecognizer`.
    const luisApplication = {
      applicationId: config.applicationId, // luisConfig.appId,
      endpoint: config.endpoint, // luisEndpoint,
      // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
      endpointKey: config.endpointKey // luisConfig.authoringKey
    };
    // Create configuration for LuisRecognizer's runtime behavior.
    const luisPredictionOptions = {
      includeAllIntents: true,
      log: false,
      staging: false
    };
    // const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
    // if (!luisConfig || !luisConfig.appId) throw new Error(`Cafe Dispatch LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information.\n`);
    let luisRecognizer = new LuisRecognizer(
      luisApplication
      //,
      //luisPredictionOptions
    );

    this.addDialog(
      new WaterfallDialog(this.initialDialogId, [
        async function(step) {
          let question, chapter;
          if (step.options && step.options.chapter && step.options.question) {
            question = step.options.question;
            chapter = step.options.chapter;
          }
          const LUISResults = await luisRecognizer.recognize(step.context);
          let luis = OnTurnProperty.intentFromLUISResults(LUISResults);
          let answer =
            'Ich bin auch selber noch am üben... \n Es tut mir leid, ich weiß nicht was du meinst. \n[Hier findest du eventuell eine Antwort](https://de.wikipedia.org/w/index.php?search=informatik+).\nOder du schaust nochmal bei [edX](https://courses.edx.org/courses/course-v1:TUMx+LOOPx+3T2018/) vorbei.';
          if (luis.intent != 'None') {
            answer = answers[luis.intent];
          }
          saveLog(step.context.activity.from.id, question, '', true, step.context.activity.text, luis.intent, chapter);
          if (chapter != undefined || step.options.luis) {
            return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard('', answer, [], ['Weiter'])));
          } else {
            await step.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard('', answer)));
            return await step.endDialog();
          }
        },
        async function(step) {
          if (step.result && step.result === 'Weiter') {
            return await step.endDialog();
          } else if (step.result) {
            return await step.replaceDialog(QNA_DISPATCHER_DIALOG, { luis: true });
          } else {
            return await step.endDialog();
          }
        }
      ])
    );
  }

  // /**
  //  * Override onBeginDialog
  //  *
  //  * @param {DialogContext} dc dialog context
  //  * @param {Object} options dialog turn options
  //  */
  // async onBeginDialog(dc, options) {
  //     // Override default begin() logic with bot orchestration logic
  //     return await this.qnaDispatch(dc, options);
  // }

  // /**
  //  *
  //  */
  // async qnaDispatch(dc, options) {

  //     // return await dc.context.sendActivity(answer);
  // }
}

module.exports = {
  QnADispatcher: QnADispatcher
};
