const { ComponentDialog, TextPrompt, DialogSet, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { Questions } = require("./ressources");
const { SimpleQuestion } = require("../shared/questionTemplates");
const { UserProfile, UserProfileManager } = require("../shared/stateProperties");
const { shuffle } = require("../shared/helpers");
const { ResetQuestionsDialog } = require("../shared/profileDialogs");
const { menuPrompt } = require("../shared/prompts");

const CHAPTER_1 = "Chapter_1";
const LOOP = "Chapter_loop";
const TEXTPROMPT = "textprompt";

const lists = {
    "chapter1": Questions.chapter1,
    "chapter2": Questions.chapter2,
    "chapter3": Questions.chapter3,
    "chapter4": Questions.chapter4,
    "chapter5": Questions.chapter5
};
// const list = Questions.questions;


class Chapter1 extends ComponentDialog {
    static get Name() { return CHAPTER_1 }
    constructor(onTurnAccessor, conversationState, userProfileAccessor) {
        super(CHAPTER_1);
        // this.initialDialogId = LOOP;
        this.onTurnAccessor = onTurnAccessor;
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
    async onBeginDialog(dc, options) {
        return await dc.beginDialog(LOOP, options);
        // this.startRandomQuestion(dc);
    }

    async startRandomQuestion(dc) {

        let chapterOption = 'chapter1';
        if (dc.options && dc.options.chapter) {
            chapterOption = dc.options.chapter;
        }

        // read and set userId from context data
        let userId = dc.context.activity.from.id;
        if (userId === null || userId === undefined) {
            userId = "annonymous"
        }
        const userProfileManager = new UserProfileManager();
        let user;
        let tmp = await this.userProfileAccessor.get(dc.context);
        if (tmp === undefined) {
            tmp = await userProfileManager.getUser(userId);
            if (tmp === null) {
                user = new UserProfile(userId, chapterOption);
                await userProfileManager.createUser(user);
            } else {
                user = new UserProfile(tmp.userId, tmp.currentChapter, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
            }
            this.userProfileAccessor.set(dc.context, user);
        } else {
            user = new UserProfile(tmp.userId, tmp.currentChapter, tmp.chapter1, tmp.chapter2, tmp.chapter3, tmp.chapter4, tmp.chapter5);
            // user = new UserProfile(tmp.questionsPool, tmp.answeredQuestions, tmp.falseQuestions, tmp.language);
        }

        if (chapterOption != user.currentChapter && dc.options.chapter === undefined) {
            chapterOption = user.currentChapter;
        }

        if (user[chapterOption].questionsPool.length === 0) {
            user[chapterOption].createPool(lists[chapterOption]);
            user.currentChapter = chapterOption;
            await user.updateInDb();
            this.userProfileAccessor.set(dc.context, user);
            if (user[chapterOption].questionsPool.length === 0) {
                return await dc.beginDialog(ResetQuestionsDialog.Name, { chapter: chapterOption });
            }
        }
        // if (user.questionsPool.length === 0) {
        //     user.createPool(list);
        //     this.userProfileAccessor.set(dc.context, user);
        //     if (user.questionsPool.length === 0) {
        //         return await dc.beginDialog(ResetQuestionsDialog.Name);
        //     }
        // }
        // if question type
        switch(){
            case "": return await dc.beginDialog(SimpleQuestion.Name, { chapter: chapterOption, number: (user[chapterOption].answeredQuestions.length + 1), total: lists[chapterOption].length });
                break;
            default:
        }
    }
}

module.exports = {
    Chapter1: Chapter1
}