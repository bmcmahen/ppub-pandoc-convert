var pandocToPpub = require('./pandocToPpub').pandocToPpub;
var ppubToPandoc = require('./ppubToPandoc').ppubToPandoc;

console.log(process.argv)
console.log("SLOO")
// Allow command line args `node index fileToConvert.json`
if (process.argv[2] === '--toPandoc') {
	ppubToPandoc(require(`./${process.argv[3]}`));
} else if (process.argv[2] === '--toPpub') {
	pandocToPpub(require(`./${process.argv[3]}`));
} else {
	exports.ppubToPandoc = ppubToPandoc;
	exports.pandocToPpub = pandocToPpub;
}
