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
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var EVENTS = ['insert', 'update', 'delete'];
var QueryFilter = require('./queryfilter');

var createQueryFilter = function(query) {
  return new QueryFilter(query);
};

var MongoPublisher = function(oplog, queryFilterCreator) {
  this._mapWriterSubs = {};
  this._oplog = oplog;
  this._createQueryFilter = queryFilterCreator || createQueryFilter;
};

MongoPublisher.prototype.subscribe = function(ns, findQuery) {
  var subscription = new Subscription(this._oplog.filter(ns), this._createQueryFilter(findQuery));
  return subscription;
};

/**
 * Subscription that holds the info about the {MongoPublisher#subscribe} could be stored for
 * later unsubscription
 *
 * @param  {mongo-oplog.Filter} filterOplog [description]
 * @param  {Object} options {ns: 'namespace', events: ['u', 'i']}
 * @param  {EventEmitter} writer that holds socket or whateever to push events from filter
 * @return {Subscription} Subscription object that can be stored for unsubscription.
 */
var Subscription = function(filterOplog, queryFilter) {
  EventEmitter.call(this);
  var self = this;
  this._filterOplog = filterOplog;

  EVENTS.forEach(function(e) {
    filterOplog.on(e, function(doc) {
      doc = doc.o;
      if (queryFilter.matches(doc)) {
        self.emit(e, doc);
      }
    });
  });
};

util.inherits(Subscription, EventEmitter);

/**
 * Destroys the subscription
 *
 * @param  {Function} callback optional
 */
Subscription.prototype.destroy = function(callback) {
  this._filterOplog.destroy(callback);
};

module.exports = MongoPublisher;
