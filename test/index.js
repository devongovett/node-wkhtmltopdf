var wkhtmltopdf = require('../index.js');

describe('wkhtmltopdf', function() {

  describe('function', function() {
    var options = {
      headerCenter: "TEST PDF",
      headerFontSize: 10,
      headerSpacing: 5,
      marginTop: 15,
      output: "./google.pdf"
    };

    it('should generate a PDF from a single source and global options', function() {
      wkhtmltopdf('http://google.com', options);
    });

    it('should support multiple pages with individual page options', function() {
      options.output = 'multi-page.pdf';

      var pages = [
        {
          type: 'cover',
          url: 'http://google.com'
        },
        'toc', 
        {
          url: 'https://github.com',
          options: {
            enableTocBackLinks: true,
            pageOffset: -2
          }
        },
        'http://wkhtmltopdf.org/usage/wkhtmltopdf.txt'
      ];

      wkhtmltopdf(pages, options);
    });

  });

});
