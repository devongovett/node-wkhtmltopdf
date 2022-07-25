var spawn = require('child_process').spawn;
var slang = require('slang');
var isStream = require('is-stream');

function quote(val) {
  // escape and quote the value if it is a string and this isn't windows
  if (typeof val === 'string' && process.platform !== 'win32') {
    val = '"' + val.replace(/(["\\$`])/g, '\\$1') + '"';
  }

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
  var spawnOptions = options.spawnOptions;
  delete options.output;
  delete options.spawnOptions;

  // make sure the special keys are last
  var extraKeys = [];
  var keys = Object.keys(options).filter(function(key) {
    if (key === 'toc' || key === 'cover' || key === 'page') {
      extraKeys.push(key);
      return false;
    }

    return true;
  }).concat(extraKeys);

  // make sure toc specific args appear after toc arg
  if (keys.indexOf('toc') >= 0) {
    var tocArgs = ['disableDottedLines', 'tocHeaderText', 'tocLevelIndentation', 'disableTocLinks', 'tocTextSizeShrink', 'xslStyleSheet'];
    var myTocArgs = [];
    keys = keys.filter(function(key){
      if (tocArgs.find(function(tkey){ return tkey === key })) {
        myTocArgs.push(key);
        return false;
      }
      return true;
    });
    var spliceArgs = [keys.indexOf('toc')+1, 0].concat(myTocArgs);
    Array.prototype.splice.apply(keys, spliceArgs);
  }

  var args = [wkhtmltopdf.command];
  if (!options.debug) {
    args.push('--quiet');
  }

  keys.forEach(function(key) {
    var val = options[key];
    if (key === 'ignore' || key === 'debug' || key === 'debugStdOut' || key === 'timeout') { // skip adding the ignore/debug keys
      return false;
    }

    if (key !== 'toc' && key !== 'cover' && key !== 'page') {
      key = key.length === 1 ? '-' + key : '--' + slang.dasherize(key);
    }

    if (Array.isArray(val)) { // add repeatable args
      val.forEach(function(valueStr) {
        args.push(key);
        if (Array.isArray(valueStr)) { // if repeatable args has key/value pair
          valueStr.forEach(function(keyOrValueStr) {
            args.push(quote(keyOrValueStr));
          });
        } else {
          args.push(quote(valueStr));
        }
      });
    } else { // add normal args
      if (val !== false) {
        args.push(key);
      }

      if (typeof val !== 'boolean') {
        args.push(quote(val));
      }
    }
  });

  // Input
  var isArray = Array.isArray(input);
  if (isArray) {
    input.forEach(function(element) {
      var isUrl = /^(https?|file):\/\//.test(element);
      if (isUrl) {
        args.push(quote(element));
      } else {
        console.log('[node-wkhtmltopdf] [warn] Multi PDF only supported for URL files (http[s]:// or file://)')
      }
    })
  } else {
    var isUrl = /^(https?|file):\/\//.test(input);
    if (input) {
      args.push(isUrl ? quote(input) : '-');    // stdin if HTML given directly
    }
  }

  // Output
  args.push(output ? quote(output) : '-');  // stdout if no output file

  // show the command that is being run if debug opion is passed
  if (options.debug && !(options instanceof Function)) {
    console.log('[node-wkhtmltopdf] [debug] [command] ' + args.join(' '));
  }

  if (process.platform === 'win32') {
    var child = spawn(args[0], args.slice(1), spawnOptions);
  } else if (process.platform === 'darwin') {
    var child = spawn('/bin/sh', ['-c', 'set -o pipefail ; ' + args.join(' ') + ' | cat'], spawnOptions);
  } else {
    // this nasty business prevents piping problems on linux
    // The return code should be that of wkhtmltopdf and not of cat
    // http://stackoverflow.com/a/18295541/1705056
    var child = spawn(wkhtmltopdf.shell, ['-c', 'set -o pipefail ; ' + args.join(' ') + ' | cat'], spawnOptions);
  }

  var timeout
  if (options.timeout) {
    timeout = setTimeout( function () {
      var timeoutError = new Error('Child process terminated due to timeout');
      timeoutError.code = '_EXIT_TIMEOUT';
      handleError(timeoutError);
    }, options.timeout*1000);
  }

  var stream = child.stdout;

  // call the callback with null error when the process exits successfully
  child.on('exit', function(code) {
    if (code !== 0) {
      stderrMessages.code = code;
      handleError(stderrMessages);
    } else if (callback) {
      clearTimeout(timeout);
      callback(null, stream); // stream is child.stdout
    }
  });

  // setup error handling
  var stderrMessages = [];
  function handleError(err) {
    var errObj = null;
    var code;
    var parallelError;
    if (Array.isArray(err)) {
      code = err.code;
      parallelError = err.parallelError;
      // as `err` could contain a small chunks of stdout (and it does sometimes in Windows)
      // we have to concatenate it before using
      err = Buffer.concat(err).toString();
      var lines = err.split(/[\r\n]+/)
        .map(function(line) {
          return line.trim();
        })
        .filter(function(line) {
          return !!line;
        })
      // check ignore warnings array before killing child
      if (options.ignore && options.ignore instanceof Array) {
        var ignoreError = false;
        options.ignore.forEach(function(opt) {
          lines.forEach(function(error) {
            if (typeof opt === 'string' && opt === error) {
              ignoreError = true;
            }
            if (opt instanceof RegExp && error.match(opt)) {
              ignoreError = true;
            }
          });
        });
        if (ignoreError) {
          return true;
        }
      }
      errObj = new Error(lines[0] || ('Child process finished with exit code ' + code));
      errObj.code = 'WKHTMLTOPDF_EXIT_ERROR';
      errObj.errno = code;
      errObj.details = err;
      errObj.parallelError = parallelError;
    } else if (err instanceof Error) {
      errObj = err;
    } else if (err) {
      errObj = new Error(err);
    }
    errObj.args = args;

    clearTimeout(timeout);
    child.removeAllListeners('exit');
    child.kill();
    // call the callback if there is one

    if (callback) {
      callback(errObj);
    }

    // if not, or there are listeners for errors, emit the error event
    if (!callback || stream.listeners('error').length > 0) {
      stream.emit('error', errObj);
    }
  }

  child.once('error', function(err) {
    handleError(err); // critical error
  });

  child.stderr.on('data', function(data) {
    stderrMessages.push(data);
    if (options.debug instanceof Function) {
      options.debug(data);
    } else if (options.debug) {
      console.log('[node-wkhtmltopdf] [debug] ' + data.toString());
    }
  });

  if (options.debugStdOut && !output) {
    throw new Error('debugStdOut may not be used when wkhtmltopdf\'s output is stdout');
  }

  if (options.debugStdOut && output) {
    child.stdout.on('data', function(data) {
      if (options.debug instanceof Function) {
        options.debug(data);
      } else if (options.debug) {
        console.log('[node-wkhtmltopdf] [debugStdOut] ' + data.toString());
      }
    });
  }

  // write input to stdin if it isn't a url
  if (!isUrl && !isArray) {
    if (isStream(input)) {
      input.pipe(child.stdin)
        .on('error', function(e) {
          stderrMessages.parallelError = e;
        });
    } else {
      child.stdin.end(input);
    }
  }

  // return stdout stream so we can pipe
  return stream;
}

wkhtmltopdf.command = 'wkhtmltopdf';
wkhtmltopdf.shell = '/bin/bash';
module.exports = wkhtmltopdf;
