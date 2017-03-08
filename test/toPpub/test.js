var chai = require('chai');
var expect = chai.expect;

var write = require('fs-writefile-promise');
var execPromise = require('child-process-promise').exec;

var convert = require('../../pandoc-to-ppub').pandocToPpub;

var convertPpubToPandoc = require('../../index.js').ppubToPandoc;


describe('Convert Pandoc to Ppub', function() {
	it('simple bold', (done) => {
		const testName = 'bold';
		const ppubFile = `${__dirname}/ppub/${testName}.json`;
		const newPandocFile = `${__dirname}/newPandoc/${testName}.json`;
		const ppub = convert(require(`./${testName}.json`))

		write(ppubFile, JSON.stringify(ppub, null, '\t'))
		.then(() => {
			convertPpubToPandoc(ppub);
		})
		.then((newPandoc) => {
			return write(newPandocFile, JSON.stringify(newPandoc, null, '\t'));
		})
		.then(() => {
			expect(ppub).to.exist;
		})
		.then(done, done);
	});
});
