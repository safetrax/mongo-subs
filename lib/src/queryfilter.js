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

var QueryFilter = function(findQuery) {
  this._findQuery = findQuery;
  this._elementMatcher = [];
  for (var key in findQuery) {
    this._elementMatcher.push(getMatcher(key, findQuery[key]));
  }
};

QueryFilter.NONE = {
  matches: function(doc) {
    return true;
  }
};

QueryFilter.prototype.matches = function(doc) {
  var match = true;
  this._elementMatcher.forEach(function(matcher) {
    if (!matcher.isMatch(doc)) {
      match = false;
    }
  });
  return match;
};

var getMatcher = function(key, value) {
  if (typeof value !== 'object') {
    return new Matcher(key, value, objValidater.default);
  }
  var validaters = [];
  for (var c in value) {
    validaters.push(objValidater[c]);
  }
  return new Matcher(key, value, multiValidator(validaters));
};

var objValidater = {
  default: function(actual, expected) {
    return actual === expected;
  },
  $gte: function(actual, expected) {
    var compareWith = expected.$gte;
    return actual >= compareWith;
  },
  $lte: function(actual, expected) {
    var compareWith = expected.$lte;
    return actual <= compareWith;
  },
  $gt: function(actual, expected) {
    var compareWith = expected.$gt;
    return actual > compareWith;
  },
  $lt: function(actual, expected) {
    var compareWith = expected.$lt;
    return actual < compareWith;
  },
  $exists: function(actual, expected) {
    expected = expected.$exists;
    return !!actual === expected;
  },
  $ne: function(actual, expected) {
    return actual !== expected.$ne;
  },
  $in: function(actual, expected) {
    return expected.$in.indexOf(actual) > -1;
  },
  $nin: function(actual, expected) {
    return expected.$nin.indexOf(actual) === -1;
  },
  $elemMatch: function(actual, expected) {
    throw new Error('Does not supports $elemMatch');
  }
};

var arrayDrillDown = function(keyQ, keyIndex, arrayElement, expected, validate) {
  var foundMatch = false;
  for (var elemIndex in arrayElement) {
    var elem = arrayElement[elemIndex];
    for (var r = keyIndex; r < keyQ.length; r++) {
      var rKey = keyQ[r];
      if (!isNaN(rKey)) {
        throw new Error('Does not supports indexes in dot notation keys');
      }
      // support nested array elements check
      if (elem instanceof Array) {
        foundMatch = arrayDrillDown(keyQ, r, elem, expected, validate);
        if (foundMatch) {
          return foundMatch;
        }
      }
      if (rKey in elem) {
        elem = elem[rKey];
      } else {
        elem = null;
        break;
      }
    }
    foundMatch = validate(elem, expected);
    if (foundMatch) {
      break;
    }
  }
  return foundMatch;
};

var drillDown = function(key, doc, expected, validate) {
  var keyQ = key.split('.');
  var actual = doc;
  for (var k in keyQ) {
    var key = keyQ[k];
    if (actual instanceof Array) {
      return arrayDrillDown(keyQ, k, actual, expected, validate);
    }
    if (key in actual) {
      actual = actual[key];
    } else {
      actual = null;
      break;
    }
  }
  return validate(actual, expected);
};

var multiValidator = function(validaters) {
  return function(actual, expected) {
    for (var i in validaters) {
      if (!validaters[i](actual, expected)) {
        return false;
      }
    }
    return true;
  };
};

var Matcher = function(key, value, validater) {
  this._key = key;
  this._value = value;
  this._validater = validater;
};

Matcher.prototype.isMatch = function(doc) {
  var expected = this._value;
  return drillDown(this._key, doc, expected, this._validater);
};

module.exports = QueryFilter;
