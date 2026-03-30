import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth"; // 👈 Ajuste le chemin si besoin
import { connectToDatabase } from "@ilot/infrastructure";
import { TeamOrchestrator } from "@ilot/shared-core";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { teamId: string } }) {
  try {
    await connectToDatabase();
    const data = await TeamOrchestrator.getTeamDetails(params.teamId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const status = error.message.includes("n'existe pas") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(req: Request, { params }: { params: { teamId: string } }) {
  try {
    // 🛡️ LE VIGILE : Vérification de l'identité
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Accès refusé. Identification requise." }, { status: 401 });
    }

    // 🛡️ LE SCEAU DE FEU : Seuls ADMIN et BATISSEUR peuvent modifier le Nid
    const userRole = await TeamOrchestrator.getMemberRoleByEmail(params.teamId, session.user.email);
    if (userRole !== 'ADMIN' && userRole !== 'BATISSEUR') {
      return NextResponse.json({ error: "🔒 Accréditation insuffisante pour modifier ce nid." }, { status: 403 });
    }

    const body = await req.json();
    await connectToDatabase();
    const updatedTeam = await TeamOrchestrator.mutateTeam(params.teamId, body);
    return NextResponse.json({ success: true, data: updatedTeam });
  } catch (error: any) {
    const status = error.message.includes("invalide") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: { teamId: string } }) {
  try {
    // 🛡️ LE VIGILE : Vérification de l'identité
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Accès refusé. Identification requise." }, { status: 401 });
    }

    // 🛡️ PROTOCOLE DE DESTRUCTION : Seul un ADMIN suprême peut dissoudre un Nid
    const userRole = await TeamOrchestrator.getMemberRoleByEmail(params.teamId, session.user.email);
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: "🔒 Seul l'ADMIN de l'escouade peut initier le protocole de destruction." }, { status: 403 });
    }

    await connectToDatabase();
    await TeamOrchestrator.dissolveTeam(params.teamId);
    return NextResponse.json({ success: true, message: "Le nid a été dissous avec succès." });
  } catch (error: any) {
    return NextResponse.json({ error: "Impossible de détruire ce nid." }, { status: 500 });
  }
}