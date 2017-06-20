'use strict';

const request = require('request');
const url = require('url');

/**
 * The main robotto object.
 * @namespace robotto
*/
let robotto = {};

/**
 * Gets the robots.txt address for any given URL.
 *
 * @param {String} url - Any URL.
 * @returns {String} - The address for the robots.txt file.
 */
robotto.getRobotsUrl = function(urlP) {
    let receivedUrl = url.parse(urlP);
    return `${receivedUrl.protocol}\/\/${receivedUrl.host}/robots.txt`;
};

/**
 * This is the callback which will be executed after fetching the contents of a robots.txt file through robotto.fetch(<url>).
 *
 * @callback robotto~fetchCallback
 * @param {Object} err - If there were any errors they will be here. Otherwise this will be `null`.
 * @param {String} contents - The contents of the robots.txt file.
 */

/**
 * Fetches the contents of the robots.txt file for a given URL.
 *
 * @param {String} url - The robots.txt file URL.
 * @param {fetchCallback} cb - The callback to handle possible errors and the contents of the robots.txt file.
 */
robotto.fetch = function(urlP, callback) {
    callback = typeof callback === 'function' ? callback : new Function();

    const requestOptions = {
        url: this.getRobotsUrl(urlP),
        maxRedirects: 5
    };


    request.get(requestOptions, (err, res, body) => {
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

/**
 * A representation of the robots.txt file.
 * @typedef {Object} robotsRules~robotto
 * @property {agentRules} userAgents - An object with rules mapped by ther user-agent names.
 * @property {String[]} comments - An array containing every comment inside the robots.txt file.
 */

/**
 * A set of rules for a given user agent.
 * @typedef {Object} agentRules~robotsRules
 * @property {String[]} allow - An array with every URL specified into an "allow" rule.
 * @property {String[]} disallow - An array with every URL specified into a "disallow" rule.
 */

/**
 * Creates an object representation of the robots.txt rules.
 *
 * @param {String} robotsFile - The contents of any robots.txt file (plaintext).
 * @returns {robotsRules} rulesObj - An object representation of the robots.txt rules.
 */
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
            if (rulesObj.userAgents[lastUserAgent] === undefined) {
                rulesObj.userAgents[lastUserAgent] = {
                    allow: [],
                    disallow: []
                };
            }
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

/**
 * Indicates deepness level for a rule. A rule is composed by a name ('allow' or 'disallow'), an user-agent and an URL.
 * The greater the deepness level is, the most specific is the rule.
 * This is important because when we have conflicting 'allow' and 'disallow' rules the most specific one is the one to be taken into account.
 * This permission level is calculated using the formula: allow deepness - disallow deepness.
 *
 * @param {String} ruleName - The rule's name. It can be 'allow' or 'disallow'.
 * @param {String} userAgent - The user-agent's name.
 * @param {String} url - The desired URL to check deepness.
 * @param {robotsRules} rulesObj - An object representation of the robots.txt file rules. It can be created through robotto.parse(<url>).
 * @returns {Number} ruleDeepness - The deepness level for a rule.
 */
robotto.getRuleDeepness = function(ruleName, userAgent, urlParam, rulesObj) {
    // Returns -1 if ruleName is invalid
    ruleName = ruleName.toLowerCase();
    if (ruleName !== 'allow' && ruleName !== 'disallow') {
        return -1;
    }

    // .filter(Boolean) removes empty strings
    let desiredSubPaths = `${url.parse(urlParam).pathname}/`.split('/').filter(Boolean);
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

    return generalPermission > permission ? generalPermission : permission;
};

/**
 * Indicates if an user-agent is allowed to access a given URL.
 *
 * @param {String} userAgent - An user-agent name.
 * @param {String} url - The URL you want to check permissions for.
 * @param {robotsRules} rulesObj - An object representation of the robots.txt file rules. It can be created through robotto.parse(<url>).
 * @returns {Boolean} allowed - A boolean indicating if the user-agent is allowed to access an URL.
 */
robotto.check = function(userAgent, urlParam, rulesObj) {
    let allowLevel = this.getRuleDeepness('allow', userAgent, urlParam, rulesObj);
    let disallowLevel = this.getRuleDeepness('disallow', userAgent, urlParam, rulesObj);

    // Positive if allow rule is more specific
    // Negative if disallow rule is more specific
    let finalPermissionLevel = allowLevel - disallowLevel;

    return finalPermissionLevel >= 0;
};

/**
 * This is the callback which will be executed after verifying crawling permissions for an URL.
 *
 * @callback robotto~permissionCallback
 * @param {Object} err - If there were any errors they will be here. Otherwise this will be `null`.
 * @param {Boolean} contents - A boolean indicating if the user-agent is allowed to access an URL.
 */

/**
 * Indicates if an user-agent can crawl an URL. It fetches rules, parses them and them calculates the permission level
 * This method aggregates the functionality of every other method above.
 *
 * @param {String} userAgent - An user-agent name.
 * @param {String} url - The URL you want to check permissions for.
 * @param {fetchCallback} cb - The callback to handle possible errors and the permission (or not) to crawl an URL.
 */
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
