// jscs:disable maximumLineLength
'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const robotto = require('../src/robotto');
const fake = require('./fake');

let sandbox = sinon.sandbox.create();
let coolUrl = 'http://my-cool-domain.com/blog-post/1';
let coolRobot = 'http://my-cool-domain.com/robots.txt';

describe('robotto', () => {
    afterEach(() => {
        sandbox.restore();
    });

    describe('_getRobotsUrl', () => {
        it('returns robots.txt url for given host', () => {
            let robotsUrl = robotto._getRobotsUrl(coolUrl);
            assert.deepEqual(robotsUrl, coolRobot);
        });
    });

    describe('fetch', () => {
        beforeEach(() => {
            sandbox.spy(robotto, '_getRobotsUrl');
            sandbox.stub(robotto, '_request')
                .callsArgWith(1, null, fake.response(), fake.robots());
        });

        it('should not break if no callback is passed', () => {
            assert.doesNotThrow(() => {
                robotto.fetch(coolUrl);
            }, 'callback is not a function');
        });

        it('should call _getRobotsUrl', (done) => {
            robotto.fetch(coolUrl, () => {
                sinon.assert.calledWith(robotto._getRobotsUrl, coolUrl);
                done();
            });
        });

        it('should call _request', (done) => {
            robotto.fetch(coolUrl, () => {
                sinon.assert.calledWith(robotto._request, coolRobot);
                done();
            });
        });

        it('should callback with an error if request fails', (done) => {
            robotto._request.restore();
            sandbox.stub(robotto, '_request')
                .callsArgWith(1, new Error('fake request error'));

            robotto.fetch(coolUrl, (err) => {
                assert.deepEqual(err.message, 'fake request error');
                done();
            });
        });

        it('should callback with an error if status code is not 200', (done) => {
            robotto._request.restore();
            sandbox.stub(robotto, '_request')
                .callsArgWith(1, null, {statusCode: 404});

            robotto.fetch(coolUrl, (err) => {
                assert.deepEqual(err.message, `Could not fetch robots.txt from ${coolUrl}, the server returned 404 code`);
                done();
            });
        });

        it('should callback with robots.txt content', (done) => {
            robotto.fetch(coolUrl, (err, robots) => {
                assert.notOk(err);
                assert.deepEqual(robots, fake.robots());
                done();
            });
        });
    });

    describe('parse', () => {
        it('should return a rule object indexed by user agent', () => {
            let rules = robotto.parse(fake.robots());
            assert.deepEqual(rules, fake.rules());
        });
    });
});
