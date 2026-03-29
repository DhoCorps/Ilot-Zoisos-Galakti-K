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
      await teams.invite({
        teamId: teamId,
        email: inviteEmail.trim(),
        role: inviteRole
      });
      
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('BATISSEUR'); 
      await fetchTeamMembers(); 
      
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
    <>

      {/* CONTENEUR PRINCIPAL DE LA PAGE */}
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 relative z-0">
        
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
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold transition-all border border-slate-800 cursor-pointer"
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
                  canManage={selectedUser.role === 'ADMIN' || selectedUser.role === 'BATISSEUR'}
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
      </div>
      {/* FIN DU CONTENEUR PRINCIPAL */}

      {/* MODALES PLACÉES EN DEHORS POUR NE PAS ÊTRE BLOQUÉES */}

      {/* MODALE D'INVITATION INDESTRUCTIBLE */}
      {isInviteModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          backgroundColor: 'rgba(15, 23, 42, 0.95)', /* Gris bleuté sombre */
          zIndex: 2147483647, /* Le z-index maximum autorisé par les navigateurs */
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: 0, padding: '20px' 
        }}>
          
          <div style={{ 
            backgroundColor: '#0f172a', /* Fond Gris bleuté */
            border: '1px solid #7f1d1d', /* Bordure Rouge sombre */
            borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', 
            position: 'relative', boxShadow: '0 0 50px rgba(0,0,0,0.8)' 
          }}>
            
            <button 
              onClick={() => setIsInviteModalOpen(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '24px', letterSpacing: '-0.025em' }}>
              Connecter une Entité
            </h2>
            
            <form onSubmit={handleInvite} className="space-y-5">
              
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Identifiant Cible
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    required
                  >
                    <option value="" disabled style={{ color: '#64748b' }}>-- Scanner le grand troupeau --</option>
                    {availableBirds.length === 0 ? (
                      <option disabled>Tous les oiseaux connus sont déjà dans le nid.</option>
                    ) : (
                      availableBirds.map((bird) => (
                        <option key={bird._id || bird.uid} value={bird.email} style={{ backgroundColor: '#020617', color: '#e2e8f0' }}>
                          {bird.username} ({bird.email})
                        </option>
                      ))
                    )}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>▼</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Niveau d'Accès
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="VISITEUR" style={{ backgroundColor: '#020617', color: '#cbd5e1' }}>Observateur (Lecture seule)</option>
                    <option value="BATISSEUR" style={{ backgroundColor: '#020617', color: '#cbd5e1' }}>Bâtisseur (Modification)</option>
                    <option value="ADMIN" style={{ backgroundColor: '#020617', color: '#f87171', fontWeight: 'bold' }}>Superviseur (Privilèges max)</option>
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>▼</div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isInviting || !inviteEmail} 
                style={{ width: '100%', marginTop: '32px', padding: '12px', background: isInviting || !inviteEmail ? '#334155' : '#e2e8f0', color: isInviting || !inviteEmail ? '#94a3b8' : '#0f172a', borderRadius: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', cursor: isInviting || !inviteEmail ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          style={{ zIndex: 2147483647 }} // 🌟 FIX : On aligne le z-index sur l'autre modale
        >
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
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
