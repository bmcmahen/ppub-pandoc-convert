var convert = require('../../ppubToPandoc.js').ppubToPandoc;
var chai = require('chai');
var expect = chai.expect;

var write = require('fs-writefile-promise');
var execPromise = require('child-process-promise').exec;

var convertPandocToPpub = require('../../pandocToPpub').pandocToPpub;

describe('Convert docJSON to PandocAST', function() {
	describe(', successful to: ', function() {
		it('simple bold', (done) => {
			const testName = 'bold';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});

		it('simple italic', (done) => {
			const testName = 'italic';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple bold and italic', (done) => {
			const testName = 'bold-and-italic';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple heading one', (done) => {
			const testName = 'heading-one';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple strikethrough', (done) => {
			const testName = 'strikethrough';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple image', (done) => {
			const testName = 'image';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple code', (done) => {
			const testName = 'code';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('new lines', (done) => {
			const testName = 'newlines';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('ordered list', (done) => {
			const testName = 'ordered-list';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('text before first word', (done) => {
			const testName = 'text-before-paragraph';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('superscript', (done) => {
			const testName = 'superscript';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('subscript', (done) => {
			const testName = 'subscript';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('quotation', (done) => {
			const testName = 'quotation';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('simple table', (done) => {
			const testName = 'table';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('more complex pub', (done) => {
			const testName = 'more-complex-pub';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('nested ordered lists', (done) => {
			const testName = 'nested-ol';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});

		it('code block', (done) => {
			const testName = 'codeblock';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('table 4 empty cells', (done) => {
			const testName = 'table-4-empty-cells';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('citations', (done) => {
			const testName = 'citations';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
		it('complete pub 1', (done) => {
			const testName = 'complete-pub-1';
			const pandocFile = `${__dirname}/pandoc/${testName}.json`;
			const markdownFile = `${__dirname}/md/${testName}.md`;
			convert(require(`./${testName}.json`), {bibFile: `test/toPandoc/bib/${testName}.bib` })
			.then((result) => {
				return write(pandocFile, JSON.stringify(result, null, '\t'));
			})
			.then(function() {
				return execPromise(`pandoc -f JSON ${pandocFile} --filter=pandoc-citeproc -t markdown-simple_tables+pipe_tables --atx-headers -o ${markdownFile}`);
			})
			.then(function(result) {
				expect(result).to.exist;
			})
			.then(done, done);
		});
	});
});
