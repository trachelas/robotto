'use strict';
const request = require('request');
const url = require('url');

function Robotto(options) {
    this.cacheEnabled = options.cacheEnabled || false;
    this.cache = {};
}

Robotto.prototype.fetch = function(urlParam, callback) {
    if (this.cacheEnabled) {
        let cache = this.cache[url.parse(urlParam).host];

        if (cache) {
            callback(null, cache);
            return;
        }
    }

    urlParam = this.getRobotsUrl(url);
    request(urlParam.href, (error, response, body) => {
        if (error) {
            callback(error);
            return;
        }

        if (response.statusCode === 200) {
            let robotsRules = this.parseRobots(body);

            // If this robotto has cache enabled it will store the fetched rule
            if (this.cacheEnabled) {
                Object.defineProperty(this.cache, urlParam.host, {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: robotsRules
                });
            }

            callback(null, robotsRules);
        }
    });
};

Robotto.prototype.getRobotsUrl = function(urlParam) {
    let receivedUrl =  url.parse(urlParam);
    return url.parse(`${receivedUrl.protocol}\/\/${receivedUrl.host}/robots.txt`);
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
