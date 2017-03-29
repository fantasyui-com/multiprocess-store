const uuid = require('uuid/v4');

const objectStore = require('./index.js');

let tests = async function(){

  const store = await objectStore.createStore('~/Tests/hello-store');

  try {


    await store.createObject({ _id: 'helloObject', text: 'Hello Object Store!' })
    .catch(err => {
      if(err.message.startsWith('OBJECT_ALREADY_EXISTS') ){
        console.error("Object is already there, all good, we can continue testing.")
      }
    });


    let secret = uuid();

    let storeObject = await store.getObject('helloObject');
    storeObject.secret = secret;
    await store.updateObject(storeObject);

    let updatedObject = await store.getObject(storeObject._id);
    if( updatedObject.secret === secret ){
      console.log('Yup, data gets saved no problem.');
      console.log(JSON.stringify(updatedObject, null, '  '));
    }

    // Let us create an edit conflict!!!
    let aliceCopyOfObject = await store.getObject('helloObject');
    let bobCopyOfObject = await store.getObject('helloObject');

    // both alice and bob have a copy.
    // now they make an incompatible change!!!

    aliceCopyOfObject.secret = uuid();
    bobCopyOfObject.secret = uuid();

    // Oh noes, the two objects hold conflicting data now, let us save both at the same time to see what happends!!!!
    await Promise.all([store.updateObject(aliceCopyOfObject), store.updateObject(bobCopyOfObject)]);

    // Gosh, it is now unknown which secret was saved :( somebody is about to lose.
    // Lets wait a little bit and get that data back.
    setTimeout(async ()=>{

      let winningObject = await store.getObject('helloObject');

      if( winningObject.secret === aliceCopyOfObject.secret) {
        console.log('Alice won, her data won.')
      }else{
        console.log('Alice lost, her data lost, but it is still there, marked as a conflict.')
      }

      if( winningObject.secret === bobCopyOfObject.secret) {
        console.log('Bob won, his data won.')
      }else{
        console.log('Bob lost, his data lost, but it is still there, marked as a conflict.')
      }

      let listOfConflicts = await store.getConflicts('helloObject');
      console.log('Here is the listOfConflicts')
      console.log(JSON.stringify(listOfConflicts, null, '  '))

    },100)


  } catch(err){
      console.error("TEST ERROR: ", err, err.code)
  }
}

tests();
