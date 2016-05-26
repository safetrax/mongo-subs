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
var io = require('socket.io-client');
var QueryFilter = require('./queryfilter');

var MongoSubs = module.exports = {};

var mapRequestTag = {};
var socketIo;

/**
* Tells mongo subscriber to which socket object to use for subscription transactions.
* @param  {Object} socket socket.io object
*/
MongoSubs.use = function(socket) {
  if (!socket.mongoSubsRegistered) {
   translator(socket);
  }
};

/**
* Makes a subscription request over the registered io
* Incase if default io not defined will use the known constant io() from socket.io client
*
* <b>Note:</b> use unique value to tag each subscription request.
* Two different subscription request using the same tag will result in overlaps
*
* @param  {string} ns collection name (eg: '*.employee')
* @param  {JSON} query plain mongo query as json
* @param  {string} tag will be used as subscription id
* @return {Object} Subscription object that can be used to unsubscribe later
*/
MongoSubs.subscribe = function(ns, query, tag) {
  if (socketIo === undefined) {
  // use the known constant from socket io client js
    MongoSubs.use(io());
  }

  var request = { ns: ns, query: query, tag: tag };
  return sendSubscriptionRequest(request);
};

var saveSubscription = function(tag, subscription) {
  mapRequestTag[tag] = subscription;
};

var sendSubscriptionRequest = function(request) {
  socketIo.emit('mongo.subscribe', request);
  var subscription = new Subscription(request);
  saveSubscription(request.tag, subscription);
  return subscription;
};

var destroySubscription = function(request) {
  socketIo.emit('mongo.unsubscribe', request);
  delete mapRequestTag[this.request.tag];
};

var getRegisteredSubscriber = function(tag) {
  return mapRequestTag[tag];
};

var translator = function(socket) {
  socketIo = socket;
  var events = ['mongo.insert', 'mongo.update', 'mongo.delete'];
  events.forEach(function(e) {
   socketIo.on(e, function(data) {
     var emitEvent = e.split('.')[1];
     forwardMessage(emitEvent, data);
   });
  });
  socketIo.mongoSubsRegistered = true;
};

var forwardMessage = function(emitEvent, message) {
  var registeredSubscriber = getRegisteredSubscriber(message.tag);
  registeredSubscriber.__forwardIfValid__(emitEvent, message);
};

var Subscription = function(request) {
  EventEmitter.call(this);
  this.request = request;
  this.queryFilter = QueryFilter.NONE;
  this.observeIds = request.observeIds || {};
};

util.inherits(Subscription, EventEmitter);

Subscription.prototype.filter = function(query) {
  this.queryFilter = new QueryFilter(query);
};

Subscription.prototype.__forwardIfValid__ = function(e, message) {
  var docId = message.result._id;
  if (this.queryFilter.matches(message.result)) {
    this.emit(e, message.result);
    this.observe(docId);
  } else if (docId in this.observeIds) {
    this.emit('filterfail', message.result);
    this.stopObserve(docId);
  }
};

Subscription.prototype.observeAll = function(objectIds) {
  var self = this;
  objectIds.forEach(function(objectId) {
    self.observe(objectId);
  });
  return self;
};

Subscription.prototype.observe = function(objectId) {
  this.observeIds[objectId] = null;
  return this;
};

Subscription.prototype.stopObserve = function(objectId) {
  delete this.observeIds[objectId];
  return this;
};

Subscription.prototype.destroy = function() {
  destroySubscription(this.request);
};
