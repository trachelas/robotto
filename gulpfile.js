'use strict';

var path = require('path');
var gulp = require('gulp');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var jscs = require('gulp-jscs');
var babel = require('gulp-babel');

gulp.task('nsp', function(cb) {
    nsp('package.json', cb);
});

gulp.task('pre-test', function() {
    return gulp.src('lib\**\*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function(cb) {
    var mochaErr;

    gulp.src('test/**/*.js')
        .pipe(plumber())
        .pipe(mocha({reporter: 'spec'}))
        .on('error', function(err) {
            mochaErr = err;
        })
        .pipe(istanbul.writeReports())
        .on('end', function() {
            cb(mochaErr);
        });
});

gulp.task('coveralls', ['test'], function() {
    if (!process.env.CI) {
        return;
    }

    return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(coveralls());
});

gulp.task('babel', function() {
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('jscs', function() {
    return gulp.src('**/*.js')
        .pipe(excludeGitignore())
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task('prepublish', ['jscs', 'test', 'nsp', 'babel']);
