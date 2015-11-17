var Path = require('path'),
  Fs = require('fs'),
  Express = require('express'),
  Rimraf = require('rimraf'),
  Mkdirp = require('mkdirp'),
  Wkhtmltopdf = require('..');


describe('wkhtmltopdf', function() {

  var server;

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

  afterAll(function() {
    server.close();
  });

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
    it('should treat input as url', function(done) {
      Wkhtmltopdf(fixtureHttpUrl('validFile.html'), function(err) {
        expect(err).toBeNull();
        checkResults('httpUrlSpec.pdf', 'validFile.pdf');
        done();
      }).pipe(Fs.createWriteStream(resultPath('httpUrlSpec.pdf')));
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

  describe('non fatal errors', function() {
    describe('when there is a libpng warning', function() {
      it('should call callback with null', function(done) {
        Wkhtmltopdf(fixtureFileUri('pngWarning.html'), function(err) {
          expect(err).toBeNull();
          checkResults('pngWarning.pdf', 'pngWarning.pdf');
          done();
        }).pipe(Fs.createWriteStream(resultPath('pngWarning.pdf')));
      });
    });

    describe('when there is a libpng error', function() {
      it('should call callback with null', function(done) {
        Wkhtmltopdf(fixtureFileUri('pngError.html'), function(err) {
          expect(err).toBeNull();
          checkResults('pngError.pdf', 'pngError.pdf');
          done();
        }).pipe(Fs.createWriteStream(resultPath('pngError.pdf')));
      });
    });
  });

  describe('fatal errors', function() {
    describe('when source file cannot be found', function() {
      it('should call callback with an error', function(done) {
        Wkhtmltopdf(fixtureHttpUrl('unavailableFile'), function(err) {
          expect(err).toEqual(jasmine.any(Error));
          expect(err.message).toMatch(/ContentNotFoundError/);
          done();
        });
      });

      it('should emit an error on the stream', function(done) {
        var stream = Wkhtmltopdf(fixtureHttpUrl('unavailableFile'));
        stream.on('error', function(err) {
          expect(err).toEqual(jasmine.any(Error));
          done();
        });
      });
    });
  });

});
