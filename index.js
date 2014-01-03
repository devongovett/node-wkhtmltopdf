//WKHTMLTOPDF
var spawn = require('child_process').spawn;
var slang = require('slang');

function wkhtmltopdf(input, options, callback) {
  if (!options) {
    options = { quiet: true, logging: false, };
  } else if (typeof options == 'function') {
    callback = options;
    options = { quiet: true, logging: false, };
  }
  var logging = options.logging ? options.logging===true ? true : false : false;
  delete options.logging;
  
  var output = options.output;
  delete options.output;
  
  var args = [];
  args.push(wkhtmltopdf.command );
  
  if ( options.quiet )
    args.push('--quiet');
  delete options.quiet;


  for (var key in options) {
    var val = options[key];
    key = key.length === 1 ? '-' + key : '--' + slang.dasherize(key);
    
    if (val !== false)
      args.push(key);
      
    if (typeof val !== 'boolean') {
      // escape and quote the value if it is a string
      if (typeof val === 'string')
        val = '"' + val.replace(/(["\\$`])/g, '\\$1') + '"';
        
      args.push(val);
    }
  }

  var isUrl = /^(https?|file):\/\//.test(input);
  if (process.platform === 'win32')
    input = '"' + input + '"';

  args.push(isUrl ? input : '-'); // stdin if HTML given directly
  args.push(output || '-');       // stdout if no output file

  if (process.platform === 'win32') {
    args.unshift('"');    
    args.unshift('/C');
    args.push('"');
    
    if (logging) {
      console.log('WKHTMLTOPDF args:\n');
      console.dir(args);
      console.log('\n');
    }
    
    var child = spawn('cmd', args, { windowsVerbatimArguments: true });
    if (logging) logError(child);
  } else {
    // this nasty business prevents piping problems on linux
    var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
    if (logging) logError(child);
  }

  if (callback)
    child.on('exit', callback);

  if (!isUrl)
    child.stdin.end(input);
  
  // return stdout stream so we can pipe
  return child.stdout;
}

function logError(child) {
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function(data) { console.log('(INFO) WKHTML INFO --------------------------- \n'); console.dir(data); });
  
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function(data) { console.log('(ERROR) WKHTML ERROR --------------------------- \n'); console.dir(data); });
}

wkhtmltopdf.command = 'wkhtmltopdf';
module.exports = wkhtmltopdf;
