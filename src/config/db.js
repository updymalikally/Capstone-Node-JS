import mongoose from 'mongoose';

export const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Atlas connection note: ${error.message}`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[MongoDB] Falling back to MongoMemoryServer for local development/testing...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory instance: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error(`[MongoDB] Memory server error: ${memErr.message}`);
      }
    }

    console.error(`\n⚠️  MongoDB Atlas Connection Failed!`);
    console.error(`👉 Make sure your IP address is whitelisted in MongoDB Atlas Network Access:`);
    console.error(`   1. Go to MongoDB Atlas > Network Access`);
    console.error(`   2. Click 'Add IP Address' > 'Allow Access From Anywhere' (0.0.0.0/0)`);
    console.error(`   3. Wait 1 minute and restart the server.\n`);
    throw error;
  }
};
