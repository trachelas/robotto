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

gulp.task('nsp', (cb) => {
    nsp('package.json', cb);
});

gulp.task('pre-test', () => {
    return gulp.src('src\**\*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], (cb) => {
    let mochaErr;

    gulp.src('test/**/*.js')
        .pipe(babel())
        .pipe(plumber())
        .pipe(mocha({reporter: 'spec'}))
        .on('error', (err) => {
            mochaErr = err;
        })
        .pipe(istanbul.writeReports())
        .on('end', () => {
            cb(mochaErr);
        });
});

gulp.task('coveralls', ['test'], () => {
    if (!process.env.CI) {
        return;
    }

    return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(coveralls());
});

gulp.task('babel', () => {
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('jscs', () => {
    return gulp.src('**/*.js')
        .pipe(excludeGitignore())
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task('watch', () => {
    gulp.watch('**/*.js', ['prepublish']);
});

gulp.task('prepublish', ['jscs', 'test', 'nsp', 'babel']);
