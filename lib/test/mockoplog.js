/*
 * Copyright 2015 mtap technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var MockOplog = function() {
  this.destroyed = false;
};

util.inherits(MockOplog, EventEmitter);

MockOplog.prototype.filter = function(ns) {
  return new MockOplog();
};

MockOplog.prototype.push = function(subscriber, event, data) {
  var oplogFormat = { o: data };
  subscriber._filterOplog.emit(event, oplogFormat);
};

MockOplog.prototype.selfPush = function(event, data) {
  var oplogformat = { o: data };
  this.emit(event, oplogformat);
};

MockOplog.prototype.isDestroyed = function(subscriber) {
  return subscriber._filterOplog.destroyed;
};

MockOplog.prototype.destroy = function(cb) {
  this.destroyed = true;
  if (cb !== undefined)
    cb();
};

module.exports = MockOplog;
