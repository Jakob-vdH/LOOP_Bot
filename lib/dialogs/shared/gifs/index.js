const gif = require("./links.json");

function randomGifGoodJob() {
    const random = Math.floor((Math.random() * gif.goodJob.links.length));
    return gif.goodJob.links[random];
};

function randomGifError() {
    const random = Math.floor((Math.random() * gif.error.links.length));
    return gif.error.links[random];
}

function randomGifGreeting() {
    const random = Math.floor((Math.random() * gif.greeting.links.length));
    return gif.greeting.links[random];
}

module.exports = {
    GifGood: randomGifGoodJob,
    GifError: randomGifError,
    GifGreeting: randomGifGreeting
}