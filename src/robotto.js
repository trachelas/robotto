'use strict';
const request = require('request');

function Robotto() {
}

Robotto.prototype.fetch = function(url, callback) {
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let robotsRules = this.parseRobots(body);
            callback(robotsRules);
        }
    });
};

Robotto.prototype.parseRobots = function(robotsFile) {
    // TODO parse robots txt and return an object with rules
    // Nice example to test: https://www.npmjs.com/robots.txt
    // Rules about robots.txt: http://www.robotstxt.org/robotstxt.html
};

module.exports = Robotto;