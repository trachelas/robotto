'use strict';

const request = require('request');
const url = require('url');

let robotto = {};

robotto._getRobotsUrl = function(urlP) {
    let receivedUrl = url.parse(urlP);
    return `${receivedUrl.protocol}\/\/${receivedUrl.host}/robots.txt`;
};

robotto._request = request;

robotto.fetch = function(urlP, callback) {
    callback = typeof callback === 'function' ? callback : new Function();

    let robotsUrl = robotto._getRobotsUrl(urlP);

    robotto._request(robotsUrl, (err, res, body) => {
        if (err) {
            callback(err);
            return;
        }

        if (res.statusCode !== 200) {
            callback(new Error(`Could not fetch robots.txt from ${urlP}, the server returned ${res.statusCode} code`));
            return;
        }

        callback(null, body);
    });
};

robotto.parse = function(robotsFile) {
    let lines = robotsFile.split('\n');
    let rulesObj = {
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
            let j = 1;
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

module.exports = robotto;
