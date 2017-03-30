const objectStore = require('./index.js');
const sleep = async seconds => new Promise(awake=>setTimeout(()=>{awake()},seconds*1000));
const uuid = require('uuid/v4');

  // note, you need to run this simulation twice, the first time username will be available,
  // the second it will be taken.

let tests = async function(){

  const store = await objectStore.createStore('/tmp/a-user-manager-store');

  // Imagine we are in a tiny HTTP server, user filled out a signup form, clicked [Sign-up] button.
  // app.post("/api-signup", (req, res, next()) => { ...

  // We just got the username/password pair.
  // var username = req.body.username.replace(/[^A-Za-z0-9@_._-]/g,'');
  // var password = req.body.password.replace(/[^A-Za-z0-9@_._-]/g,'');

  // The task at hand is to add the user to the database.
  let html = ''; // this will be sent back to the server...

  let username = 'alice'; // THIS IS WHAT WE GOT FROM THE INTERNET
  let password = 'secret'; // THIS IS WHAT WE GOT FROM THE INTERNET

  let userObject = {
    _id: username,
    password: password,
  };

  try {
    // the following will fail if the username is already taken.
    // the object can only be created if it does not exist.
    await store.createObject(userObject);
    html = `Done! You can now login with your new account.`;
  } catch(err){
    if(err.message.startsWith('OBJECT_ALREADY_EXISTS') ){
      html = `That username is already taken, try another.`;
    } else {
      html = `Server error, try again.`;
    }
  }
  console.log(html)


  // ... a short moment later ... //
  sleep(1);

  // alice will update her password to something more secure.
  let myNewPassword = uuid();
  let myAccount = await store.getObject(username);
  myAccount.password = myNewPassword;
  await store.updateObject(myAccount);
  {
    // Here, just a quick check to see if the password was changed OK...
    let record = await store.getObject(username);
    if(record.password == myNewPassword){
      console.log('Alice has updated her password!')
    }else{
      console.log('Something went very wrong!')
    }
  }

  // ... a short moment later ... //
  sleep(1);
  // we add a couple more users...
  try{
    await store.createObject({ _id: 'bob', password: '123', });
    await store.createObject({ _id: 'carol', password: 'hunter2', });
  }catch(e){/* ignore errors as they are not relevant to this portion of the test */}

  // now we want to list all users in the system...
  let allUsers = await store.getAllObjects();
  console.log(JSON.stringify(allUsers,null, '  '))
  console.log('SIMULATION COMPLETE.')

}

tests();
