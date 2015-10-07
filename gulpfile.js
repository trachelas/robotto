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
const bump = require('gulp-bump');
const shell = require('gulp-shell');
const runSequence = require('run-sequence');
const fs = require('fs');

gulp.task('nsp', (cb) => {
    nsp('package.json', cb);
});

gulp.task('pre-test', () => {
    return gulp.src('src/**/*.js')
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
    gulp.watch('**/*.js', ['build']);
});

gulp.task('bump', () => {
    let type = process.argv[process.argv.length - 1].slice(2);

    return gulp.src('./package.json')
        .pipe(bump({type: type}))
        .pipe(gulp.dest('./'));
});

gulp.task('tag', (cb) => {
    fs.readFile('./package.json', (err, file) => {
        if (err) {
            throw err;
        }

        let version = JSON.parse(file).version;
        let command = `git add package.json && git commit --allow-empty -m "Release v${version}" &&
            git tag v${version} && git push origin master --tags`;

        gulp.src('')
            .pipe(shell([command]))
            .on('end', cb);
    });
});

gulp.task('npm', shell.task(['npm publish']));

gulp.task('publish', (cb) => {
    runSequence('build', 'bump', 'tag', 'npm', cb);
});

gulp.task('build', ['jscs', 'test', 'nsp', 'babel']);

