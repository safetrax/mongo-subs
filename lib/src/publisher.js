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
var MongoPublisher = require('./mongosubs');
var MongoReader = require('./MongoReader');
var DetailedOplog = require('./DetailedOplog');

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Publisher = {};
var mongoReader = null;

Publisher.createWith = function(mongouri, metaInfo) {
  var MongoOplog = require('mongo-oplog');
  var oplog = MongoOplog(mongouri, metaInfo).tail();
  return new MongoPublisher(new DetailedOplog(oplog, new MongoReader(mongouri)));
};

Publisher.createUsing = function(oplog) {
  return new MongoPublisher(oplog);
};

var detailedOplog = function(oplog) {
  oplog.on('op', function(doc) {
    if ('update' === doc.op.toLowerCase()) {

    }
    console.log(doc);
  });

  oplog.detailFilter = function(oplog) {

  };
};

module.exports = Publisher;
