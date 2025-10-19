const { MongoClient } = require('mongodb');
const logger = require('./logger');

// Reads MONGODB_URI and DB_NAME from env. Example .env keys:
// MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
// DB_NAME=mydatabase

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || process.env.MONGODB_DB || null;

if (!uri) {
  logger('MONGODB_URI is not set in environment. Database functionality will be disabled.', 'warn');
}
if (!dbName) {
  logger('DB_NAME is not set in environment. Database functionality will be disabled.', 'warn');
}

let client = null;
let cachedDb = null;

async function connect() {
  if (!uri) throw new Error('MONGODB_URI not configured');
  if (client && client.topology && client.topology.isConnected()) {
    return cachedDb;
  }

  client = new MongoClient(uri, {
    // useUnifiedTopology is default in modern drivers
    serverApi: '1',
  });

  await client.connect();
  cachedDb = client.db(dbName || undefined);
  logger(`Connected to MongoDB${dbName ? ` (db: ${dbName})` : ''}`, 'debug');
  return cachedDb;
}

async function getDb() {
  if (cachedDb) return cachedDb;
  return connect();
}

async function getCollection(name) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db.collection(name);
}

async function findOne(collectionName, filter = {}, options = {}) {
  const col = await getCollection(collectionName);
  return col.findOne(filter, options);
}

async function findMany(collectionName, filter = {}, options = {}) {
  const col = await getCollection(collectionName);
  return col.find(filter, options).toArray();
}

async function insertOne(collectionName, doc) {
  const col = await getCollection(collectionName);
  return col.insertOne(doc);
}

async function updateOne(collectionName, filter, update, options = {}) {
  const col = await getCollection(collectionName);
  return col.updateOne(filter, update, options);
}

async function deleteOne(collectionName, filter) {
  const col = await getCollection(collectionName);
  return col.deleteOne(filter);
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    cachedDb = null;
    logger('MongoDB connection closed', 'debug');
  }
}

module.exports = {
  connect,
  getDb,
  getCollection,
  findOne,
  findMany,
  insertOne,
  updateOne,
  deleteOne,
  close,
};
