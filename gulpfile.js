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
const sequence = require('gulp-sequence');
const git = require('gulp-git');

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
        .pipe(istanbul.enforceThresholds({thresholds: {global: 100}}))
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
    if (process.argv.length < 3) {
        throw new Error(`Please provide an argument with increase type: --patch, --minor or --major`);
    }

    let type = process.argv[process.argv.length - 1].slice(2).toLowerCase();
    if (type !== 'patch' && type !== 'minor' && type !== 'major') {
        throw new Error(`Please provide a valid version increase type: --patch, --minor or --major`);
    }

    return gulp.src('./package.json')
        .pipe(bump({type: type}))
        .pipe(gulp.dest('./'));
});

gulp.task('tag', () => {
    let versionNumber = require('./package.json').version;
    let version = `v${versionNumber}`;

    if (typeof versionNumber !== 'string') {
        throw new Error(`Current package.json version is invalid.`);
    }

    return gulp.src('./package.json')
        .pipe(git.add())
        .pipe(git.commit(`Release ${version}`, {args: '--allow-empty'}))
        .pipe(git.tag(version, `Release ${version}`), (err) => {
            if (!err) git.push('origin', 'master', {args: '--tags'});
        });
});

gulp.task('npm', ['tag'], (cb) => {
    require('child_process')
        .spawn('npm', ['publish'], {stdio: 'inherit'})
        .on('close', cb);
});

// Publishes package to npm
gulp.task('publish', (cb) => {
    sequence(['build', 'bump'], 'tag', 'npm', cb);
});

// Does full a build
gulp.task('build', ['nsp', 'eslint', 'coveralls']);
