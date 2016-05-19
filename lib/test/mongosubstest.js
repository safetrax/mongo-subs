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
  describe('Subscription functions', function() {
    var Subscription = MongoPublisher.Subscription;
    var oplog = new MockOplog();
    var passFilter = {
      matches: function() {
        return true;
      }
    };

    it('should register for all events of oplog', function() {
      var subs = new Subscription(oplog, passFilter);
      var spyInsert = sinon.spy();
      var spyUpdate = sinon.spy();
      var spyDelete = sinon.spy();

      subs.on('insert', spyInsert);
      subs.on('update', spyUpdate);
      subs.on('delete', spyDelete);
      oplog.emit('insert', { o : { doc: 'inserted' } });
      oplog.emit('update', { o: { doc: 'updated' } });
      oplog.emit('delete', { o: { doc: 'deleted' } });

      expect(spyInsert.called).to.be.true;
      expect(spyInsert.getCall(0).args[0]).to.deep.equal({ doc: 'inserted' });
      expect(spyUpdate.called).to.be.true;
      expect(spyUpdate.getCall(0).args[0]).to.deep.equal({ doc: 'updated' });
      expect(spyDelete.called).to.be.true;
      expect(spyDelete.getCall(0).args[0]).to.deep.equal({ doc: 'deleted' });
    });

    it('calls for unregistration when unsubscribed', function() {
      var subs = new Subscription(oplog, passFilter);
      var spyDestroy = sinon.spy(oplog, 'destroy');
      subs.destroy();
      expect(spyDestroy.called).to.be.true;
    });

    it('No emit if query filter check fails', function() {
      var filter = {
        matches: function(doc) {

        }
      };
      var stubFilter = sinon.stub(filter, 'matches');
      stubFilter.withArgs({ doc: 'passed' }).returns(true);
      stubFilter.withArgs({ doc: 'failed' }).returns(false);

      var spyListener = sinon.spy();

      var subs = new Subscription(oplog, filter);
      subs.on('insert', spyListener);
      oplog.emit('insert', { o: { doc: 'failed' } });
      oplog.emit('insert', { o: { doc: 'passed' } });
      expect(spyListener.calledOnce).to.be.true;
      expect(spyListener.getCall(0).args[0]).to.deep.equal({ doc: 'passed' });
    });
  });
});
