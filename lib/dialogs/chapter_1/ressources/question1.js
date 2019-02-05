const { ComponentDialog, TextPrompt, WaterfallDialog } = require("botbuilder-dialogs");
const { MessageFactory, CardFactory } = require("botbuilder");
const { Question1Card } = require("./cards/question1Card.json");

const QUESTION_1 = "Question_1";

class Question1 extends ComponentDialog {
    static get Name() { return QUESTION_1; }
    constructor(onTurnAccessor) {
        super(QUESTION_1);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = QUESTION_1;
        this.onTurnAccessor = onTurnAccessor;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(QUESTION_1, [
            async function (step) {
                // Clear the guest information and prompt for the guest's name.
                // const message = MessageFactory.attachment(CardFactory.adaptiveCard(Question1Card))
                // await step.context.sendActivity(message);
                return await step.prompt('textPrompt', MessageFactory.attachment(CardFactory.heroCard("**1.1 Objekte**\nWelche Aussage zu Objekten trifft zu?", "**(1)** Objekte brauchen keinen eindeutigen Bezeichner \n**(2)** Objekte besitzen mindestens 2 Attribute \n**(3)** Die Eigenschaften eines Objektes werden über Attribut-Werte bestimmt", [], ["Antwort 1", "Antwort 2", "Antwort 3"])));
                //await step.context.sendActivity()
                //return await step.next();


                // return await step.prompt('textPrompt', "What is your name?");
            },
            async function (step) {
                // Save the name and prompt for the room number.
                console.log(step.result);
                if (step.result === "Antwort 3") {
                    await step.context.sendActivity("✅ Die Eigenschaften der Objekte werden durch die Werte ihrer Attribute beschrieben. Ein Objekt kann mehrere Attribute besitzen. \n( richtig ist **Anwort 3** )")
                } else {
                    await step.context.sendActivity("❌ Die Eigenschaften der Objekte werden durch die Werte ihrer Attribute beschrieben. Ein Objekt kann mehrere Attribute besitzen. \n( richtig ist **Anwort 3** )");
                }
                return await step.endDialog();
            }
        ]));
    }
}

module.exports.Question1 = Question1;