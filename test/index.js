var rewire = require('rewire');
var wkhtmltopdf = rewire('../index.js');

describe('wkhtmltopdf', function() {

  wkhtmltopdf.__set__("genPDF", function(input, args, callback) {
    return args;
  });

  describe('function', function() {
    var options = {
      headerCenter: "TEST PDF",
      headerFontSize: 10,
      headerSpacing: 5,
      marginTop: 15,
      output: "./google.pdf"
    };

    it('should produce a well-formed command-line invocation of wkhtmltopdf from a single source and global options', function() {
      var args = wkhtmltopdf('http://google.com', options);

      var expected = 'wkhtmltopdf --quiet --header-center "TEST PDF" --header-font-size 10 --header-spacing 5 --margin-top 15 "http://google.com" "./google.pdf"';

      if (args.join(' ') != expected) {
        throw new Error("generated args don't match expected");
      }
    });

    it('should produce a well-formed command-line invocation of wkhtmltopdf from multiple pages with individual page options', function() {
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

      var args = wkhtmltopdf(pages, options);
      var expected = 'wkhtmltopdf --quiet --header-center "TEST PDF" --header-font-size 10 --header-spacing 5 --margin-top 15 cover "http://google.com" toc   "https://github.com" --enable-toc-back-links --page-offset -2  "http://wkhtmltopdf.org/usage/wkhtmltopdf.txt" "multi-page.pdf"';

      if (args.join(' ') != expected) {
        throw new Error("generated args don't match expected");
      }
    });

  });

});
