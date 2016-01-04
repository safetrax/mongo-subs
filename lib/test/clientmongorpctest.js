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

var expect = require('chai').expect;
var _mongo = require('../src/clientmongorpc');
var EventEmitter = require('events').EventEmitter;

var io = new EventEmitter();
_mongo.use(io);

describe('_mongo client', function() {
  describe('basics', function() {
    var query = {};
    var tag = 'simpletest';
    var ns = '*.test';
    var doc = { name: 'tom' };

    afterEach(function() {
      io.removeAllListeners('mongo.subscribe');
    });

    it('requests for subscription over io', function(done) {
      io.on('mongo.subscribe', function(request) {
        expect(request).to.deep.equal({ ns: ns, query: query, tag: tag });
        done();
      });
      _mongo.subscribe(ns, query, tag);
    });

    it('listens for updates and forwards cleanly', function(done) {
      var subs = _mongo.subscribe(ns, query, tag);
      subs.on('insert', function(data) {
        expect(data).to.deep.equal(doc);
        done();
      });
      io.emit('mongo.insert', { result: doc, tag: tag });
    });

    it('passes to the right tagged subscription', function(done) {
      var tagOne = 'tagOne';
      var tagTwo = 'tagTwo';
      var subsOne = _mongo.subscribe(ns, query, tagOne);
      var subsTwo = _mongo.subscribe(ns, query, tagTwo);
      subsOne.on('insert', function(data) {
        expect.fail('wrong subscription called');
      });
      subsTwo.on('insert', function(data) {
        done();
      });
      io.emit('mongo.insert', { result: doc, tag: tagTwo });
    });
  });
});
