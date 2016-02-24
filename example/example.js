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
var Publisher = require('mongo-subs');
var commandline = require('command-line-args');

var cli = commandline([
  { name: 'mongouri', alias: 'm', type: String },
  { name: 'mongodbname', alias: 'd', type: String }
]);

var options = cli.parse();
var mongouri = options.mongouri || '127.0.0.1:27017';
var mongodbname = options.mongodbname || 'mongodbapi';

var publisher = Publisher.createWith('mongodb://' + options.mongouri + '/local', {
  ns: options.mongodbname, coll: 'oplog.$main'
});

console.log('Listening on mongo:' + mongouri + ' dbname: ' + mongodbname);

// listens to all.
var sub = publisher.subscribe('*.hello');

sub.on('insert', function(doc) {
  console.log('Insert' + JSON.stringify(doc));
});

sub.on('update', function(doc) {
  console.log('Hello ' + JSON.stringify(doc));
});
