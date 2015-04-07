'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var vulcanize = require('./');

function copyTestFile(src, dest) {
	fs.writeFileSync(dest, fs.readFileSync(src, 'utf8'));
}

describe('should vulcanize web components:', function (argument) {
	var targets = ['', '/abc', '/xyz', '/xyz/abs'];

	before(function () {
		rimraf.sync('tmp');
		mkdirp.sync('tmp');

		targets.forEach(function (el) {
			var dest = path.join('tmp', 'src', el);
			mkdirp.sync(dest);
			copyTestFile('fixture/index.html', path.join(dest, 'index.html'));
			copyTestFile('fixture/import.html', path.join(dest, 'import.html'));
		});
	});

	it('single', function (cb) {
		var stream = vulcanize({
			dest: 'tmp/build',
			csp: true
		});

		stream.on('data', function (file) {
			assert.equal(path.dirname(path.join(file.base, file.relative)), path.resolve(file.cwd, 'tmp/build'));
			if (/\.html$/.test(file.path)) {
				assert(/Imported/.test(file.contents.toString()));
				return;
			}

			assert(/Polymer/.test(file.contents.toString()));
		});

		stream.on('end', cb);

		var base = path.join(__dirname, 'tmp/src');
		var filename = path.join(base, 'index.html');
		stream.write(new gutil.File({
			cwd: __dirname,
			base: base,
			path: filename,
			contents: fs.readFileSync(filename)
		}));

		stream.end();
	});

	it('multiple', function (cb) {
		var stream = vulcanize({
			dest: 'tmp/build'
		});

		stream.on('data', function (file) {
			var t = path.dirname(file.path).replace(path.resolve(file.cwd, 'tmp/build'), '');
			assert.notStrictEqual(targets.indexOf(t), -1);
			assert(/Imported/.test(file.contents.toString()));
		});

		stream.on('end', cb);

		targets.forEach(function (el) {
			var base = path.join(__dirname, 'tmp', 'src');
			var filename = path.join(base, el, 'index.html');
			stream.write(new gutil.File({
				cwd: __dirname,
				base: base,
				path: filename,
				contents: fs.readFileSync(filename)
			}));
		});

		stream.end();
	});
});
