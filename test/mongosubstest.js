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
var sinon = require('sinon');
var MongoPublisher = require('../src/mongosubs');

var MockOplog = require('./mockoplog');

describe('MongoPublisher', function() {
  describe('.subscribe', function() {
    it('emits events on subscribe', function(done) {
      var oplog = new MockOplog();
      var publisher = new MongoPublisher(oplog);

      var subs = publisher.subscribe('*.test', {});
      expect(subs).to.not.be.null;
      subs.on('insert', function(doc) {
        expect(doc).to.have.property('hello').and.to.equal('there');
        done();
      });
      oplog.push(subs, 'insert', {
        'hello': 'there'
      });
    });

    it('emit right events', function(done) {
      var oplog = new MockOplog();
      var publisher = new MongoPublisher(oplog);
      var subs = publisher.subscribe('*.test', {});
      var dataDel = { data: 'delete' };
      var dataUpdate = { data: 'update' };
      subs.on('insert', sinon.stub().throws('can\'t call insert'));

      subs.on('update', function(doc) {
        expect(doc).to.deep.equal(dataUpdate);
      });
      subs.on('delete', function(doc) {
        expect(doc).to.deep.equal(dataDel);
        done();
      });
      oplog.push(subs, 'update', dataUpdate);
      oplog.push(subs, 'delete', dataDel);
    });
  });

  describe('.unsubscribe', function() {
    it('destroys on unsubscribe', function() {
      var oplog = new MockOplog();
      var publisher = new MongoPublisher(oplog);

      var subs = publisher.subscribe('*.test', {});
      expect(subs).to.not.be.null;
      subs.destroy();
      expect(oplog.isDestroyed(subs)).to.be.true;
    });
  });

  describe('Query match filter layer', function() {
    it('No emit if does not pass query filter', function() {
      var oplog = new MockOplog();
      var failFilter = {
        matches: function(doc) {
          return false;
        }
      };
      var publisher = new MongoPublisher(oplog, function(query) {
        return failFilter;
      });

      var subs = publisher.subscribe('*.test', {});
      subs.on('insert', sinon.stub().throws('can\'t call insert'));
      oplog.push(subs, 'insert', {
        'hello': 'there'
      });
    });
  });
});
