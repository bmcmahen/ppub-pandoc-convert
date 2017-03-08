var chai = require('chai');
var expect = chai.expect;

var write = require('fs-writefile-promise');
var execPromise = require('child-process-promise').exec;

var convertPandocToPpub = require('../../pandoc-to-ppub').pandocToPpub;


describe('Convert Pandoc to Ppub', function() {
	it('simple bold', (done) => {
		const testName = 'bold-pandoc';
		convertPandocToPpub(require(`./${testName}.json`))
		.then((result) => {
			return write(pandocFile, JSON.stringify(result, null, '\t'));
		})
		.then(done, done);
	});
});
