const feedBackCard = {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "Container",
            "items": [
                {
                    "type": "TextBlock",
                    "size": "Medium",
                    "weight": "Bolder",
                    "text": "Wie fandest du deine Erfahrung mit mir in dem letzten Kapitel?",
                    "wrap": true
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": "rating",
                    "placeholder": "Wie viele Sterne würdest du mir bisher geben?",
                    "choices": [
                        {
                            "title": "⭐️⭐️⭐️",
                            "value": "3"
                        },
                        {
                            "title": "⭐️⭐️",
                            "value": "2"
                        },
                        {
                            "title": "⭐️",
                            "value": "1"
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": "\n\nHier kannst du uns einfach einen Kommentar, Kritik oder Anregungen zu mir dem Loop-Bot hinterlassen 🤖.",
                    "wrap": true
                },
                {
                    "type": "Input.Text",
                    "id": "name",
                    "placeholder": "(Optional)",
                    "isMultiline": true
                },
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.Submit",
            "title": "Feedback abschicken"
        }
    ]
}

module.exports.feedBackCard = feedBackCard;