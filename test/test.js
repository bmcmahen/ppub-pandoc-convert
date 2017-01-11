var assert = require('assert');
var convert = require('../index.js')
var chai = require('chai');
var expect = chai.expect;    // Using Expect style

describe('Convert docJSON to PandocAST', function() {
  describe(', successful to: ', function() {
    it('simple bold', (done) => {
      convert('test/bold.json').then((result) => {
        expect(result).to.equal(true);
      }).then(done, done);
    })
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
    it('text before first word', (done) => {
      convert('test/text-before-paragraph.json').then((result) => {
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
