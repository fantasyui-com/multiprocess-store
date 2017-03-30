const objectStore = require('./index.js');
const myApp = async function() {

    const store = await objectStore.createStore('~/Tests/test-store-1');

    await store.upsertObject({
        _id: 'helloObject',
        text: 'Hello Object Store!'
    });

    console.log(await store.getObject('helloObject'));

};
myApp();
