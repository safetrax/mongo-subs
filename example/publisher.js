// Apache License Copyright mtap 2016
'use strict';

var commandline = require('command-line-args');
var Publisher = require('mongo-subs');

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

module.exports = publisher;
