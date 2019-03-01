
/**
 * Implementation of the Durstenfeld shuffle updated for ES6
 * @param {Array} arr array of for objects for example questions - every array can be used 
 */
exports.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}