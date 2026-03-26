import { ITeam, IUser, ITask, IProject, IStatus } from "@ilot/types";  

const BASE_URL = '/api';

/**
 * 🌀 TYPE DE RÉPONSE UNIFIÉ
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * ⚡ LE SOUFFLE DE ZONZON (apiFetch)
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', 
    headers: { 
      // Si c'est un fichier (FormData), le navigateur gère le Content-Type
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  // Gestion des réponses sans corps (ex: DELETE ou 204)
  if (res.status === 204) return {} as T;

  const responseData = await res.json().catch(() => ({})) as ApiResponse<T>;
  
  if (!res.ok) {
    // 🟢 Amélioration : on capte .error ET .message
    const errorMessage = responseData.error || responseData.message || `L'oiseau s'est cogné contre la vitre: ${res.status}`;
    console.error(`🚨 Perturbation sur ${endpoint}:`, errorMessage);
    throw new Error(errorMessage);
  }

  // Si l'API renvoie un objet enveloppé dans "data", on l'extrait, sinon on renvoie tout
  return (responseData.data !== undefined ? responseData.data : responseData) as T;
}

/**
 * 🔑 MODULE : FORGE DES ACCÈS (Auth)
 */
export const auth = {
  // L'inscription passe par notre API custom
  register: (data: Partial<IUser>) => 
    apiFetch<IUser>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  // 🛑 ATTENTION : Ne pas utiliser apiFetch pour Login / Logout !
  // Utilise `signIn('credentials', {...})` et `signOut()` de 'next-auth/react' 
  // dans tes composants Front-End.
};

/**
 * 👤 MODULE : LE PLUMAGE (Users)
 */
export const user = {
  getMe: () => apiFetch<IUser>('/user/me'),
  
  updateProfile: (data: Partial<IUser>) => 
    apiFetch<IUser>('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  getLineage: () => apiFetch<any>('/user/lineage'),
};

/**
 * 🌿 MODULE : LES FRAGMENTS (Projets)
 */
export const projects = {
  getAll: () => apiFetch<IProject[]>('/projects'),
  getById: (uid: string) => apiFetch<IProject>(`/projects/${uid}`),
  create: (data: Partial<IProject>) => 
    apiFetch<IProject>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (uid: string, data: Partial<IProject>) => 
    apiFetch<IProject>(`/projects/${uid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (uid: string) => apiFetch<void>(`/projects/${uid}`, { method: 'DELETE' }),
  getStatuses: () => apiFetch<IStatus[]>('/projects/statuses/all'),
};

/**
 * 🍂 MODULE : LES BRINDILLES (Tasks)
 */
export const tasks = {
  getAll: (projectUid?: string) => 
    apiFetch<ITask[]>(`/tasks${projectUid ? `?projectUid=${projectUid}` : ''}`),
  getById: (uid: string) => apiFetch<ITask>(`/tasks/${uid}`),
  create: (data: Partial<ITask>) => 
    apiFetch<ITask>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (uid: string, data: Partial<ITask>) => 
    apiFetch<ITask>(`/tasks/${uid}`, { method: 'PUT', body: JSON.stringify(data) }),
  burn: (uid: string) => apiFetch<void>(`/tasks/${uid}`, { method: 'DELETE' }),
};

/**
 * 🛡️ MODULE : LE LIVRE DES SORTILÈGES (Rôles & Permissions)
 */
export const roles = {
  getAllRoles: () => apiFetch<any[]>('/roles'),
  createRole: (data: { intitule: string; description?: string; status?: string }) => 
    apiFetch<any>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  getAllPermissions: () => apiFetch<any[]>('/roles/permissions'),
  createPermission: (data: { intitule: string; code: string; description?: string }) => 
    apiFetch<any>('/roles/permissions', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * 🏘️ MODULE : LES NIDS (Teams)
 */
export const teams = {
  getAll: () => apiFetch<ITeam[]>('/teams'),
  getById: (teamUid: string) => apiFetch<ITeam>(`/teams/${teamUid}`),
  create: (data: { nom: string; description?: string; parentUid?: string }) => 
    apiFetch<ITeam>('/teams', { method: 'POST', body: JSON.stringify(data) }),
  update: (teamUid: string, data: { nom?: string; description?: string }) => 
    apiFetch<ITeam>(`/teams/${teamUid}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (teamUid: string) => apiFetch<void>(`/teams/${teamUid}`, { method: 'DELETE' }),
  
  getChirps: (teamUid: string) => apiFetch<any[]>(`/teams/${teamUid}/chirps`),
  sendChirp: (teamUid: string, content: string) => 
    apiFetch<any>(`/teams/${teamUid}/chirps`, { method: 'POST', body: JSON.stringify({ content }) }),
  removeMember: (teamUid: string, userUid: string) => 
    apiFetch<void>(`/teams/${teamUid}/members/${userUid}`, { method: 'DELETE' }),
  invite: (data: { teamId: string; email: string; role: string; permissions?: string[] }) => 
    apiFetch<any>('/teams/invite', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * ☁️ MODULE : LE CIERGE (Storage/Upload)
 */
export const storage = {
  upload: async (file: File, entityType: 'project' | 'task' | 'team', entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    return apiFetch<{ url: string; fileId: string }>('/storage/upload', { 
      method: 'POST', 
      body: formData 
    });
  }
};

/**
 * 🧪 MODULE : LABORATOIRE DE ZONZON
 */
export const lab = {
  getNestLoad: (teamUid: string) => apiFetch<{ load: number; alerts: string[] }>(`/lab/nest-load/${teamUid}`),
  getIslandWeather: () => apiFetch<{ weather: string; temp: number; trend: 'up' | 'down' }>('/lab/weather'),
  predictSuccess: (projectUid: string) => apiFetch<{ probability: number; factors: string[] }>(`/lab/predict/${projectUid}`),
};

/**
 * 🦅 MODULE : LE TROUPEAU (Tous les utilisateurs)
 */
export const users = {
  getAll: () => apiFetch<any[]>('/users'),
};