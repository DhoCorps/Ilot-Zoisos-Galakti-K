import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectToDatabase, TeamModel } from '@ilot/infrastructure';
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
 * 📖 GET : Récupère tous les nids
 */
export async function GET() {
  try {
    await connectToDatabase();
    const nids = await TeamModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: nids });
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

    // 2. Récupération de l'UID (On ne fait plus confiance au body, on prend la session !)
    const creatorUid = (session.user as any).uid || (session.user as any).id;

    // 3. 🛡️ Inception sous Sceau Transactionnel
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
