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

module.exports = robotto;
