import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; 
import { connectToDatabase, TeamModel, UserModel } from "@ilot/infrastructure";
import { TeamOrchestrator } from "@ilot/shared-core"; 

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Oiseau non identifié." }, { status: 401 });
    }

    // On récupère les nids. 
    // ASTUCE : On peut filtrer par createur ou par membre via l'orchestrateur plus tard.
    const nids = await TeamModel.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: nids }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    // Diagnostic de session
    if (!session || !session.user) {
      console.error("❌ Tentative de forge sans session valide.");
      return NextResponse.json({ error: "Votre signature thermique est introuvable. Reconnectez-vous." }, { status: 401 });
    }

    const body = await req.json();

    // 🛡️ SÉCURITÉ : Récupération de l'ID MongoDB de l'utilisateur
    // Next-auth stocke souvent l'email ou le UID (chaîne), mais Mongo veut l'ID technique.
    const userDoc = await UserModel.findOne({ 
      $or: [{ uid: session.user.uid }, { email: session.user.email }] 
    }).select('_id uid').lean();

    if (!userDoc) {
      return NextResponse.json({ error: "Entité créatrice introuvable dans la base." }, { status: 404 });
    }

    console.log(`🏗️ Forgeron en action : ${userDoc.uid} pour le nid : ${body.name}`);

    /**
     * 🌀 APPEL À L'ORCHESTRATEUR
     * FosterTeam doit gérer :
     * 1. TeamModel.create (MongoDB)
     * 2. session.run("CREATE (t:Team {uid: ...})") (Neo4j)
     * 3. session.run("MATCH (u:User),(t:Team) CREATE (u)-[:ADMIN]->(t)") (Relation)
     */
    const result = await TeamOrchestrator.fosterTeam({
      name: body.name,
      description: body.description,
      creatorUid: userDoc.uid,      // UID pour Neo4j
      creatorId: userDoc._id,       // _id pour MongoDB (très important !)
      parentUid: body.parentUid || null,
      settings: body.settings || { isPrivate: false, allowSearch: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Nid forgé avec succès dans la matrice hybride.",
      data: result.team 
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [POST TEAM] Échec de l'injection :", error.message);
    
    // Gestion spécifique des doublons (Nom déjà pris)
    if (error.code === 11000) {
      return NextResponse.json({ error: "Ce nom de nid est déjà réservé dans la matrice." }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}