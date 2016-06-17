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
var Promise = require('promise');

var getLastTimestamp = function(coll) {
  return new Promise(function(resolve, reject) {
    coll.find({}, { ts: 1 })
      .sort({ $natural: -1 })
      .limit(1)
      .nextObject(function(err, doc) {
        if (doc) {
          resolve(doc.ts);
        } else {
          reject(new Error('No doc found while looking for last timestamp'));
        }
      });
  });
};

var getOplogCursor = function(mongoContext, options) {
  var query = {};
  var ns = options.ns;
  var dbname = options.db || 'local';
  var coll = mongoContext.getDb(dbname).collection(options.coll);
  if (ns) {
    query.ns = ns;
  }
  return new Promise(function(resolve, reject) {
    getLastTimestamp(coll).then(function(ts) {
      query.ts = { $gt: ts };
      var oplogCursor = coll.find(query);
      oplogCursor.addCursorFlag('tailable', true);
      oplogCursor.addCursorFlag('awaitData', true);
      oplogCursor.addCursorFlag('oplogReplay', true);
      oplogCursor.addCursorFlag('noCursorTimeout', true);
      oplogCursor.setCursorOption('numberOfRetries', Number.MAX_VALUE);
      resolve(oplogCursor);
    }).catch(reject);
  });
};

var forwardEvents = function(cursor, emitter) {
  var stream = emitter.stream = cursor.stream();
  stream.on('data', function(doc) {
    emitter.emit('op', doc);
    emitter.emit(emitter.events[doc.op], doc);
  });

  stream.on('end', function() {
    emitter.emit('end');
  });

  stream.on('error', function(err) {
    if (!err || !err.stack) {
      err = new Error('Unknown error: ' + err);
    } else {
      emitter.emit('error', err);
    }
  });
};

var OplogReader = function(mongoContext, options) {
  EventEmitter.call(this);
  this.mongoContext = mongoContext;
  this.events = {
    i: 'insert',
    u: 'update',
    d: 'delete'
  };
  this.options = options || {};
};

util.inherits(OplogReader, EventEmitter);

OplogReader.create = function(mongoContext, options) {
  return new OplogReader(mongoContext, options);
};

OplogReader.prototype.stop = function() {
  if (!!this.stream) {
    this.stream.destroy();
  }
  return this;
};

OplogReader.prototype.start = function() {
  var self = this;
  getOplogCursor(this.mongoContext, this.options).then(function(cursor) {
    forwardEvents(cursor, self);
  }).catch(function(err) {
    self.emit('error', err);
  });
};

OplogReader.prototype.tail = function() {
  this.mongoContext.onready(this.start.bind(this));
  return this;
};

module.exports = OplogReader;
