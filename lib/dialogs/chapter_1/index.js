const { ComponentDialog, DialogSet } = require("botbuilder-dialogs");
const { Question1 } = require("./ressources/cards")

const CHAPTER_1 = "Chapter_1";
const list = [
    Question1
]

class Chapter1 extends ComponentDialog {
    static get Name() { return CHAPTER_1 }
    constructor(onTurnAccessor, conversationState) {
        super(CHAPTER_1);
        this.onTurnAccessor = onTurnAccessor;
        //this.userProfileAccessor = userProfileAccessor;
        this.conversationState = conversationState;
        this.chapter1Accessor = conversationState.createProperty("CHAPTER_1_ACCESSOR");
        this.dialogs = new DialogSet(this.chapter1Accessor);
        this.addDialog(new Question1(this.onTurnAccessor));
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
        const random = Math.floor((Math.random() * list.length));
        const dialog = list[random];
        return await dc.beginDialog(dialog.Name);
    }
}

module.exports = {
    Chapter1: Chapter1
}