// jscs:disable maximumLineLength
'use strict';

const assert = require('assert');
const Robotto = require('../src/robotto');

let robotto;

describe('robotto', () => {
    beforeEach(() => {
        robotto = new Robotto();
    });

    describe('getRobotsUrl', () => {
        it('should return the robots.txt path for a url', () => {
            let url = robotto.getRobotsUrl('http://my-cool-url.com/blog-post/1');
            assert.deepEqual('http://my-cool-url.com/robots.txt', url.href);
        });
    });
});
