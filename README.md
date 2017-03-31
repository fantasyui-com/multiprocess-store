multiprocess-store
==================

ES6-and-beyond multiprocess-safe file-system-based object-store.

## Node Version

  Use the 7.x branch as it supports async/await via --harmony flag.
  Note that node 7.6.0 and above does not require the --harmony flag.

## Install

```shell

npm --save install multiprocess-store

```

### Require and Initialize

```JavaScript

const objectStore = require('multiprocess-store');

const store = await objectStore.createStore('~/Tests/my-objects');

await store.upsertObject({
    _id: 'helloWorldObject',
    text: 'Cats are little people!'
});

console.log(await store.getObject('helloObject'));
```

### Async/Await and ES6+

Use the --harmony flag to enable async/await in older 7.x.
Node 7.6 and up does not require the --harmony flag.

node <7.6.0

```shell

node --harmony my-app.js

```

node >=7.6.0

```shell

node my-app.js

```

## Examples

### Insert or update an object (upsert)

```JavaScript

const objectStore = require('multiprocess-store');
const myApp = async function() {

    const store = await objectStore.createStore('~/Tests/test-store-1');

    await store.upsertObject({
        _id: 'helloObject',
        text: 'Hello Object Store!'
    });

    console.log(await store.getObject('helloObject'));

};

myApp();

```

### Insert or Update, and then modify the object.

```JavaScript

const objectStore = require('multiprocess-store');
const myApp = async function() {
    const store = await objectStore.createStore('~/Tests/test-store-2');

    await store.upsertObject({
        _id: 'helloObject',
        text: 'Hello Object Store!'
    })

    // Make an update
    let storeObject = await store.getObject('helloObject');
    storeObject.secret = 'Cats are little people!';
    await store.updateObject(storeObject);

    console.log(await store.getObject('helloObject'));
};

myApp();

```

## API

Create the disk based store:

```JavaScript

const store = await objectStore.createStore('/tmp/a-user-manager-store');
=> store

// tilde will resolve to user home directory
const store = await objectStore.createStore('~/Tests/hello-store');
=> store // in user's home: /Users/captain-fantasy/Tests/hello-store

```

Crete an object with id hello.

```JavaScript

await store.createObject({_id:'hello', email:'alice@example.com'});
=> true;

```

Retrieve an object from the store by its id.

```JavaScript

let _id = 'hello';
await store.getObject(_id);
=> obj // the requested object, it will contain _id and _rev fields

```

Update a recently retrieved and edited object.

```JavaScript

await store.updateObject(obj);
=> true;

```

Delete an object using its id.

```JavaScript

let _id = 'hello';
await store.deleteObject(_id)
=> true;

```

Get revision conflicts.

```JavaScript

let _id = 'hello';
await store.getConflicts(_id);
=> [
    [
      "17-2351d3253f494398acb7b6c1f3ae293d",
      "17-3636fcd8b0dd4de9b851acb734204baa"
    ],
    [
      "31-16f79c01537740efab08ccac7417c22b",
      "31-71b27cfb062d4105a733fc69e728abd9"
    ]
  ];

```

Get all objects from the store. (Use .filter(), .map() and/or lodash on returned data)

```JavaScript

await store.getAllObjects();
=> [
    {
      "_id": "alice",
      "password": "42b3fdf4-12f7-4915-b218-599d08b001c4",
      "_rev": "56-34a2bb6f366143b999241f099e3e29c3"
    },
    {
      "_id": "bob",
      "password": "123",
      "_rev": "0-94bdde39692f48018e097cf4d1698931"
    },
    {
      "_id": "carol",
      "password": "hunter2",
      "_rev": "0-fe93b45cb46d4a9bbe4a44f11a62ee27"
    }
  ];

```


## A quick note on revision conflicts in a distributed, unreliable, multicore, networked world.

Revision conflicts occur when two processes write at the same time to the same revision. That is to say, two separate programs requested a copy of an object at the same time/object-state, modified the data and performed an ```updateObject``` slipping through the cracks between atomic disk IO and node multiprocessing ```race conditions```.

Revision conflicts occur due to race conditions that emerge between multiprocessing and non-atomic disk IO. Revision conflicts occur in rare conditions, and solving them depends on your particular application. If it is a user manager for administrators, flag account as needing attention. If it is a wiki, proudly parade the conflict as needing human attention. If it is a fabulous RGB color generator for your new website, just ignore it.

A new revision of a document means that a conflict is probably not important anymore. A conflict inside a previous revision becomes a signal that something may potentially need attention, maybe a bit of information can be moved into the latest revision all the way back from few weeks ago when some administrator made a note on an unreliable network connection somewhere.

Revision conflicts can only be solved by a human in context of a program that is using the store, however there is potential for auto-solving. Consider an event where both a very old conflict and the latest master have matching data for example email:alice@example.com this means that in this particular scenario the old revision conflict can be removed automatically as its data has been captured by the latest revision, be it by chance or because someone looked at the revision and moved that bit of data to the latest revision.

### One Thousand Hosts, One Thousand Processes, One Million Revision Conflicts, No Headache.

If you had a 1,000 servers, with 1,000 processes all creating revision 2 of object named important-passwords, thus 1,000 conflicts on 1,000 machines.

If every machine contacted all other 999 machines, and copied their revision data about 1,000 revision files from each of those 999 machines, a total of 1,000,000 files. At the end of the day, they would each arrive at the same state of revision 2, independently agreeing on a single lucky revision file; thus reaching ```eventual consistency```.

If one of those machines made another change later in the night, and saved revision 3 of important-passwords. All those 999 other machines, hoping to synchronize, would only copy that single revision 3 from that host. The other 999 machines would request revision 3.

Again conflict resolution is not a theoretical problem, nor is it a general problem for generic databases, it depends on your particular application, needs, network, customers, administrators, foresight, and technology.

Don't block I/O.

### LICENSE

GPLv3
