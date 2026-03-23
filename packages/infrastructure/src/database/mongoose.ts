import mongoose from 'mongoose';

// 🎯 NOM DE LA BASE UNIQUE : ilotzoizos
const MONGODB_URI = 'mongodb://admin:password1234@127.0.0.1:27017/ilotzoizos?authSource=admin';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * 🍃 Connexion à MongoDB "ilotzoizos"
 */
export async function connectToDatabase(uri?: string) {
  // On utilise l'URI forcée si aucune n'est fournie par l'env
  const targetUri = uri || MONGODB_URI;

  if (!targetUri) {
    throw new Error('ERREUR : Aucune URI MongoDB n’a pu être déterminée.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4 pour Windows
    };

    console.log(`🐘 [MongoDB] Tentative de connexion sur la base : ilotzoizos...`);

    cached.promise = mongoose.connect(targetUri, opts).then(async (m) => {
      try {
        // Vérification réelle du serveur
        await m.connection.db!.admin().ping();
        console.log("✅ [MongoDB] Connexion établie et vérifiée sur 'ilotzoizos'.");
        return m;
      } catch (pingError) {
        console.error("❌ [MongoDB] Le serveur ne répond pas au ping.");
        throw pingError;
      }
    }).catch((err) => {
      console.error("❌ [MongoDB] Échec critique :", err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;