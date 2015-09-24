'use strict';

const request = require('request');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

function Robotto() {
}
util.inherits(Robotto, EventEmitter);

Robotto.prototype.fetch = function(url, callback) {
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            var robotsObject = this.parseRobots(body);
            this.emit('done', robotsObject);
        }
    });
};

Robotto.prototype.parseRobots = function(robotsFile) {
    // TODO parse robots txt and return an object with rules
    // Nice example to test: https://www.npmjs.com/robots.txt
    // Rules about robots.txt: http://www.robotstxt.org/robotstxt.html
};
