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
  var lines = robotsFile.split('\n');
  var rulesObj = {};

  for (let i = 0; i < lines.length; i++) {
    let result;

    // If it finds an User-agent creates a new key into the rules object
    if ((result = /^User-agent: (.*)/i.exec(lines[i])) !== null) {
      Object.defineProperty(rulesObj, result[1], {
        configurable: true,
        writable: true,
        enumerable: true,
        value: {
          allow: [],
          disallow: [],
          comments: []
        }
      });

      // Look for Allowed Routes until it finds another user agent definition
      var j = 1;
      let permissionResult
      while ((permissionResult = /^User-agent: (.*)/i.exec(lines[i+j])) === null && j < lines.length) {
        if ((permissionResult = /^Allow: (.*)/i.exec(lines[i+j])) !== null) {
          rulesObj[result[1]].allow.push(permissionResult[1]);
        } if ((permissionResult = /^Disallow: (.*)/i.exec(lines[i+j])) !== null) {
          rulesObj[result[1]].disallow.push(permissionResult[1]);
        } if ((permissionResult = /^#(.*)/.exec(lines[i+j])) !== null) {
          rulesObj[result[1]].comments.push(permissionResult[1]);
        }
        j++;
      }
    }
  }

  return rulesObj;
};

module.exports = Robotto;
