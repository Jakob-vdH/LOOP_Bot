const { ComponentDialog, TextPrompt, DialogSet, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { Questions } = require("./ressources");
const { SimpleQuestion } = require("../shared/questionTemplates");
const { UserProfile } = require("../shared/stateProperties");
const { shuffle } = require("../shared/helpers");
const { ResetQuestionsDialog } = require("../shared/profileDialogs");
const { menuPrompt } = require("../shared/prompts");

const CHAPTER_1 = "Chapter_1";
const LOOP = "Chapter_loop";
const TEXTPROMPT = "textprompt";
// const list = [
//     Question1
// ]
const list = Questions.questions;


class Chapter1 extends ComponentDialog {
    static get Name() { return CHAPTER_1 }
    constructor(onTurnAccessor, conversationState, userProfileAccessor) {
        super(CHAPTER_1);
        this.onTurnAccessor = onTurnAccessor;
        //this.userProfileAccessor = userProfileAccessor;
        this.conversationState = conversationState;
        this.chapter1Accessor = conversationState.createProperty("CHAPTER_1_ACCESSOR");
        this.userProfileAccessor = userProfileAccessor;
        this.dialogs = new DialogSet(this.chapter1Accessor);
        this.addDialog(new TextPrompt(TEXTPROMPT));
        this.addDialog(new SimpleQuestion(this.onTurnAccessor, this.userProfileAccessor));
        this.addDialog(new ResetQuestionsDialog(this.onTurnAccessor, this.userProfileAccessor));
        this.addDialog(new WaterfallDialog(LOOP, [
            this.startRandomQuestion.bind(this),
            async function (step) {
                if (step.result) {
                    // check if the user wants to go back to the main menu
                    if (step.result.end) {
                        return await step.endDialog();
                    }
                    // check if next question prompt has to be skipped
                    if (step.result.skip) {
                        return await step.next(menuPrompt.values.next);
                    }
                }
                return await step.prompt(TEXTPROMPT, MessageFactory.attachment(CardFactory.heroCard("", [], menuPrompt.arr)));
            },
            async function (step) {
                if (step.result === menuPrompt.values.next) {
                    return await step.replaceDialog(LOOP);
                } else {
                    return await step.endDialog();
                }
            }
        ]));

        // init user with questions
    }

    /**
     * Override beginDialog.
     *
     * @param {DialogContext} dialog context
     * @param {Object} options
     */
    async onBeginDialog(dc) {
        return await dc.beginDialog(LOOP);
        // this.startRandomQuestion(dc);
    }

    async startRandomQuestion(dc) {
        let user;
        let tmp = await this.userProfileAccessor.get(dc.context);
        if (tmp === undefined) {
            user = new UserProfile();
            this.userProfileAccessor.set(dc.context, user);
        } else {
            user = new UserProfile(tmp.questionsPool, tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
        }
        if (user.questionsPool.length === 0) {
            user.createPool(list);
            this.userProfileAccessor.set(dc.context, user);
            if (user.questionsPool.length === 0) {
                return await dc.beginDialog(ResetQuestionsDialog.Name);
            }
        }
        return await dc.beginDialog(SimpleQuestion.Name, { dialog: user.questionsPool[0], number: (user.answeredQuestions.length + 1), total: list.length });
    }
}

module.exports = {
    Chapter1: Chapter1
}