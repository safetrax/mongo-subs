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
var Publisher = require('./lib');

var publisher = Publisher.createWith('mongodb://127.0.0.1:27017/local', {
  ns: 'test', coll: 'oplog.$main'
});

// listens to all.
var sub = publisher.subscribe('*.hello', { 'name': 'Sridhar' });

sub.on('insert', function(doc) {
  console.log('Insert' + JSON.stringify(doc));
});

sub.on('update', function(doc) {
  console.log('Hello ' + JSON.stringify(doc));
});
