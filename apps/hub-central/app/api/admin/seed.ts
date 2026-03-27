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
      nom: "Nid Alpha",
      createur: user._id,
      uid: "alpha-123", // On force les UIDs pour le test
      collectiveHealth: { isOverloaded: false },
      moderation: { isFlagged: false }
    });

    // 3. Injection du Projet Racine (La première Orchidée)
   // ✅ NOUVEL APPEL (Suturé)
const projetRacine = await ProjectOrchestrator.createProject({
  titre: "Projet Racine Fractal",
  slug: "racine-fractale",
  description: "L'origine de la structure",
  statut: "En Cours",
  priority: "medium",
  teamUid: "alpha-123",
  owner: userUid,      // 1. On injecte l'owner ici
  isArchived: false    // 2. On définit la valeur par défaut
}, userUid);

    console.log("✅ Projet Racine injecté :", projetRacine.uid);

    // 4. Injection du Sous-Projet (L'Oridée Vanda suspendue)
    // C'est ici que la récursion opère via la propriété 'parent'
   // ✅ Appel corrigé pour le sous-projet
const sousProjet = await ProjectOrchestrator.createProject({
    titre: "Sous-Projet Suspendu",
    slug: "vanda-suspendue",
    description: "Je dépends de la racine",
    statut: "Planifié",
    priority: "high", // "high" est bien dans l'enum, donc c'est OK
    teamUid: "alpha-123",
    parent: projetRacine.uid,
    
    // 💉 LES DEUX COMPOSANTS MANQUANTS :
    owner: userUid,      // Indispensable : qui a planté cette orchidée ?
    isArchived: false    // Indispensable : le fragment est-il actif ?
    }, userUid);

    console.log("✅ Sous-projet rattaché avec succès :", sousProjet.uid);
    
    return { success: true, message: "Le champ de pommes de terre est devenu une jungle." };

  } catch (error) {
    console.error("💥 L'ensemencement a échoué :", error);
    throw error;
  }
};