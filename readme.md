node-wkhtmltopdf
================

A Node.js wrapper for the [wkhtmltopdf](http://wkhtmltopdf.org/) command line tool.  As the name implies, 
it converts HTML documents to PDFs using WebKit.

## Usage

```javascript
var wkhtmltopdf = require('wkhtmltopdf').pdf; 

//or this works, but is deprecated
//var wkhtmltopdf = require('wkhtmltopdf')

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

There are [many options](http://wkhtmltopdf.org/docs.html) available to
wkhtmltopdf.  All of the command line options are supported as documented on the page linked to above.  The
options are camelCased instead-of-dashed as in the command line tool. Repeatable options can be specified as arrays. Repeatable options of the form `<name>` `<value>` can be specified as objects with properties with corresponding name/value pairs. See the example below.

```javascript
// --page-size "letter" --allow "pathA" --allow "pathB" --cookie "User-Name" "king" --cookie "Role" "admin"
var options = { pageSize: 'letter', allow: ['pathA', 'pathB'], cookie: { 'User-Name': 'king', 'Role': 'admin'} }
wkhtmltopdf('http://localhost', options)
```

There is also an `output` option that can be used to write the output directly to a filename, instead of returning
a stream.

##wkhtmltoimage support

To call the wkhtmltoimage command instead of wkhtmltopdf, you can do this:

```javascript
var wkhtmltoimage = require('wkhtmltopdf').image;

//same interface!
wkhtmltoimage('http://google.com/', { pageSize: 'letter' })
  .pipe(fs.createWriteStream('out.jpg'));
```

Or, if you're using both wkhtmltopdf and wkhtmltoimage, consider this:
```javascript
var wkhtmlto = require('wkhtmltopdf');

wkhtmlto.pdf('http://google.com/', { pageSize: 'letter' })
  .pipe(fs.createWriteStream('out.pdf'));

wkhtmlto.image('http://google.com/')
  .pipe(fs.createWriteStream('out.jpg'));
```

##custom command support

If wkhtmltopdf isn't in your path, fear not, you may supply any command you like:
```javascript
var wkhtmltoimage = require('wkhtmltopdf').customCommand('/my/path/to/wkhtmltopdf');
```

Once upon a time you could mutate state on the module exports to achieve similar functionality. This is still
supported to not break compatability but you're strongly encouraged to change your code to use the customCommand 
syntax above.
```javascript
// Don't do this
//require('wkhtmltopdf').command = '/my/path/to/wkhtmltopdf'
```

## Installation

First, you need to install the wkhtmltopdf command line tool on your system.  The easiest way to do this is to
[download](http://wkhtmltopdf.org/downloads.html#stable) a prebuilt version for your system.  Don't try to use
the packages provided by your distribution as they may not be using a patched Qt and have missing features.

Finally, to install the node module, use `npm`:

    npm install wkhtmltopdf
    
Be sure `wkhtmltopdf` is in your PATH when you're done installing.  If you don't want to do this for some reason, you can change
the `wkhtmltopdf.command` property to the path to the `wkhtmltopdf` command line tool.
    
## License

MIT
