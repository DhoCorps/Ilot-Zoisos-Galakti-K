import { NextResponse } from 'next/server';
import { CreateProjectSchema } from '@ilot/types';
import { connectToDatabase, writeToGraph } from '@ilot/infrastructure';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. Récupération et parsing du corps de la requête
    const body = await request.json();

    // 2. Validation stricte de l'ADN avec Zod
    const parsedData = CreateProjectSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "ADN du fragment invalide", details: parsedData.error.format() }, 
        { status: 400 }
      );
    }

    const projectData = parsedData.data;
    
    // Génération de l'UID hybride (Le pivot entre Mongo et Neo4j)
    const projectUid = crypto.randomUUID(); 

    // 🍃 3. ÉCRITURE MONGODB (La base chaude documentaire)
    await connectToDatabase();
    // Ici viendra l'appel à ton modèle Mongoose : 
    // await ProjectModel.create({ ...projectData, uid: projectUid });

    // 🕸️ 4. ÉCRITURE NEO4J (Le correctif du bug d'intégrité)
    // Utilisation de MERGE au lieu de CREATE pour éviter la duplication des nœuds si la route est appelée deux fois.
    const cypherNode = `
      MERGE (p:Project { uid: $uid })
      SET p.title = $title,
          p.status = $status,
          p.priority = $priority,
          p.ownerUid = $ownerUid,
          p.updatedAt = datetime()
      RETURN p
    `;

    const nodeParams = {
      uid: projectUid,
      title: projectData.title,
      status: projectData.status,
      priority: projectData.priority,
      owner: projectData.owner
    };

    // La session s'ouvre et se ferme proprement dans cette fonction (évite le bug de fuite de mémoire)
    await writeToGraph(cypherNode, nodeParams);

    // 🌿 5. GESTION DE LA HIÉRARCHIE (Si le projet a un parent)
    if (projectData.parent) {
      const cypherRelation = `
        MATCH (child:Project { uid: $childUid })
        MATCH (parent:Project { uid: $parentUid })
        MERGE (child)-[:BELONGS_TO]->(parent)
      `;
      await writeToGraph(cypherRelation, { 
        childUid: projectUid, 
        parentUid: projectData.parent 
      });
    }

    // 6. Succès : Les deux cœurs battent à l'unisson
    return NextResponse.json(
      { success: true, uid: projectUid, message: "Fragment synchronisé avec succès." }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🚨 [MUTATION ROUTE ERROR] :", error);
    // Option multilingue anticipée : on renvoie un code d'erreur clair pour que le front le traduise
    return NextResponse.json(
      { error: "SYNC_ENGINE_FAILURE", message: "Échec de l'alignement entre les bases de données." }, 
      { status: 500 }
    );
  }
}