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

var $mongo = module.exports = {};

var mapRequestTag = {};
var socketIo;

/**
 * Tells mongo subscriber to which socket object to use for subscription transactions.
 * @param  {Object} socket socket.io object
 */
$mongo.use = function(socket) {
  if (socketIo === undefined) {
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
$mongo.subscribe = function(ns, query, tag) {
  if (socketIo === undefined) {
    // use the known constant from socket io client js
    $mongo.use(io());
  }

  var request = { ns: ns, query: query, tag: tag };
  var subscription = new Subscription(request);
  mapRequestTag[tag] = subscription;
  return subscription;
};

var translator = function(socket) {
  if (socketIo != undefined) {
    return;
  }

  socketIo = socket;
  var events = ['mongo.insert', 'mongo.update', 'mongo.delete'];
  events.forEach(function(e) {
    socketIo.on(e, function(data) {
      var emitEvent = e.split('.')[1];
      mapRequestTag[data.tag].emit(emitEvent, data.result);
    });
  });
};

var Subscription = function(request) {
  EventEmitter.call(this);
  this.request = request;
  socketIo.emit('mongo.subscribe', request);
};

util.inherits(Subscription, EventEmitter);

Subscription.prototype.destroy = function() {
  socketIo.emit('mongo.unsubscribe', this.request);
  delete mapRequestTag[this.request.tag];
};
