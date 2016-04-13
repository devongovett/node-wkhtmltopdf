var Path = require('path'),
  Fs = require('fs'),
  Express = require('express'),
  Rimraf = require('rimraf'),
  Mkdirp = require('mkdirp'),
  Wkhtmltopdf = require('..');


describe('wkhtmltopdf', function() {

  var fixturesDir = Path.join(__dirname, 'fixtures'),
    resultsDir = Path.join(__dirname, 'results'),
    expectedDir = Path.join(__dirname, 'expected');

  // Prepare the results directory
  beforeAll(function() {
    Rimraf.sync(resultsDir);
    Mkdirp.sync(resultsDir);
  });

  function fixturePath(name) { return Path.join(fixturesDir, name); }
  function resultPath(name) { return Path.join(resultsDir, name); }
  function expectedPath(name) { return Path.join(expectedDir, name); }

  function checkResults(resultsName, expectedName) {
    console.log('Check that ' + resultPath(resultsName) + ' is like ' + expectedPath(expectedName));
  }

  // Return a file URL we can use to access a fixture
  function fixtureFileUri(fixtureName) {
    return 'file:///' + Path.join(fixturesDir, fixtureName).replace(/\\/g, '/');
  }

  describe('when input starts with file://', function() {
    it('should treat input as file path', function(done) {
      Wkhtmltopdf(fixtureFileUri('validFile.html'), function(err) {
        expect(err).toBeNull();
        checkResults('fileUrlSpec.pdf', 'validFile.pdf');
        done();
      }).pipe(Fs.createWriteStream(resultPath('fileUrlSpec.pdf')));
    });
  });

  describe('when input starts with http://', function() {
    var server;

    // Return the HTTP URL we can use to access a fixture with our dummy server
    function fixtureHttpUrl(fixtureName) {
      var port = server.address().port;
      return 'http://localhost:' + port + '/' + fixtureName;
    }

    // Create a dummy server that serves the fixtures directory
    beforeAll(function(done) {
      var app = Express();
      app.use(Express.static(fixturesDir));
      server = app.listen(0, 'localhost', done);
    });

    it('should treat input as url', function(done) {
      Wkhtmltopdf(fixtureHttpUrl('validFile.html'), function(err) {
        expect(err).toBeNull();
        checkResults('httpUrlSpec.pdf', 'validFile.pdf');
        done();
      }).pipe(Fs.createWriteStream(resultPath('httpUrlSpec.pdf')));
    });

    afterAll(function() {
      server.close();
    });
  });

  describe('when input is an html', function() {
    it('should use it as the source', function(done) {
      Wkhtmltopdf(Fs.readFileSync(fixturePath('validFile.html'), 'utf8'), function(err) {
        expect(err).toBeNull();
        checkResults('htmlSourceSpec.pdf', 'validFile.pdf');
        done();
      }).pipe(Fs.createWriteStream(resultPath('htmlSourceSpec.pdf')));
    });
  });

  describe('when input is a stream', function() {
    it('should use it as the source', function(done) {
      Wkhtmltopdf(Fs.createReadStream(fixturePath('validFile.html')), function(err) {
        expect(err).toBeNull();
        checkResults('streamSourceSpec.pdf', 'validFile.pdf');
        done();
      }).pipe(Fs.createWriteStream(resultPath('streamSourceSpec.pdf')));
    });
  });

});
