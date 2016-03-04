'use strict';
var MongoClient = require('mongodb').MongoClient;
var Promise = require('promise');

var MongoReader = function(mongouri) {
  var self = this;
  MongoClient.connect(mongouri, function(err, db) {
    self.mongoDb = db;
  });
};

MongoReader.prototype._getDb = function(dbName) {
  if (!this.mongoDb) {
    throw new Error('Not connected yet');
  }
  return this.mongoDb.db(dbName);
};

MongoReader.prototype.read = function(ns, objectId) {
  var splitNs = ns.split('.');
  var dbName = splitNs[0];
  var colname = splitNs.slice(1, splitNs.length).join('.');
  return this._getDb(dbName).collection(colname).findOne({ _id: objectId });
};

module.exports = MongoReader;
