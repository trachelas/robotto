'use strict';
const request = require('request');

function Robotto(cacheEnabled) {
    this.cacheEnabled = cacheEnabled || false;
    this.cache = {};
}

Robotto.prototype.fetch = function(url, callback) {
    url = this.getRobotsUrl(url);
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let robotsRules = this.parseRobots(body);

            // If this robotto has cache enabled it will store the fetched rule
            if (this.cacheEnabled) {
                Object.defineProperty(this.cache, this.getDomain(url), {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: robotsRules
                });
            }

            callback(robotsRules);
        }
    });
};

Robotto.prototype.getRobotsUrl = function(url) {
    var splitResult = url.split('/');
    url = splitResult[0] +  '//' + splitResult[2];
    url += '/robots.txt';

    return url;
};

Robotto.prototype.getDomain = function(url) {
    return url.split('/')[2];
};

Robotto.prototype.parseRobots = function(robotsFile) {
    var lines = robotsFile.split('\n');
    var rulesObj = {
        comments: []
    };

    for (let i = 0; i < lines.length; i++) {
        let result;

        if ((result = /^#(.*)/i.exec(lines[i])) !== null) {
            rulesObj.comments.push(result[1]);
        }

        // If it finds an User-agent creates a new key into the rules object
        if ((result = /^User-agent: (.*)/i.exec(lines[i])) !== null) {
            Object.defineProperty(rulesObj, result[1], {
                configurable: true,
                writable: true,
                enumerable: true,
                value: {
                    allow: [],
                    disallow: [],
                }
            });

            // Look for Allowed Routes until it finds another user agent definition
            var j = 1;
            let permissionResult;
            while ((permissionResult = /^User-agent: (.*)/i.exec(lines[i + j])) === null && j < lines.length) {
                if ((permissionResult = /^Allow: (.*)/i.exec(lines[i + j])) !== null) {
                    rulesObj[result[1]].allow.push(permissionResult[1]);
                }

                if ((permissionResult = /^Disallow: (.*)/i.exec(lines[i + j])) !== null) {
                    rulesObj[result[1]].disallow.push(permissionResult[1]);
                }
                j++;
            }
        }
    }

    return rulesObj;
};

module.exports = Robotto;
