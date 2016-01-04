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
var MongoSubsRpc = require('../src/mongosubsrpc');
var EventEmitter = require('events');
var util = require('util');
var expect = require('chai').expect;
var sinon = require('sinon');

var StubPublisher = function() {
  EventEmitter.call(this);
};

util.inherits(StubPublisher, EventEmitter);

StubPublisher.prototype.subscribe = function() {
  return this;
};

StubPublisher.prototype.emitMessage = function(e, data) {
  data = { o: data };
  this.emit(e, data);
};

var StubIo = function() {
  EventEmitter.call(this);
  this.socket = new StubSocket();
};
util.inherits(StubIo, EventEmitter);

StubIo.prototype.emitConnected = function() {
  this.emit('connection', this.socket);
};

StubIo.prototype.isTagged = function(tag) {
  return this.socket.mapSubsRequest[tag] != undefined;
};

StubIo.prototype.sendAsSocketRequest = function(e, data) {
  this.socket.emit(e, data);
};

var serveOver = function(io) {
  var publisher = new StubPublisher();
  MongoSubsRpc.serveOverSocket(io, publisher);
  io.emitConnected();
  return publisher;
};

var StubSocket = function() {
  EventEmitter.call(this);
};
util.inherits(StubSocket, EventEmitter);

describe('Mongo Subscribe RPC', function() {
  describe('basics', function() {
    it('tags the subscription result with the socket object', function() {
      var io = new StubIo();
      serveOver(io);
      io.sendAsSocketRequest('mongo.subscribe', { ns: 'test', query: {}, tag: 'test' });
      expect(io.isTagged('test')).to.be.true;
    });

    it('calls for subscription on io request', function() {
      var request = { ns: 'test', query: {}, tag: 'test' };
      var io = new StubIo();
      var publisher = serveOver(io);
      var spy = sinon.spy(publisher, 'subscribe');
      io.sendAsSocketRequest('mongo.subscribe', request);
      expect(spy.called).to.be.true;
      expect(spy.calledWith(request.ns, request.query));
    });

    it('parcels before forwarding', function(done) {
      var request = { ns: 'test', query: {}, tag: 'test' };
      var data = { name: 'tom' };
      var io = new StubIo();
      var publisher = serveOver(io);
      io.sendAsSocketRequest('mongo.subscribe', request);
      io.socket.on('mongo.insert', function(reply) {
        expect(reply.tag).to.equal(request.tag);
        expect(reply.result).to.deep.equal(data);
        done();
      });

      publisher.emit('insert', data);
    });
  });
});
