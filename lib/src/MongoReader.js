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

var MongoReader = function(mongoContext) {
  this.mongoContext = mongoContext;
};

MongoReader.prototype.read = function(ns, objectId) {
  var mongoContext = this.mongoContext;
  if (!mongoContext.ready) {
    console.error('DB connection is not set yet');
    return;
  }
  var splitNs = ns.split('.');
  var dbName = splitNs[0];
  var colname = splitNs.slice(1, splitNs.length).join('.');
  return mongoContext.getDb(dbName).collection(colname).findOne({ _id: objectId });
};

module.exports = MongoReader;
