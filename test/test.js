var convert = require('../index.js');
var chai = require('chai');
var expect = chai.expect;

describe('Convert docJSON to PandocAST', function() {
	describe(', successful to: ', function() {
		it('simple bold', (done) => {
			convert({ fl: 'test/bold.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple italic', (done) => {
			convert({ fl: 'test/italic.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple bold and italic', (done) => {
			convert({ fl: 'test/bold-and-italic.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple heading one', (done) => {
			convert({ fl: 'test/heading-one.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple strikethrough', (done) => {
			convert({ fl: 'test/strikethrough.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple image', (done) => {
			convert({ fl: 'test/image.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});

		it('simple code', (done) => {
			convert({ fl: 'test/code.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('new lines', (done) => {
			convert({ fl: 'test/newlines.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('ordered list', (done) => {
			convert({ fl: 'test/ordered-list.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('ordered list 2', (done) => {
			convert({ fl: 'test/ordered-list-2.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('text before first word', (done) => {
			convert({ fl: 'test/text-before-paragraph.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('superscript', (done) => {
			convert({ fl: 'test/superscript.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('subscript', (done) => {
			convert({ fl: 'test/subscript.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('quotation' , (done) => {
			convert({ fl: 'test/quotation.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('simple table', (done) => {
			convert({ fl: 'test/table.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('more complex pub', (done) => {
			convert({ fl: 'test/more-complex-pub.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('nested ordered lists', (done) => {
			convert({ fl: 'test/nested-ol.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('bibliography', (done) => {
			convert({ fl: 'test/bibliography.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('code block', (done) => {
			convert({ fl: 'test/codeblock.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
		it('table 4 empty cells', (done) => {
			convert({ fl: 'test/table-4-empty-cells.json' }).then((result) => {
				expect(result).to.equal(true);
			}).then(done, done);
		});
	});
	// describe(', failure to: ', function() {
	//   it('simple bold', (done) => {
	//     convert({ fl: 'test/bold.json' }).then((result) => {
	//       console.log("DONE : D " + result)
	//       expect(result).to.equal(1);
	//       done();
	//     }).then(done, done);
	//   })
	// });
});
