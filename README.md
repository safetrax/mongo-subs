mongo-subs
==========
A library that can listen to the updates for a given mongo query. This library uses oplog tailing
and pushes them over the [socket.io] [socket-io]. It also uses EventEmitter pattern to listen
updates on the server side.

[![travis][travis-image]][travis-url]

**Note:** Work in progress
[travis-image]: https://img.shields.io/travis/safetrax/mongo-subs.svg?style=flat
[travis-url]: https://travis-ci.org/safetrax/mongo-subs
[socket-io]: https://socket.io/


License
-------

    Copyright 2015 mtap technologies

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
