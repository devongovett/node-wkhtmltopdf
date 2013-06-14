var spawn = require('child_process').spawn;
var slang = require('slang');

function wkhtmltopdf(input, options) {
  if (!options)
    options = {};
  
  var output = options.output;
  delete options.output;
  
  var args = [wkhtmltopdf.command, '--quiet'];
  for (var key in options) {
    var val = options[key];
    key = '--' + slang.dasherize(key);
    
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
  
  // this nasty business prevents piping problems on linux
  var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
  if (!isUrl)
    child.stdin.end(input);
  
  // return stdout stream so we can pipe
  return child.stdout;
}

wkhtmltopdf.command = 'wkhtmltopdf';
module.exports = wkhtmltopdf;