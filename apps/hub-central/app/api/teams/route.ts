import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; // Vérifie bien le chemin vers tes authOptions
import { connectToDatabase, TeamModel, getNeo4jSession } from '@ilot/infrastructure';
import { TeamSchema } from '@ilot/types';
import { TeamOrchestrator } from '@ilot/shared-core';



// Schéma de validation strict
const CreateTeamValidation = TeamSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  collectiveHealth: true,
  moderation: true
});

/**
 * 📖 GET : Récupère les nids de l'utilisateur connecté
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Session requise." }, { status: 401 });

    const userUid = (session.user as any).uid;
    await connectToDatabase();

    // 🎯 LE RADAR NEO4J (Filtrage par les liens réels)
    const neoSession = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:User {uid: $userUid})-[:MEMBER_OF]->(t:Team)
        RETURN t.uid as teamUid
      `;
      const result = await neoSession.run(cypher, { userUid });
      
      // On extrait la liste des UIDs autorisés
      const authorizedUids = result.records.map(rec => rec.get('teamUid'));

      // Si l'oiseau n'est dans aucun nid, on renvoie une liste vide proprement
      if (authorizedUids.length === 0) return NextResponse.json({ success: true, data: [] });

      // 🕊️ LÉGÈRETÉ : On récupère les détails Mongo uniquement pour ces UIDs
      const nids = await TeamModel.find({ uid: { $in: authorizedUids } })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ success: true, data: nids });
    } finally {
      await neoSession.close();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 🏗️ POST : Forge un nouveau nid (Transactionnel)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Session expirée ou invalide." }, { status: 401 });
    }

    const body = await request.json();

    // 1. Validation Zod
    const parsedData = CreateTeamValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: "ADN du nid invalide", details: parsedData.error.format() }, { status: 400 });
    }

    // 2. Récupération de l'UID de session (Confiance totale)
    const creatorUid = (session.user as any).uid;

    // 3. 🛡️ Inception sous Sceau Transactionnel
    // FosterTeam s'occupe de créer le lien ADMIN dans Neo4j et le document Mongo
    const result = await TeamOrchestrator.fosterTeam({
      name: parsedData.data.name, 
      description: parsedData.data.description,
      parentId: parsedData.data.parentId || undefined,
      creatorUid: creatorUid,
    });

    return NextResponse.json(
      { success: true, uid: result.team.uid, message: "Nid tressé avec succès." }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🚨 [TEAM API ERROR] :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}