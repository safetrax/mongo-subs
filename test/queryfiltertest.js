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
var QueryFilter = require('../src/queryfilter');

describe('QueryFilter', function() {
  describe('with normal key value pair', function() {
    it('simple match check', function() {
      var query = { name: 'tom' };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({ name: 'tom', type: 'cat' });
      expect(result).to.be.true;
    });

    it('with mutiple checks', function() {
      var query = { name: 'tom', chases: 'jerry' };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({ name: 'tom', chases: 'jerry', always: 'sleeps' });
      expect(result).to.be.true;
    });

    it('fails if one check did not pass', function() {
      var query = { name: 'tom', chases: 'jerry', from: 'cartoon network' };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        from: 'cartoon'
      });
      expect(result).to.be.false;
    });

    it('passes with mixed data type checks', function() {
      var query = { name: 'tom', chases: 'jerry', fromCartoon: true, failed: 5 };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        fromCartoon: true, failed: 5
      });
      expect(result).to.be.true;
    });

    it('fails if data type mismatch', function() {
      var query = { name: 'tom', chases: 'jerry', fromCartoon: true, failed: 5 };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        fromCartoon: true, failed: '5'
      });
      expect(result).to.be.false;
    });

    it('checks the deep link with dot notation', function() {
      var query = { name: 'tom', chases: 'jerry', 'task.chase.failed': true };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        task: { chase: { failed: true } }
      });
      expect(result).to.be.true;
    });

    it('fails if the deep link does not exists', function() {
      var query = { name: 'tom', chases: 'jerry', 'task.chase.failed': true };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        task: { chase: { passed: true } }
      });
      expect(result).to.be.false;
    });
  });

  describe('With Array values', function() {
    it('drill downs to find a match', function() {
      var query = { name: 'tom', chases: 'jerry', 'tasks.chase.failed': true };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        tasks: [{ chase: { passed: true } }, { chase: { failed: true } }]
      });
      expect(result).to.be.true;
    });

    it('Fails if array does not contains a match', function() {
      var query = { name: 'tom', chases: 'jerry', 'tasks.chase.failed': true };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        tasks: [{ chase: { passed: true } }, { chase: { failed: false } }]
      });
      expect(result).to.be.false;
    });

    it('supports nested array checks', function() {
      var query = { name: 'tom', chases: 'jerry', 'tasks.chase.failed': true };
      var queryFilter = new QueryFilter(query);
      var result = queryFilter.matches({
        name: 'tom', chases: 'jerry', always: 'sleeps',
        tasks: [{ chase: { passed: true } }, { chase: [{ failed: false }, { failed: true }] }]
      });
      expect(result).to.be.true;
    });
  });

  describe('With mongo comparators', function() {
    it('combine comparator checks with other conditions', function() {
      var query = { name: 'tom', weighs: { $gt: 40, $lt: 45 } };
      var queryFilter = new QueryFilter(query);
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 45
      });
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 41
      });
      expect(resultFail).to.be.false;
      expect(resultPass).to.be.true;
    });

    it('greater than', function() {
      var query = { name: 'tom', weighs: { $gt: 40 } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 41
      });
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('greater than or equal to', function() {
      var query = { name: 'tom', weighs: { $gte: 40 } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 39
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('lesser than', function() {
      var query = { name: 'tom', weighs: { $lt: 40 } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 39
      });
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('lesser than or equal to', function() {
      var query = { name: 'tom', weighs: { $lte: 40 } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 42
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });
  });

  describe('clause $exists', function() {
    it('positive', function() {
      var query = { name: 'tom', weighs: { $exists: true } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      var resultFail = queryFilter.matches({
        name: 'tom'
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('negative', function() {
      var query = { name: 'tom', weighs: { $exists: false } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom'
      });
      var resultFail = queryFilter.matches({
        name: 'tom', weighs: 40
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('supports drill down', function() {
      var query = { name: 'tom', 'tasks.chases.failed': { $exists: true } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', tasks: [{ chases: [{ passed: 3 }] }, { chases: [{ failed: 2 }] }]
      });
      var resultFail = queryFilter.matches({
        name: 'tom', tasks: [{ chases: [{ passed: 3 }] }]
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });
  });

  describe('clause $ne', function() {
    it('basic property', function() {
      var query = { name: 'tom', inSleep: { $ne: 'yes' } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', inSleep: 'no'
      });
      var resultFail = queryFilter.matches({
        name: 'tom', inSleep: 'yes'
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('consider true if undefined actual', function() {
      var query = { name: 'tom', inSleep: { $ne: 'yes' } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom'
      });
      var resultFail = queryFilter.matches({
        name: 'tom', inSleep: 'yes'
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });
  });

  describe('clause $in and $nin', function() {
    it('basic $in check', function() {
      var query = { name: 'tom', hates: { $in: ['dog', 'puppy'] } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', hates: 'dog'
      });
      var resultFail = queryFilter.matches({
        name: 'tom', hates: 'sleeping'
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });

    it('basic $nin check', function() {
      var query = { name: 'tom', hates: { $nin: ['dog', 'puppy'] } };
      var queryFilter = new QueryFilter(query);
      var resultPass = queryFilter.matches({
        name: 'tom', hates: 'sleeping'
      });
      var resultFail = queryFilter.matches({
        name: 'tom', hates: 'dog'
      });
      expect(resultPass).to.be.true;
      expect(resultFail).to.be.false;
    });
  });
});
