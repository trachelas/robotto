// jscs:disable maximumLineLength
'use strict';

const assert = require('chai').assert;
const robotto = require('../src/robotto');

let coolUrl = 'http://my-cool-domain.com/blog-post/1';
let coolRobot = 'http://my-cool-domain.com/robots.txt';

describe('robotto', () => {
    });

    describe('_getRobotsUrl', () => {
        it('returns robots.txt url for given host', () => {
            let robotsUrl = robotto._getRobotsUrl(coolUrl);
            assert.deepEqual(robotsUrl, coolRobot);
        });
    });
});
