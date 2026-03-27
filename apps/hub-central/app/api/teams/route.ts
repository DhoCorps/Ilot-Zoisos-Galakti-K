import { NextResponse } from 'next/server';
import { TeamSchema } from '@ilot/types';
import { TeamOrchestrator } from '@ilot/shared-core';

// On utilise Omit pour créer un schéma de validation pour la création
const CreateTeamValidation = TeamSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true // Sera injecté par le serveur
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validation de l'ADN entrant
    const parsedData = CreateTeamValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: "Données du nid invalides", details: parsedData.error.format() }, { status: 400 });
    }

    const teamData = parsedData.data;
    
    // ⚠️ TODO : Remplacer par la vraie session d'authentification NextAuth
    // Pour l'instant on simule la récupération du créateur
    const creatorUid = body.creatorUid; 
    if (!creatorUid) {
      return NextResponse.json({ error: "Signature thermique du créateur (creatorUid) manquante" }, { status: 400 });
    }

    // 2. 🛡️ Inception sous Sceau Transactionnel
    const result = await TeamOrchestrator.fosterTeam({
      name: teamData.name, 
      description: teamData.description,
      parentId: teamData.parentId || undefined,
      creatorUid: creatorUid,
      creatorId: null // Géré en interne par l'orchestrateur
    });

    return NextResponse.json(
      { success: true, uid: result.team.uid, message: "Nid fondé et synchronisé avec succès." }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🚨 [TEAM API ERROR] :", error);
    return NextResponse.json(
      { error: "SYNC_ENGINE_FAILURE", message: error.message || "La matrice a rejeté la fondation du nid." }, 
      { status: 500 }
    );
  }
}