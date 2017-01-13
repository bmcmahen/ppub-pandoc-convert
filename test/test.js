var convert = require('../index.js');
var chai = require('chai');
var expect = chai.expect;

describe('Convert docJSON to PandocAST', function() {
	describe(', successful to: ', function() {
		it('simple bold', (done) => {
			convert('test/bold.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple italic', (done) => {
			convert('test/italic.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple bold and italic', (done) => {
			convert('test/bold-and-italic.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple heading one', (done) => {
			convert('test/heading-one.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple strikethrough', (done) => {
			convert('test/strikethrough.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple image', (done) => {
			convert('test/image.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});

		it('simple code', (done) => {
			convert('test/code.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('new lines', (done) => {
			convert('test/newlines.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('ordered list', (done) => {
			convert('test/ordered-list.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('ordered list 2', (done) => {
			convert('test/ordered-list-2.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('text before first word', (done) => {
			convert('test/text-before-paragraph.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('superscript', (done) => {
			convert('test/superscript.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('subscript', (done) => {
			convert('test/subscript.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('quotation', (done) => {
			convert('test/quotation.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple table', (done) => {
			convert('test/table.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('more complex pub', (done) => {
			convert('test/more-complex-pub.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('nested ordered lists', (done) => {
			convert('test/nested-ol.json').then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
	});
	// describe(', failure to: ', function() {
	//   it('simple bold', (done) => {
	//     convert('test/bold.json').then((result) => {
	//       console.log("DONE : D " + result)
	//       expect(result).to.equal(1);
	//       done();
	//     }).then(done, done);
	//   })
	// });
});
