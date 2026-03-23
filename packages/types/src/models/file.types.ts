/**
 * 📄 TYPE DE FICHIER (ILOT ZOIZOS)
 * Ce type est la référence universelle pour le Front et le Back.
 */
export interface IlotFile {
  id: string;          // L'identifiant unique (mongoId converti en string)
  name: string;        // Nom d'origine (ex: "plan_du_nid.pdf")
  path: string;        // Chemin relatif sur le serveur (ex: "/uploads/tasks/...")
  size: number;        // Taille en octets
  mimeType: string;    // Type MIME (ex: "application/pdf")
  owner: string;       // UID (ou ID) de l'oiseau qui a uploadé
  entityType: 'project' | 'task' | 'team'; // À quoi est-il rattaché ?
  entityId: string;    // L'UID/ID de l'entité rattachée
  createdAt: string | Date; 
}

/**
 * Version pour la création (quand on n'a pas encore d'ID)
 */
export type CreateFileDTO = Omit<IlotFile, 'id' | 'createdAt'>;