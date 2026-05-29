const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  if (!env.mongoUri) throw new Error('MONGO_URI is not set');
  const conn = await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
  });
  // eslint-disable-next-line no-console
  console.log(`[db] Connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = { connectDB };
