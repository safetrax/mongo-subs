'use strict';

var MongoSubs = require('../src/clientmongosubs');
var EventEmitter = require('events').EventEmitter;
var expect = require('chai').expect;
var sinon = require('sinon');

describe('MongoSubs client', function() {
  it('ignore multiple calls on MongoSubs.use', function() {
    var io = new EventEmitter();
    var spylistener = sinon.spy(io, 'on');
    MongoSubs.use(io);
    MongoSubs.use(io);
    expect(spylistener.callCount).to.equal(3);
  });

  it('should forward subscription request over io', function() {
    var io = new EventEmitter();
    var spySubscribe = sinon.spy(io, 'emit');
    MongoSubs.use(io);
    MongoSubs.subscribe('test', { name: 'tom' }, 'cartoon');

    var expectedRequest = {
      ns: 'test',
      query: { name: 'tom' },
      tag: 'cartoon'
    };

    expect(spySubscribe.calledOnce).to.be.true;
    expect(spySubscribe.getCall(0).args[0]).to.equal('mongo.subscribe');
    expect(spySubscribe.getCall(0).args[1]).to.deep.equal(expectedRequest);
  });

  it('should forward incoming message to the subscribed client', function() {
    var io = new EventEmitter();
    MongoSubs.use(io);
    var subscription = MongoSubs.subscribe('test', { name: 'tom' }, 'cartoon');
    var spyInsert = sinon.spy();
    var spyUpdate = sinon.spy();

    subscription.on('insert', spyInsert);
    subscription.on('update', spyUpdate);
    var insertDoc = { name: 'tom', activity: 'chase mice' };
    var updateDoc = { name: 'tom', activity: 'sleep' };
    io.emit('mongo.insert', { tag: 'cartoon', result: insertDoc });
    io.emit('mongo.update', { tag: 'cartoon', result: updateDoc });

    expect(spyInsert.calledOnce).to.be.true;
    expect(spyInsert.getCall(0).args[0]).to.deep.equal(insertDoc);
    expect(spyUpdate.calledOnce).to.be.true;
    expect(spyUpdate.getCall(0).args[0]).to.deep.equal(updateDoc);
  });

  it('should call filter fail when filter fails', function() {
    var io = new EventEmitter();
    MongoSubs.use(io);
    var subscription = MongoSubs.subscribe('test', { name: 'tom' }, 'cartoon');
    subscription.filter({ activity: 'sleep' });
    var spyInsert = sinon.spy();
    var spyFilterFail = sinon.spy();
    subscription.on('insert', spyInsert);
    subscription.on('queryfail', spyFilterFail);

    var positiveDoc = { _id: 'tom', name: 'tom', activity: 'sleep' };
    var negativeDoc = { _id: 'tom', name: 'tom', activity: 'chase mice' };
    io.emit('mongo.insert', { tag: 'cartoon', result: positiveDoc });
    io.emit('mongo.insert', { tag: 'cartoon', result: negativeDoc });

    expect(spyInsert.calledOnce).to.be.true;
    expect(spyInsert.getCall(0).args[0]).to.deep.equal(positiveDoc);
    expect(spyFilterFail.calledOnce).to.be.true;
    expect(spyFilterFail.getCall(0).args[0]).to.deep.equal(negativeDoc);
  });
});
