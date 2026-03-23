import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, UserModel } from "@ilot/infrastructure"; 
import { SyncOrchestrator, MoralChecker } from "@ilot/shared-core"; // 👈 On utilise le shared-core
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    // 🛡️ 1. Moral Check (Intégrité de l'identité)
    const analysis = MoralChecker.analyze(username);
    if (!analysis.isSafe) {
      return NextResponse.json({ 
        error: analysis.suggestion || "Ce nom d'oiseau n'est pas autorisé sur l'Îlot." 
      }, { status: 400 });
    }

    await connectToDatabase();

    // 🛡️ 2. Vérification des doublons
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: 'Email ou Username déjà pris' }, { status: 400 });
    }

    // 🛡️ 3. Préparation et Écriture MongoDB
    const hashedPassword = await bcrypt.hash(password, 12);
    const mongoId = new mongoose.Types.ObjectId();

    const newUser = new UserModel({ 
      _id: mongoId,
      uid: mongoId.toHexString(), 
      email: email.toLowerCase(), 
      username, 
      password: hashedPassword,
      role: "BATISSEUR", 
      signature: "<(:<" 
    });
    
    const savedUser = await newUser.save(); 
    console.log("✅ [MongoDB] L'oiseau est niché :", savedUser.uid);

    // 🛡️ 4. Synchronisation via l'Orchestrator (Neo4j)
    // On délègue la complexité à l'orchestrateur pour garder la route propre
    try {
      await SyncOrchestrator.syncUserCreation({ 
        mongodbId: savedUser.uid,
        username: savedUser.username,
        role: savedUser.role // On passe le rôle pour le graphe
      });
      console.log("🔥 [Neo4j] POINT MARQUÉ : Graphe synchronisé.");
    } catch (syncError) {
      // On log mais on ne bloque pas : l'UX reste fluide
      console.error("⚠️ [Sync Engine] Retard de baguage :", syncError);
    }

    return NextResponse.json({ 
      message: "L'oiseau a rejoint l'Îlot !",
      user: { id: savedUser.uid, username: savedUser.username } 
    }, { status: 201 });

  } catch (error) {
    console.error('🔥 [CRASH] Erreur critique sur le terrain :', error);
    return NextResponse.json({ error: 'Erreur serveur critique' }, { status: 500 });
  }
}