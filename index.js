var spawn = require('child_process').spawn;
var slang = require('slang');

function wkhtmltopdf(input, options, callback) {
  if (!options)
    options = {};
  else if (options === typeof 'function') {
    callback = options;
    options = {};
  }
  
  var output = options.output;
  delete options.output;
  
  var args = [wkhtmltopdf.command, '--quiet'];
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
  args.push(isUrl ? input : '-'); // stdin if HTML given directly
  args.push(output || '-');       // stdout if no output file

  var child = spawnPdfGenerationProcess(args);

  if (callback)
    child.on('exit', callback);

  if (!isUrl)
    child.stdin.end(input);
  
  // return stdout stream so we can pipe
  return child.stdout;
}

function spawnPdfGenerationProcess(args) {

  if(process.platform === 'win32') {

    var commandPath = args[0];
    args.splice(0, 1);
    return spawn(commandPath, args);

  } else {

    // this nasty business prevents piping problems on linux
    return spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);

  }
}

wkhtmltopdf.command = 'wkhtmltopdf';
module.exports = wkhtmltopdf;
