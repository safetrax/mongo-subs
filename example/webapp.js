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

// Web server example to check mongo-subs

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoSubsRPC = require('mongo-subs').MongoRPC;

var PORT = 3000;

var publisher = require('./publisher');

MongoSubsRPC.serveOverSocket(io, publisher);

var server = http.listen(PORT, function() {
  console.log('Listening on ' + PORT);
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('pages/hellosubs');
});

io.on('connection', function(socket){
  console.log('a user connected');
});
