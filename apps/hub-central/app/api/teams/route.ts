import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; // 🟢 IMPORTANT : Importation depuis /lib/
import { connectToDatabase } from "@ilot/infrastructure";
import { TeamOrchestrator } from "@ilot/shared-core"; 
import { TeamModel } from "@ilot/infrastructure";
// 🟢 LA NOUVELLE FONCTION GET (Pour lister les nids)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // On vérifie le passeport
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Oiseau non identifié." }, { status: 401 });
    }

    // 🔍 On récupère tous les nids depuis MongoDB
    // (Plus tard, tu pourras filtrer pour ne renvoyer que les nids où l'oiseau est membre)
    const nids = await TeamModel.find({}).lean();

    // On renvoie la donnée bien emballée
    return NextResponse.json({ success: true, data: nids }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [GET TEAMS] Erreur :", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // getServerSession utilise l'objet de config pur
    const session = await getServerSession(authOptions);

    // 🔍 LES MOUCHARDS À AJOUTER ICI :
    console.log("1. LA SESSION EST-ELLE LUE ? ->", session ? "OUI" : "NON");
    console.log("2. QUE CONTIENT LE PASSEPORT ? ->", session?.user);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Oiseau non identifié." }, { status: 401 });
    }

    const body = await req.json();
    const creatorUid = session.user.uid ?? '>:)>';

    const result = await TeamOrchestrator.fosterTeam({
      nom: body.nom,
      description: body.description,
      creatorUid: creatorUid,
      parentUid: body.parentUid 
    });

    return NextResponse.json({ success: true, data: result.team }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [POST TEAM] Erreur :", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}