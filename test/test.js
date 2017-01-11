var assert = require('assert');
var convert = require('../index.js')

describe('Convert docJSON to PandocAST', function() {
  describe('Successful conversions', function() {
    it('Simple bold example', function() {
      convert('test/bold.json');
    });
    it('Simple italic example', function() {
      convert('test/bold.json');
    });
    it('Simple bold-italic example', function() {
      convert('test/bold-italic.json');
    });
    it('Simple heading one example', function() {
      convert('test/heading-one.json');
    });
  });
});
