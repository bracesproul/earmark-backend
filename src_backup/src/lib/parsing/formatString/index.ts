const addUnderscoreToSpace = (string:any) => string.replace(/\W/g, '_');
const makeStringJustLetterAndNumber = (string:string) => {
    let newString = string;
    newString = newString.replace(/[^A-Z0-9]+/ig, " ");
    newString = newString.replace(/\D/g, c => c.toLowerCase())
    newString = newString.replace(/\b\w/g, c => c.toUpperCase());
    return newString;
} 

module.exports = {
    addUnderscoreToSpace: addUnderscoreToSpace,
    makeStringJustLetterAndNumber: makeStringJustLetterAndNumber
};