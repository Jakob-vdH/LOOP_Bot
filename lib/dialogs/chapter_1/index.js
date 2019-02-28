const { ComponentDialog, DialogSet } = require("botbuilder-dialogs");
const { Questions } = require("./ressources");
const { SimpleQuestion } = require("../shared/questionTemplates");
const { UserProfile } = require("../shared/stateProperties");
const { shuffle } = require("../shared/helpers");

const CHAPTER_1 = "Chapter_1";
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
        this.addDialog(new SimpleQuestion(this.onTurnAccessor, this.userProfileAccessor));

        // init user with questions
    }

    /**
     * Override beginDialog.
     *
     * @param {DialogContext} dialog context
     * @param {Object} options
     */
    async onBeginDialog(dc) {
        return await this.startRandomQuestion(dc);
    }

    async startRandomQuestion(dc) {
        let onTurnProperty = await this.onTurnAccessor.get(dc.context);
        let user = await this.userProfileAccessor.get(dc.context);
        if (user === undefined) {
            user = new UserProfile();
            this.userProfileAccessor.set(dc.context, user);
        }
        const random = Math.floor((Math.random() * list.length));
        const question = list[random];
        return await dc.beginDialog(SimpleQuestion.Name, { dialog: question });
    }
}

module.exports = {
    Chapter1: Chapter1
}