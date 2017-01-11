var assert = require('assert');
var convert = require('../index.js')
var chai = require('chai');
var expect = chai.expect;    // Using Expect style

describe('Convert docJSON to PandocAST', function() {
  describe(', successful to: ', function() {
    it('simple bold', (done) => {
      convert('test/bold.json').then( (result) => {
        expect(result).to.equal(true);
        done();
      }).then(done, done);
    })
    it('simple italic', function() {
      convert('test/italic.json').then( (result) => {
        expect(result).to.equal(true);
        done();
      }).then(done, done);
    });
    it('simple bold-italic', function() {
      convert('test/bold-italic.json').then( (result) => {
        expect(result).to.equal(true);
        done();
      }).then(done, done);
    });
    it('simple heading one', function() {
      convert('test/heading-one.json').then( (result) => {
        expect(result).to.equal(true);
        done();
      }).then(done, done);
    });
    it('simple strikethrough', function() {
      convert('test/strikethrough.json').then( (result) => {
        expect(result).to.equal(true);
        done();
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
