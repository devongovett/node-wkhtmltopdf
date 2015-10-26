var spawn = require('child_process').spawn;
var slang = require('slang');

function quote(val) {
  // escape and quote the value if it is a string and this isn't windows
  if (typeof val === 'string' && process.platform !== 'win32')
    val = '"' + val.replace(/(["\\$`])/g, '\\$1') + '"';

  return val;
}

function wkhtmltopdf(input, options, callback) {
  if (!options) {
    options = {};
  } else if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  var output = options.output;
  delete options.output;

  try {
    var args = [wkhtmltopdf.command, '--quiet'].concat(processOptions(options)).concat(processInput(input));
  }
  catch (err) {
    emitError(err, callback, process.stderr);
  }

  args.push(output ? quote(output) : '-');  // stdout if no output file

  // console.log(args);
  return genPDF(input, args, callback);
}

function genPDF(input, args, callback) {

  if (process.platform === 'win32') {
    var child = spawn(args[0], args.slice(1));
  } else {
    // this nasty business prevents piping problems on linux
    var child = spawn('/bin/sh', ['-c', args.join(' ') + ' | cat']);
  }

  // call the callback with null error when the process exits successfully
  if (callback)
    child.on('exit', function() { callback(null); });

  // setup error handling
  var stream = child.stdout;
  function handleError(err) {
    child.removeAllListeners('exit');
    child.kill();
    emitError(err, callback, stream);
  }

  child.once('error', handleError);
  child.stderr.once('data', function(err) {
    handleError(new Error((err || '').toString().trim()));
  });

  // write input to stdin if it isn't a url
  if (!Array.isArray(input) && !isURL(input)) {
    child.stdin.end(input);
  }

  // return stdout stream so we can pipe
  return stream;
}

function emitError(err, callback, stream) {
  // call the callback if there is one
  if (callback)
    callback(err);

  // if not, or there are listeners for errors, emit the error event
  if (!callback || stream.listeners('error').length > 0)
    stream.emit('error', err);
}

wkhtmltopdf.command = 'wkhtmltopdf';
module.exports = wkhtmltopdf;


function processOptions(options) {

  // make sure the special keys are last
  var extraKeys = [];
  var keys = Object.keys(options).filter(function(key) {
    if (key === 'toc' || key === 'cover' || key === 'page') {
      extraKeys.push(key);
      return false;
    }

    return true;
  }).concat(extraKeys);

  var opts = [];

  keys.forEach(function(key) {
    var val = options[key];
    if (key !== 'toc' && key !== 'cover' && key !== 'page')
      key = key.length === 1 ? '-' + key : '--' + slang.dasherize(key);

    if (val !== false)
      opts.push(key);

    if (typeof val !== 'boolean')
      opts.push(quote(val));
  });

  return opts;
}

function processInput(inputArgs) {

  var resolvedInput = [];

  if (Array.isArray(inputArgs)) {
    resolvedInput = inputArgs.map(resolveInputObject).reduce(function(accum, val) {
      return accum.concat(val);
    }, []);
  }
  else if (isURL(inputArgs)) {
    resolvedInput.push(quote(inputArgs));
  }
  else {
    resolvedInput.push('-'); // stdin
  }

  return resolvedInput;
}

function isURL(possibleURL) {
    return /^(https?|file):\/\//.test(possibleURL);
}

function resolveInputObject(input) {

  var type, url, options;

  if (typeof input == 'string') {
    if (input == 'toc') {
      type = input;
    }
    else if (isURL(input)) {
      url = input;
    }
  }
  else {
    type = input.type;
    url = input.url;
    if (input.options) {
      options = processOptions(input.options);
    }
  }

  if (!options) {
    options = [];
  }
  else if (!Array.isArray(options)) {
    throw Error("Invalid 'options' Array for page '" + url + "'");
  }

  if (type == 'toc' && url) {
    throw Error("URL is invalid for page type 'toc' in '" + url + "'");
  }
  else if (type != 'toc' && !isURL(url)) {
    throw Error("Invalid 'url' for page: " + type + "'" + url + "'");
  }

  if (!type) {
    type = '';
  }

  if (!url) {
    url = '';
  }
  else {
    url = quote(url);
  }

  return [type, url].concat(options);

}

