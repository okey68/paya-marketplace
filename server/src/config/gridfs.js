const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFSBucket } = require('mongodb');

let gfs;
let gridfsBucket;

// Initialize GridFS
const initGridFS = () => {
  const conn = mongoose.connection;
  
  conn.once('open', () => {
    // Initialize GridFS
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    
    // Initialize GridFSBucket for newer MongoDB driver
    gridfsBucket = new GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    console.log('GridFS initialized successfully');
  });
};

// Get GridFS instance
const getGFS = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized');
  }
  return gfs;
};

// Get GridFSBucket instance
const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error('GridFSBucket not initialized');
  }
  return gridfsBucket;
};

module.exports = {
  initGridFS,
  getGFS,
  getGridFSBucket
};
