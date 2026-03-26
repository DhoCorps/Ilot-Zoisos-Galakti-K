import { NextResponse } from "next/server";
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
    // Note: Plus tard, on ajoutera checkAuth() ici pour vérifier si le gars est bien le OWNER
    await connectToDatabase();
    await TeamOrchestrator.dissolveTeam(params.teamId);
    return NextResponse.json({ success: true, message: "Le nid a été dissous." });
  } catch (error: any) {
    return NextResponse.json({ error: "Impossible de détruire ce nid." }, { status: 500 });
  }
}