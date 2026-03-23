import { NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@ilot/infrastructure";

// ⚠️ Crucial : On force Next.js à requêter la base à chaque fois, 
// sinon il risque de garder en cache une liste vide générée lors du build.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // On ne récupère QUE l'uid et le username, triés par ordre alphabétique
    const birds = await UserModel.find({}, 'uid username').sort({ username: 1 }).lean();
    
    return NextResponse.json({ success: true, data: birds }, { status: 200 });
  } catch (error) {
    console.error("❌ [GET USERS] Erreur :", error);
    return NextResponse.json({ error: "Impossible de scanner les oiseaux." }, { status: 500 });
  }
}