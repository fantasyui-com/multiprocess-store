const expandTilde = require('expand-tilde');

const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const pify = require('pify');
const uuidV4 = require('uuid/v4');
const sort = require('alphanum-sort');

const error = {
             ID_REQUIRED: 'ID_REQUIRED: Id is required',
   OBJECT_ALREADY_EXISTS: 'OBJECT_ALREADY_EXISTS: Object cannot be created becasue it already exists. Use should update it not create it.',
  EMPTY_OBJECT_DIRECTORY: 'EMPTY_OBJECT_DIRECTORY: A directory representing an object is empty, please remove it from storage.'
}

class StoreObject {

  constructor({store, data}) {


    this._id = data._id.replace(/^A-Za-z0-9/g, '');
    if(!this._id) throw new Error(error.ID_REQUIRED);

    this.store = store;
    this.data = data;
    this.path = path.join( this.store.path, this._id );



   }

  async create(){

    try {
      await pify(fs.mkdir)(this.path);
    } catch (err){
      if (err.code == 'EEXIST') {
        throw new Error(error.OBJECT_ALREADY_EXISTS)
      }
    }

    let objectFilename = path.join( this.path, ['0', uuidV4().replace(/-/g,'')].join('-') );
    await pify(fs.writeFile)(objectFilename, JSON.stringify(this.data, null, '  '));
    return true;


  }

  async read(){

    let objectFilenames = await pify(fs.readdir)(this.path);

    if(objectFilenames.length === 0) throw new Error(error.EMPTY_OBJECT_DIRECTORY);

    let latestRevision = sort(objectFilenames).pop();
    let objectFilename = path.join( this.path, latestRevision );
    let str = await pify(fs.readFile)(objectFilename);

    this.data = JSON.parse(str);

    // force information for integrity purposes
    this.data._id = this._id;
    this.data._rev = latestRevision;


    return this.data;

  }

  async update(){

    let latestRevision = this.data._rev||'0-0';
    let [currentRevision] = latestRevision.split('-',1);
    let newRevision = parseInt(currentRevision) + 1;
    let revId = uuidV4().replace(/-/g,'');
    let rev = [newRevision,  ].join('-');

    let objectFilename = path.join( this.path, rev );

    // update rev for external access to file.
    this.data._rev = rev;
    await pify(fs.writeFile)(objectFilename, JSON.stringify(this.data, null, '  '));
    return true;

  }

  async delete(){
    if(this.store.path == this.path) throw new Error(error.ID_REQUIRED);
    await pify(rimraf)(this.path,{disableGlob:true});
    return true;
  }


  async conflicts(){
    let memory = {};
    let response = [];
    let objectFilenames = await pify(fs.readdir)(this.path);
    objectFilenames = sort(objectFilenames);

    objectFilenames.forEach(fileName => {
      let [ revisionNumber, revisionId ] = fileName.split('-', 2);

      if( memory[revisionNumber]){
        // OK
        memory[revisionNumber].push(fileName);
      }else{
        // initialize
        memory[revisionNumber] = [fileName]
      }
    });

    Object.keys(memory).forEach(key=>{
      if( memory[key].length > 1 ){
        response.push(memory[key])
      }
    });

    return response

  }

}

class ObjectStore {

  constructor(height, width) {
    this.error = error;
    this.width = width;
  }

  async createStore(storePath){
    return new Promise(async (resolve, reject) => {

      try {

        this.path = path.resolve(expandTilde(storePath));
        await pify(mkdirp)(this.path);
        resolve(this);

      } catch(e) {
        reject(e);
      }

    });
  }

  async createObject(obj){
    return new Promise(async (resolve, reject) => {

    try {

      let storeObject = new StoreObject({store:this, data:obj});
      let response = await storeObject.create();
      resolve(response);

    } catch(e) {
      reject(e);
    }

    });
  }

  async getObject(_id){
    return new Promise(async (resolve, reject) => {

    try {

      let storeObject = new StoreObject({store:this, data:{_id}});
      let obj = await storeObject.read();
      resolve(obj);

    } catch(e) {
      reject(e);
    }

    });
  }

  async updateObject(obj){
    return new Promise(async (resolve, reject) => {

    try {

      let storeObject = new StoreObject({store:this, data:obj});
      let response = await storeObject.update();
      resolve(response);

    } catch(e) {
      reject(e);
    }

    });
  }

  async deleteObject(_id){
    return new Promise(async (resolve, reject) => {

    try {

      let storeObject = new StoreObject({store:this, data:{_id}});
      let response = await storeObject.delete();
      resolve(response);

    } catch(e) {
      reject(e);
    }

    });
  }

  async getConflicts(_id){
    return new Promise(async (resolve, reject) => {

    try {

      let storeObject = new StoreObject({store:this, data:{_id}});
      let conflicts = await storeObject.conflicts();
      resolve(conflicts);

    } catch(e) {
      reject(e);
    }

    });
  }
  async getAllObjects(){
    return new Promise(async (resolve, reject) => {

    try {

      let allIds = await pify(fs.readdir)(this.path);
      allIds = allIds.filter(i=>!i.startsWith('.'));

      // fs.stat(path.join(this.path,i)).isDirectory()

      allIds = await Promise.all(allIds.map(async _id=>
        new Promise(async (resolve, reject) => {
          let fullPath = path.join(this.path, _id);
          let stat = await pify(fs.stat)(fullPath);
          let files = [];

          if(stat.isDirectory()) files = await pify(fs.readdir)(fullPath);
          // TODO: verify if those files, located in document folder, are valid revisions of document

          if( (files.length > 0) && stat.isDirectory() ){
            resolve(_id);
          }else{
            resolve()
          }
        }) // Promise
      ));

      // remove undefined
      allIds = allIds.filter(i=>i);
      let store = this;
      let allObjects = allIds.map(async _id=>new Promise(async (resolve, reject) => {
        let storeObject = new StoreObject({store, data:{_id}});
        let obj = await storeObject.read();
        resolve(obj);
      }));
      let response = await Promise.all(allObjects);

      resolve(response);


    } catch(e) {
      reject(e);
    }

    });
  }

}




module.exports = new ObjectStore();
