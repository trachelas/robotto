'use strict';
var request = require('request');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Robotto() {
}
util.inherits(Robotto, EventEmitter);

Robotto.prototype.fetch = function(url, callback) {
  var self = this;
  request(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var robotsObject = self.parseRobots(body);
      self.emit('done', robotsObject);
    }
  });
};

Robotto.prototype.parseRobots = function(robotsFile) {
  // TODO parse robots txt and return an object with rules
  // Nice example to test: https://www.npmjs.com/robots.txt
  // Rules about robots.txt: http://www.robotstxt.org/robotstxt.html
};
