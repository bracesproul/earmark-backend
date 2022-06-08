/* eslint-disable */
const parseNumbers = (number: number) => {
    if (number === 0) return number.toFixed(2);
    const numString = number.toString();
    if (numString.includes('.')) {
        numString.split('.')[1].length > 2 ? number = parseFloat(numString.split('.')[0] + '.' + numString.split('.')[1].slice(0, 2)) : number = parseFloat(numString);
        return number.toFixed(2);
    }
    return parseInt(numString).toFixed(2);
};

module.exports = parseNumbers;