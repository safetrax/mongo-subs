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

var MongoSubsRpc = {};
var publisher;

MongoSubsRpc.serveOverSocket = function(io, mongoPublisher) {
  io.on('connection', onSocketConnected);
  publisher = mongoPublisher;
};

module.exports = MongoSubsRpc;

var onSocketConnected = function(socket) {
  socket.on('mongo.subscribe', function(data) {
    var subs = publisher.subscribe(data.ns, data.query);
    saveAndForward(socket, subs, data.tag);
  });

  socket.on('mongo.unsubscribe', function(data, callback) {
    destroySubs(socket, data.tag, callback);
  });

  socket.on('disconnect', function() {
    destroyAllSubs(socket);
  });
};

/** parcels the result and emits them over the socket */
var parceler = function(socket, subs, tag) {
  var events = ['insert', 'update', 'delete'];
  events.forEach(function(e) {
    subs.on(e, function(doc) {
      var data = { result: doc, tag: tag };
      socket.emit('mongo.' + e, data);
    });
  });
};

/** saves and forwards subscription results on the socket */
var saveAndForward = function(socket, subs, tag) {
  if (!socket.mapSubsRequest) {
    socket.mapSubsRequest = {};
  }
  socket.mapSubsRequest[tag] = subs;
  parceler(socket, subs, tag);
};

/** extracts the tagged subscription object from the socket */
var getSubsFromSocket = function(socket, tag) {
  if (!socket.mapSubsRequest) {
    return null;
  }
  return socket.mapSubsRequest[tag];
};

var destroySubs = function(socket, tag, callback) {
  var subs = getSubsFromSocket(socket, tag);
  if (!subs) {
    return;
  }
  subs.destroy(callback);
};

var destroyAllSubs = function(socket, callback) {
  var allSubs = socket.mapSubsRequest;
  if (allSubs == undefined) {
    return;
  }
  for (var tag in allSubs) {
    allSubs[tag].destroy(callback);
  }
};
