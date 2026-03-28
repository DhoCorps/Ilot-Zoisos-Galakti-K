'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RolesTab } from '../../../../../components/roles/RolesTab'; 
import { teams, users } from '../../../../../lib/apiClient'; 
import { Loader2, X, UserPlus, Trash2, ShieldAlert, Users, LayoutGrid } from 'lucide-react';
import { CreateProjectForm } from '../../../../../components/projects/CreateProjectForm';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string; 
  const locale = params?.locale as string || 'fr';
  
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // 🛡️ FIX : On s'assure que allBirds est toujours un tableau
  const [allBirds, setAllBirds] = useState<any[]>([]);

  // États pour les modales
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // États pour l'invitation de membre
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('BATISSEUR');
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeamMembers = async () => {
    if (!teamId) return;
    try {
      setIsLoading(true);
      setError(null);
      const teamData = await teams.getById(teamId) as any; 
      const freshMembers = teamData.members || [];
      setMembers(freshMembers);
      
      setSelectedUser((prevSelected: any) => {
        if (!prevSelected) return null;
        const updatedBird = freshMembers.find((m: any) => 
          (m.uid || m.id || m._id) === (prevSelected.uid || prevSelected.id || prevSelected._id)
        );
        return updatedBird || prevSelected;
      });

    } catch (err: any) {
      console.error("Erreur lors de la récupération de la volée :", err);
      setError("Erreur de liaison. La matrice est inaccessible.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBirds = async () => {
    try {
      const response = await users.getAll() as any;
      
      // 🛡️ SÉCURITÉ : On gère tous les formats de réponse possibles de ton API
      let birdArray = [];
      if (Array.isArray(response)) {
        birdArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        birdArray = response.data;
      } else if (response?.users && Array.isArray(response.users)) {
        birdArray = response.users;
      }
      
      setAllBirds(birdArray);
    } catch (err) {
      console.error("Erreur lors de la récupération du grand troupeau :", err);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchAllBirds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  console.log("🦅 1. Le Grand Troupeau (API) :", allBirds);
  console.log("🛡️ 2. Membres actuels du nid :", members);

  // 🛡️ FIX : On filtre de manière robuste pour ne proposer que les oiseaux non membres
  const availableBirds = allBirds.filter((bird) => {
    if (!bird || !bird.email) return false;
    return !members.some((member) => member.email === bird.email || member.uid === bird.uid);
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || inviteEmail.trim() === '') {
      alert("Veuillez sélectionner un identifiant valide.");
      return;
    }
    
    try {
      setIsInviting(true);
      // 🛡️ FIX : On s'assure que l'appel API est propre. 
      // Assure-toi que la route /api/teams/[teamId]/members gère le POST !
      await teams.invite({
        teamId: teamId,
        email: inviteEmail.trim(),
        role: inviteRole
      });
      
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('BATISSEUR'); 
      await fetchTeamMembers(); // On rafraîchit la liste pour voir le nouvel oiseau
      
    } catch (err: any) {
      console.error("Erreur d'invitation :", err);
      alert(err.message || "Entité introuvable dans la matrice ou route API manquante.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (e: React.MouseEvent, targetMemberId: string, memberName: string) => {
    e.stopPropagation(); 
    if (!confirm(`Voulez-vous vraiment rompre le lien Neo4j pour ${memberName} ?`)) return;

    try {
      await teams.removeMember(teamId, targetMemberId);
      if (selectedUser && (selectedUser.uid || selectedUser.user?._id || selectedUser.id) === targetMemberId) {
        setSelectedUser(null);
      }
      await fetchTeamMembers(); 
    } catch (err: any) {
      console.error("Erreur lors de la rupture :", err);
      alert(err.message || "Impossible de rompre ce lien.");
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("⚠️ PROTOCOLE DE DESTRUCTION ! Cette action va purger le nœud de MongoDB et Neo4j. Continuer ?")) return;
    try {
      await teams.delete(teamId);
      router.push(`/${locale}/dashboard/teams`);
      router.refresh();
    } catch (err: any) {
      console.error("Erreur lors de la purge :", err);
      alert(err.message || "Impossible de purger ce nœud.");
    }
  };
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER DE LA PAGE */}
      <div className="bio-card flex flex-col md:flex-row items-start md:items-center justify-between p-8 gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-950/10 blur-[80px] rounded-full pointer-events-none -z-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Nœud d'Administration de l'Escouade</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
            ID: <span className="text-red-400 font-mono tracking-normal">{teamId.substring(0,8)}...</span>
          </h1>
          <p className="text-slate-500 mt-2 font-light text-sm max-w-md">
            Supervision des membres et génération de nouveaux fragments opérationnels.
          </p>
        </div>
        
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <button 
            onClick={handleDeleteTeam}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-xl font-medium transition-all border border-slate-800 hover:border-red-900/50 shadow-inner group"
          >
            <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs uppercase tracking-widest">Purger</span>
          </button>

          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold transition-all border border-slate-800"
          >
            <UserPlus className="w-5 h-5 text-red-500" />
            Connecter
          </button>
        </div>
      </div>

      {/* SECTION : CHANTIERS (FRAGMENTS) */}
      <div className="bio-card p-6 border-slate-800/60 relative z-10">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">
              Fragments Assignés
            </h2>
          </div>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-4 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-[10px] font-mono uppercase tracking-widest rounded-lg border border-red-900/30 hover:border-red-500/50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(229,72,77,0.1)]"
          >
            <span className="text-lg leading-none">+</span> Forger un Fragment
          </button>
        </div>
        
        <div className="text-center py-10 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
          <p className="text-slate-600 font-light text-sm italic">
            Cette escouade ne supervise aucun fragment pour le moment.
          </p>
        </div>
      </div>

      {/* GRILLE PRINCIPALE : MEMBRES & RÔLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : LISTE DES MEMBRES */}
        <div className="col-span-1 bio-card p-6 h-fit border-slate-800/60">
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">La Volée</h2>
          </div>
          
          <div className="relative z-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-red-500/50">
                <Loader2 className="w-6 h-6 animate-spin mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-widest">Scan du Graphe...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400/80 text-xs font-mono font-medium">
                {error}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-slate-600 font-light text-sm">
                Aucune entité détectée.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(member => {
                  const memberId = member.uid || member.user?._id || member.id || member._id;
                  const memberName = member.username || member.user?.username || 'Entité inconnue';
                  const memberRole = member.role;
                  const isSelected = selectedUser && (
                    (selectedUser.uid || selectedUser.user?._id || selectedUser.id) === memberId
                  );

                  return (
                    <div 
                      key={memberId} 
                      className={`w-full text-left p-1 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                        isSelected
                          ? 'bg-red-950/20 border-red-900/50 shadow-[0_0_15px_rgba(229,72,77,0.05)]'
                          : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedUser(member)}
                        className="flex-grow text-left p-2.5 rounded-lg"
                      >
                        <p className={`font-medium text-sm tracking-wide ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                          {memberName}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 uppercase tracking-widest ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                          {memberRole}
                        </p>
                      </button>

                      <button
                        onClick={(e) => handleRemoveMember(e, memberId, memberName)}
                        className="p-2.5 mr-1 text-slate-600 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : PANNEAU DES ROLES */}
        <div className="col-span-1 lg:col-span-2">
          {selectedUser ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <RolesTab
                targetUserId={selectedUser.uid || selectedUser.user?._id || selectedUser.id}
                targetUserEmail={selectedUser.email || selectedUser.user?.email}
                projectId={teamId}
                initialRole={selectedUser.role} 
                initialCaps={selectedUser.permissions || []} 
                onSuccess={fetchTeamMembers} 
              />
            </div>
          ) : (
            <div className="bio-card rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px] border-slate-800/40">
              <ShieldAlert className="w-12 h-12 text-slate-700 opacity-30 stroke-[1] mb-6" />
              <p className="text-slate-500 font-light text-sm max-w-xs leading-relaxed relative z-10">
                Sélectionnez une entité dans la liste pour inspecter ses privilèges et analyser sa signature dans la matrice Neo4j.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODALE D'INVITATION DE MEMBRE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bio-card w-full max-w-md relative p-8 border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-5 right-5 text-slate-500 hover:text-red-400 transition-colors bg-slate-900/80 rounded-full p-2">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-6 tracking-tight">Connecter une Entité</h2>
            <form onSubmit={handleInvite} className="space-y-5">
              
              {/* SÉLECTEUR DYNAMIQUE DES OISEAUX */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-widest">Identifiant Cible</label>
                <div className="relative">
                  <select
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm appearance-none cursor-pointer transition-all"
                    required
                  >
                    <option value="" disabled className="text-slate-500">-- Scanner le grand troupeau --</option>
                    {availableBirds.length === 0 ? (
                      <option disabled>Tous les oiseaux connus sont déjà dans le nid.</option>
                    ) : (
                      availableBirds.map((bird) => (
                        <option key={bird._id || bird.uid} value={bird.email} className="bg-[#05070A] text-slate-200">
                          {bird.username} ({bird.email})
                        </option>
                      ))
                    )}
                  </select>
                  {/* Petite icône personnalisée pour le select */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-widest">Niveau d'Accès</label>
                <div className="relative">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm appearance-none cursor-pointer transition-all"
                  >
                    <option value="VISITEUR" className="bg-[#05070A] text-slate-300">Observateur (Lecture seule)</option>
                    <option value="BATISSEUR" className="bg-[#05070A] text-slate-300">Bâtisseur (Modification)</option>
                    <option value="ADMIN" className="bg-[#05070A] text-red-400 font-bold">Superviseur (Privilèges max)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    ▼
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isInviting || !inviteEmail} 
                className="w-full mt-8 py-3 bg-gradient-to-r from-slate-100 to-slate-300 hover:from-white hover:to-slate-200 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suture en cours...
                  </>
                ) : (
                  "Valider l'Injection"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CRÉATION DE PROJET (FRAGMENT) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl no-scrollbar border border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button 
              onClick={() => setIsProjectModalOpen(false)} 
              className="absolute top-6 right-6 z-10 text-slate-500 hover:text-red-400 transition-colors bg-slate-900/80 rounded-full p-2 backdrop-blur-md border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#05070A]">
              <CreateProjectForm 
                teamId={teamId} 
                onSuccess={() => {
                  setIsProjectModalOpen(false);
                  // Optionnel: rafraîchir la liste des chantiers ici
                }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}