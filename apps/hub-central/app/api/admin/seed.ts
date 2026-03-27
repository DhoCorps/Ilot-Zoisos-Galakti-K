import { ProjectOrchestrator } from '@ilot/shared-core';
import { TeamModel, UserModel } from '@ilot/infrastructure';

export const seedFractalGarden = async (userUid: string) => {
  console.log("🌱 Début de l'ensemencement des orchidées...");

  try {
    // 1. Récupération du jardinier (User)
    const user = await UserModel.findOne({ uid: userUid });
    if (!user) throw new Error("Jardinier introuvable dans la base.");

    // 2. Création du Nid Parent (L'Arbre)
    const nidAlpha = await TeamModel.create({
      name: "Nid Alpha",
      createur: user._id,
      uid: "alpha-123", // On force les UIDs pour le test
      collectiveHealth: { isOverloaded: false },
      moderation: { isFlagged: false }
    });

    // 3. Injection du Projet Racine (La première Orchidée)
   // ✅ NOUVEL APPEL (Suturé)
  const projetRacine = await ProjectOrchestrator.createProject({
    title: "Projet Racine Fractal",
    slug: "projet-racine",
    description: "Ceci est la graine du monde.",
    status: "IN_PROGRESS", // 👈 Traduit
    priority: "MEDIUM",
    teamId: nidAlpha.uid,
    ownerId: userUid, // 👈 Traduit (au lieu de owner)
    isArchived: false,
    wellbeing: { globalStressLevel: 0, isAtReducedSpeed: false } // 👈 Ajouté
  }, userUid);

  const sousProjet = await ProjectOrchestrator.createProject({
    title: "Sous-Projet Suspendu",
    slug: "sous-projet",
    description: "Un fragment en attente.",
    status: "PLANNED", // 👈 Traduit
    priority: "HARD",
    teamId: nidAlpha.uid,
    parentId: projetRacine.uid, // 👈 Traduit (au lieu de parent)
    ownerId: userUid, // 👈 Traduit
    isArchived: false,
    wellbeing: { globalStressLevel: 0, isAtReducedSpeed: false } // 👈 Ajouté
  }, userUid);
    console.log("✅ Sous-projet rattaché avec succès :", sousProjet.uid);
    
    return { success: true, message: "Le champ de pommes de terre est devenu une jungle." };

  } catch (error) {
    console.error("💥 L'ensemencement a échoué :", error);
    throw error;
  }
};