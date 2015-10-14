'use strict';

const request = require('request');
const url = require('url');

let robotto = {};

robotto.getRobotsUrl = function(urlP) {
    let receivedUrl = url.parse(urlP);
    return `${receivedUrl.protocol}\/\/${receivedUrl.host}/robots.txt`;
};

robotto.fetch = function(urlP, callback) {
    callback = typeof callback === 'function' ? callback : new Function();

    let robotsUrl = this.getRobotsUrl(urlP);

    request.get(robotsUrl, (err, res, body) => {
        if (err) {
            callback(err);
            return;
        }

        if (res.statusCode !== 200) {
            callback(new Error(`Could not fetch robots.txt from ${urlP}. Server response code: ${res.statusCode}`));
            return;
        }

        callback(null, body);
    });
};

robotto.parse = function(robotsFile) {
    let lines = robotsFile.split('\n');
    let rulesObj = {
        userAgents: {},
        comments: []
    };
    let lastUserAgent;

    lines.forEach((line) => {
        let hashIndex = line.indexOf('#');

        if (hashIndex > -1) {
            if (hashIndex === 0) {
                // entire line commentary
                rulesObj.comments.push(line.substr(hashIndex + 1).trim());
                return;
            }

            // portion line comment
            let portions = line.split('#');

            rulesObj.comments.push(portions[1].trim()); // push comment
            line = portions[0].trim(); // exclude comment from line
        }

        let userAgentIndex = line.toLowerCase().indexOf('user-agent:');
        if (userAgentIndex === 0) {
            lastUserAgent = line.split(':')[1].trim();
            rulesObj.userAgents[lastUserAgent] = {
                allow: [],
                disallow: []
            };
            return;
        }

        let allowIndex = line.toLowerCase().indexOf('allow:');
        if (allowIndex === 0) {
            rulesObj.userAgents[lastUserAgent].allow.push(line.split(':')[1].trim());
            return;
        }

        let disallowIndex = line.toLowerCase().indexOf('disallow:');
        if (disallowIndex === 0) {
            rulesObj.userAgents[lastUserAgent].disallow.push(line.split(':')[1].trim());
            return;
        }
    });

    return rulesObj;
};

robotto.getRuleDeepness = function(ruleName, userAgent, urlParam, rulesObj) {
    // Returns -1 if ruleName is invalid
    ruleName = ruleName.toLowerCase();
    if (ruleName !== 'allow' && ruleName !== 'disallow') {
        return -1;
    }

    // .filter(Boolean) removes empty strings
    let desiredSubPaths = (url.parse(urlParam).pathname + '/').split('/').filter(Boolean);
    let rules = rulesObj.userAgents;
    let permission = 0;

    if (rules.hasOwnProperty(userAgent)) {
        let userAgentRules = rulesObj.userAgents[userAgent][ruleName];

        // Scans every rule for this user-agent
        userAgentRules.forEach((rule) => {
            let ruleSubPaths = rule.split('/').filter(Boolean);
            let i = 0;

            // If the rule equals to '/' it has the minimum permission value possible
            if (ruleSubPaths.length === 0) {
                permission = Number.MIN_VALUE;
            }

            // For each path match adds 1 to i
            ruleSubPaths.some((subPath) => {
                if (subPath === desiredSubPaths[i]) {
                    i++;
                } else if (desiredSubPaths[i] === undefined) {
                    return true;
                } else {
                    // If full path does not match it has no permissions
                    i = 0;
                    return true;
                }
            });

            // If it's the deepest match until now replaces permission
            if (i > permission) {
                permission = i;
            }
        });
    }

    // Calls itself looking for general rules after fetching specific rules
    let generalPermission = 0;
    if (userAgent !== '*') {
        generalPermission = this.getRuleDeepness(ruleName, '*', urlParam, rulesObj);
    }

    return (generalPermission > permission) ? generalPermission : permission;
};

robotto.check = function(userAgent, urlParam, rulesObj) {
    let allowLevel = this.getRuleDeepness('allow', userAgent, urlParam, rulesObj);
    let disallowLevel = this.getRuleDeepness('disallow', userAgent, urlParam, rulesObj);

    // Positive if allow rule is more specific
    // Negative if disallow rule is more specific
    let finalPermissionLevel = allowLevel - disallowLevel;

    return finalPermissionLevel >= 0;
};

robotto.canCrawl = function(userAgent, urlParam, callback) {
    callback = typeof callback === 'function' ? callback : new Function();

    this.fetch(urlParam, (err, robotsTxt) => {
        if (err) {
            callback(err);
            return;
        }

        let rules = this.parse(robotsTxt);
        let canCrawl = this.check(userAgent, urlParam, rules);
        callback(null, canCrawl);
    });
};

module.exports = robotto;
