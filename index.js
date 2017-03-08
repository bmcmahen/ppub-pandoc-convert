var pandocToPpub = require('./pandocToPpub').pandocToPpub;
var ppubToPandoc = require('./ppubToPandoc').ppubToPandoc;

if (process.argv[2] === '--toPandoc') {
	ppubToPandoc(require(`./${process.argv[3]}`));
} else if (process.argv[2] === '--toPpub') {
	pandocToPpub(require(`./${process.argv[3]}`));
} else {
	exports.ppubToPandoc = ppubToPandoc;
	exports.pandocToPpub = pandocToPpub;
}
