var spawn = require('child_process').spawn;
var slang = require('slang');

function wkhtmltopdf(input, options, callback) {
    if (!options) {
        options = {};
    } else if (typeof options == 'function') {
        callback = options;
        options = {};
    }

    var output = options.output;
    delete options.output;

    var debugOutput = options.debugOutput;
    delete options.debugOutput;

    var args = [wkhtmltopdf.command];
    for (var key in options) {
        var val = options[key];

        if ('toc' === key ||
            'cover' === key ||
            'page' === key) {
            key = slang.dasherize(key);
        } else {
            key = key.length === 1 ? '-' + key : '--' + slang.dasherize(key);
        }

        if (val !== false)
            args.push(key);

        if (typeof val !== 'boolean') {
            // escape and quote the value if it is a string
            if (typeof val === 'string') {

                val = val.replace(/(["\\$`])/g, '\\$1');
            }

            args.push(val);
        }
    }

    var isUrl = /^(https?|file):\/\//.test(input);
    args.push(isUrl ? input : '-'); // stdin if HTML given directly
    args.push(output || '-'); // stdout if no output file

    if (process.platform === 'win32') {
    		
    		if (debugOutput) {
        	console.log(args.join(' '));
        }

        var child = spawn(args[0], args.slice(1));
    } else {
        // this nasty business prevents piping problems on linux
        var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
    }

    if (callback)
        child.on('exit', callback);

    if (!isUrl)
        child.stdin.end(input);

    if (debugOutput) {
        child.stderr.on('data', function(data) {
            console.log(data.toString());
        });
    }

    // return stdout stream so we can pipe
    return child.stdout;
}

wkhtmltopdf.command = 'wkhtmltopdf';
module.exports = wkhtmltopdf;
