'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DETAIL_OPLOG = 'detailOplog';

var DetailedOplog = function(oplog, mongoreader) {
  EventEmitter.call(this);
  this.setMaxListeners(0);
  var self = this;
  this.mongoreader = mongoreader;
  this.events = oplog.events;
  this.oplog = oplog;
  oplog.on('op', this._onop.bind(this));
};

util.inherits(DetailedOplog, EventEmitter);

// intercept only update
DetailedOplog.prototype._onop = function(opDoc) {
  var self = this;
  var oplog = this.oplog;
  if (opDoc.op !== 'u') {
    self.emit(DETAIL_OPLOG, opDoc);
    return;
  }

  this.mongoreader.read(opDoc.ns, opDoc.o2._id).then(function(doc) {
    opDoc.o = doc;
    self.emit(DETAIL_OPLOG, opDoc);
  }).catch(function(err) {
    console.error('Can\'t locate document ' + opDoc.o2._id.toString());
  });
};

DetailedOplog.prototype.filter = function(ns) {
  return new DetailedFilter(ns, this);
};

/** Behaves as default filter except it passes the detailed op */
var DetailedFilter = function(ns, dOplog) {
  EventEmitter.call(this);
  this.ns = regex(ns || '*');
  this.dOplog = dOplog;
  dOplog.on(DETAIL_OPLOG, this._onop.bind(this));
};

util.inherits(DetailedFilter, EventEmitter);

DetailedFilter.prototype._onop = function(doc) {
  if (!this.ns.test(doc.ns)) {
    return;
  }
  this.emit('op', doc);
  this.emit(this.dOplog.events[doc.op], doc);
};

DetailedFilter.prototype.destroy = function(cb) {
  this.dOplog.removeListener(DETAIL_OPLOG, this._onop);
  this.removeAllListeners();
  if (!!cb) {
    cb();
  }
  return this;
};

var regex = function(pattern) {
  pattern = pattern.replace(/[\*]/g, '(.*?)');
  return new RegExp('^' + pattern + '$', 'i');
};

module.exports = DetailedOplog;
