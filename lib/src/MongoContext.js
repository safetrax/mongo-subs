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

var MongoClient = require('mongodb').MongoClient;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var MongoContext = function(mongouri) {
  this.init(mongouri);
};

util.inherits(MongoContext, EventEmitter);

MongoContext.prototype.init = function(mongouri) {
  var self = this;
  MongoClient.connect(mongouri).then(function(db) {
    self.db = db;
    self.ready = true;
    self.emit('ready', db);
  }).catch(function(err) {
    self.emit('error', err);
  });
};

MongoContext.prototype.onready = function(cb) {
  if (this.ready) {
    cb(this.db);
  } else {
    this.once('ready', cb);
  }
};

MongoContext.prototype.getDb = function(dbName) {
  return this.db.db(dbName);
};

MongoContext.connect = function(mongouri) {
  return new MongoContext(mongouri);
};

module.exports = MongoContext;
