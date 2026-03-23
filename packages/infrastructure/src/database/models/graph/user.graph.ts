// packages/infrastructure/src/database/models/graph/user.graph.ts
import { getNeo4jSession } from '../../neo4j'; // Ton utilitaire de session

export const baguerOiseau = async (user: { 
  mongodbId: string; 
  username: string; 
  role: string 
}) => {
  const session = getNeo4jSession();
  
  const cypher = `
    MERGE (u:Oiseau { mongodbId: $mongodbId })
    ON CREATE SET 
      u.username = $username,
      u.role = $role,
      u.dateArrivee = datetime(),
      u.statut = 'Libre'
    RETURN u
  `;

  try {
    const result = await session.run(cypher, user);
    console.log(`✨ [Neo4j] L'oiseau ${user.username} est bagué dans le graphe.`);
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
};