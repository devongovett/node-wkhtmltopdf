node-wkhtmltopdf [![Build Status](https://travis-ci.org/devongovett/node-wkhtmltopdf.svg)](https://travis-ci.org/devongovett/node-wkhtmltopdf)
================

A Node.js wrapper for the [wkhtmltopdf](http://wkhtmltopdf.org/) command line tool.  As the name implies, 
it converts HTML documents to PDFs using WebKit.

## Installation

First, you need to install the `wkhtmltopdf` command line tool on your system.

The **easiest way** to do this is to
[download](http://wkhtmltopdf.org/downloads.html#stable) a prebuilt version for your system.  **DO NOT** try to use
the packages provided by your distribution as they may not be using a patched Qt and have missing features.

Finally, to install the node module, use `npm`:

    npm install wkhtmltopdf
    
Be sure the `wkhtmltopdf` command line tool is in your PATH when you're done installing.  If you don't want to do this for some reason, you can change
the `require('wkhtmltopdf').command` property to the path to the `wkhtmltopdf` command line tool.

## Usage

### wkhtmltopdf(source, [options], [callback]);

```javascript
var wkhtmltopdf = require('wkhtmltopdf');

// URL
wkhtmltopdf('http://google.com/', { pageSize: 'letter' })
  .pipe(fs.createWriteStream('out.pdf'));
  
// HTML
wkhtmltopdf('<h1>Test</h1><p>Hello world</p>')
  .pipe(res);

// Stream input and output
var stream = wkhtmltopdf(fs.createReadStream('file.html'));

// output to a file directly
wkhtmltopdf('http://apple.com/', { output: 'out.pdf' });

// Optional callback
wkhtmltopdf('http://google.com/', { pageSize: 'letter' }, function (err, stream) {
  // do whatever with the stream
});

// Repeatable options
wkhtmltopdf('http://google.com/', {
  allow : ['path1', 'path2'],
  customHeader : [
    ['name1', 'value1'],
    ['name2', 'value2']
  ]
});

// Ignore warning strings
wkhtmltopdf('http://apple.com/', { 
  output: 'out.pdf',
  ignore: ['QFont::setPixelSize: Pixel size <= 0 (0)']
});
// RegExp also acceptable
wkhtmltopdf('http://apple.com/', { 
  output: 'out.pdf',
  ignore: [/QFont::setPixelSize/]
});
```

`wkhtmltopdf` is just a function, which you call with either a URL, an inline HTML string or an Array of URL/objects (see [Multi-Source-Input](#multi-source-input)), and it returns
a stream that you can read from or pipe to wherever you like (e.g. a file, or an HTTP response).

### Multi-Source-input

`wkhtmltopdf` supports the ability to construct a PDF from several source documents, and can even generate a table-of-contents based on an outline inferred from the source HTML structure. To combine several documents into a single PDF, pass an Array of URL or objects as the first argument. Each element of the array represents a single source for the resulting PDF, and must be a valid URL or an object conforming to the following structure:

```
  {
    source: STRING,     // URL to source. Omit for type 'toc'.
    type: STRING,       // 'page', 'toc' or 'cover'. Default: 'page'
    options: {...}      // Page-specific options using same format as global options. Default: {}
  }
```

## Options

There are [many options](http://wkhtmltopdf.org/docs.html) available to
wkhtmltopdf.  All of the command line options are supported as documented on the page linked to above.  The
options are camelCased instead-of-dashed as in the command line tool. Note that options that do not have values, must be specified as a boolean, e.g. **debugJavascript: true**

There is also an `output` option that can be used to write the output directly to a filename, instead of returning
a stream.

### Debug Options

Apart from the **debugJavascript** option from wkhtmltopdf, there is an additional options **debug** and **debugStdOut** which will help you debug rendering issues, by outputting data to the console. **debug** prints and **stderr** messages while **debugStdOut** prints any **stdout** warning messages.

## Tests

Run `npm test` and manually check that generated files are like the expected files. The test suit prints the paths of the files that needs to be compared.

**TODO** - Find a way to automatically compare the PDF files.

## License

MIT
