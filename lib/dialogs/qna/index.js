const { ComponentDialog, DialogSet } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { LuisRecognizer } = require("botbuilder-ai");
const answers = require("./ressources/answers.js");
const { OnTurnProperty, saveLog } = require("../shared/stateProperties");

// LUIS service type entry in the .bot file for dispatch.
// const LUIS_CONFIGURATION = 'cafeDispatchModel';

// dialog name
const QNA_DISPATCHER_DIALOG = 'QnADispatcherDialog';

class QnADispatcher extends ComponentDialog {
    static get Name() { return QNA_DISPATCHER_DIALOG; }

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

        // add dialogs
        this.dialogs = new DialogSet(this.mainDispatcherAccessor);

        // Add the LUIS recognizer.
        // TODO add LUIS CONFIG
        // const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        // if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n');
        // const luisEndpoint = luisConfig.region && luisConfig.region.indexOf('https://') === 0 ? luisConfig.region : luisConfig.getEndpoint();
        // Map the contents to the required format for `LuisRecognizer`.
        const luisApplication = {
            applicationId: "ccb76831-0c05-462b-bf0b-2ded475eaf5d", // luisConfig.appId,
            endpoint: "https://westeurope.api.cognitive.microsoft.com",// luisEndpoint,
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: "7c106d18093a4c79890f68ff6f71aebe" // luisConfig.authoringKey

        };
        // Create configuration for LuisRecognizer's runtime behavior.
        const luisPredictionOptions = {
            includeAllIntents: true,
            log: false,
            staging: false
        };
        // const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        // if (!luisConfig || !luisConfig.appId) throw new Error(`Cafe Dispatch LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information.\n`);
        this.luisRecognizer = new LuisRecognizer(
            luisApplication
            //,
            //luisPredictionOptions
        );
    }

    /**
     * Override onBeginDialog
     *
     * @param {DialogContext} dc dialog context
     * @param {Object} options dialog turn options
     */
    async onBeginDialog(dc, options) {
        // Override default begin() logic with bot orchestration logic
        return await this.qnaDispatch(dc, options);
    }

    /**
     * 
     */
    async qnaDispatch(dc, options) {
        let question, chapter;
        if (options && options.chapter && options.question) {
            question = options.question;
            chapter = options.chapter;
        }
        const LUISResults = await this.luisRecognizer.recognize(dc.context);
        let luis = OnTurnProperty.intentFromLUISResults(LUISResults);
        let answer = "Ich bin auch selber noch am üben... \n Es tut mir leid, ich weiß nicht was du meinst. \n[Hier findest du eventuell eine Antwort](https://de.wikipedia.org/w/index.php?search=informatik+).\nOder du schaust nochmal bei [edX](https://courses.edx.org/courses/course-v1:TUMx+LOOPx+3T2018/) vorbei.";
        if (luis.intent != "None") {
            answer = answers[luis.intent];
        }
        saveLog(dc.context.activity.from.id, question, "", true, dc.context.activity.text, luis.intent, chapter);
        return await dc.context.sendActivity(MessageFactory.attachment(CardFactory.heroCard("", answer)));
        // return await dc.context.sendActivity(answer);
    }
}

module.exports = {
    QnADispatcher: QnADispatcher
}