const objectStore = require('./index.js');
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
