'use strict';

const path = require('path');
const gulp = require('gulp');
const excludeGitignore = require('gulp-exclude-gitignore');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const nsp = require('gulp-nsp');
const plumber = require('gulp-plumber');
const coveralls = require('gulp-coveralls');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const bump = require('gulp-bump');
const shell = require('gulp-shell');
const sequence = require('gulp-sequence');

gulp.task('nsp', (cb) => {
    return nsp({package: `${__dirname}/package.json`}, cb);
});

gulp.task('eslint', () => {
    return gulp.src(['**/*.js', '!lib/**/*.js'])
        .pipe(excludeGitignore())
        .pipe(eslint())
        .pipe(eslint.formatEach())
        .pipe(eslint.failAfterError());
});

gulp.task('babel', () => {
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('pre-test', ['babel'], () => {
    return gulp.src('lib/**/*.js')
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

gulp.task('watch', () => {
    gulp.watch('**/*.js', ['build']);
});

gulp.task('bump', () => {
    let type = process.argv[process.argv.length - 1].slice(2);

    if (typeof type !== 'string') {
        throw new Error(`Please provide version increase type: patch, minor or major`);
    }

    return gulp.src('./package.json')
        .pipe(bump({type: type}))
        .pipe(gulp.dest('./'));
});

gulp.task('tag', (cb) => {
    let version = require('./package.json').version;

    if (version !== Object(version)) {
        throw new Error(`Current package.json version is invalid.`);
    }

    let command = `git add package.json && git commit --allow-empty -m "Release v${version}" &&
        git tag v${version} && git push origin master --tags`;

    gulp.src('')
        .pipe(shell([command]))
        .on('end', cb);
});

gulp.task('npm', shell.task(['npm publish']));

gulp.task('publish', (cb) => {
    runSequence('build', 'bump', 'tag', 'npm', cb);
});

// Does full a build
gulp.task('build', ['nsp', 'eslint', 'coveralls']);
