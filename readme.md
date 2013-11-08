node-wkhtmltopdf
================

A Node.js wrapper for the [wkhtmltopdf](http://code.google.com/p/wkhtmltopdf/) command line tool.  As the name implies, 
it converts HTML documents to PDFs using WebKit.

## Usage

```javascript
var wkhtmltopdf = require('wkhtmltopdf');

// URL
wkhtmltopdf('http://google.com/', { pageSize: 'letter' })
  .pipe(fs.createWriteStream('out.pdf'));
  
// HTML
wkhtmltopdf('<h1>Test</h1><p>Hello world</p>')
  .pipe(res);
  
// output to a file directly
wkhtmltopdf('http://apple.com/', { output: 'out.pdf' });

// Optional callback
wkhtmltopdf('http://google.com/', { pageSize: 'letter' }, function (code, signal) {
});
wkhtmltopdf('http://google.com/', function (code, signal) {
});
```

`wkhtmltopdf` is just a function, which you call with either a URL or an inline HTML string, and it returns
a stream that you can read from or pipe to wherever you like (e.g. a file, or an HTTP response).

There are [many options](http://madalgo.au.dk/~jakobt/wkhtmltoxdoc/wkhtmltopdf_0.10.0_rc2-doc.html) available to
wkhtmltopdf.  All of the command line options are supported as documented on the page linked to above.  The
options are camelCased instead-of-dashed as in the command line tool.

There is also an `output` option that can be used to write the output directly to a filename, instead of returning
a stream.

## Installation

First, you need to install the wkhtmltopdf command line tool on your system.  The easiest way to do this is to
[download](http://code.google.com/p/wkhtmltopdf/downloads/list) a prebuilt version for your system.  There are 
various platform specific issues to worry about.  I've found that the 0.11 version of wkhtmltopdf produces PDFs
without selectable text or clickable links on OS X, and some versions require an X server and others do not.

From my experimentation, the best versions are as follows:

* On OS X, I use [version 0.10](http://code.google.com/p/wkhtmltopdf/downloads/detail?name=wkhtmltopdf-OSX-0.10.0_rc2-static.tar.bz2&can=2&q=).
* On Ubuntu, I use [version 0.9.9](http://code.google.com/p/wkhtmltopdf/downloads/list) 32 or 64 bit from that page.  Don't try to use
the version installed via `apt-get` because it is missing features and requires and X server.  Follow 
[this guide](http://wingdspur.com/2012/12/installing-wkhtmltopdf-on-ubuntu/) to make sure you have all the necessary dependencies.

Although those versions are somewhat old, they have worked the best for me.

Finally, to install the node module, use `npm`:

    npm install wkhtmltopdf
    
Be sure `wkhtmltopdf` is in your PATH when you're done installing.  If you don't want to do this for some reason, you can change
the `wkhtmltopdf.command` property to the path to the `wkhtmltopdf` command line tool.
    
## License

MIT
