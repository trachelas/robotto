'use strict';

const path = require('path');
const gulp = require('gulp');
const excludeGitignore = require('gulp-exclude-gitignore');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const nsp = require('gulp-nsp');
const plumber = require('gulp-plumber');
const coveralls = require('gulp-coveralls');
const jscs = require('gulp-jscs');
const babel = require('gulp-babel');

gulp.task('nsp', function(cb) {
    nsp('package.json', cb);
});

gulp.task('pre-test', function() {
    return gulp.src('src\**\*.js')
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
