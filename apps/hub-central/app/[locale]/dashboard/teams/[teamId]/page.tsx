'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RolesTab } from '../../../../../components/roles/RolesTab'; 
import { teams, users } from '../../../../../lib/apiClient'; 
import { Loader2, X, UserPlus, Trash2 } from 'lucide-react'; // 🟢 Ajout de Trash2

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string; 
  const locale = params?.locale as string;
  
  // States pour les membres du nid
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // State pour TOUS les oiseaux de l'Îlot
  const [allBirds, setAllBirds] = useState<any[]>([]);

  // States pour la Modale d'invitation
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('BATISSEUR');
  const [isInviting, setIsInviting] = useState(false);

  // 📡 Fonction pour charger les membres du nid
  const fetchTeamMembers = async () => {
    if (!teamId) return;
    try {
      setIsLoading(true);
      setError(null);
      const teamData = await teams.getById(teamId) as any; 
      setMembers(teamData.members || []);
    } catch (err: any) {
      console.error("Erreur lors de la récupération de la volée :", err);
      setError("Impossible de contacter le nid. Les vents sont contraires.");
    } finally {
      setIsLoading(false);
    }
  };

  // 📡 Fonction pour charger tous les oiseaux disponibles
  const fetchAllBirds = async () => {
    try {
      const response = await users.getAll() as any;
      let birdArray = [];
      if (Array.isArray(response)) {
        birdArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        birdArray = response.data;
      } else if (response.users && Array.isArray(response.users)) {
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
  }, [teamId]);

  // LOGIQUE DE FILTRAGE
  const availableBirds = allBirds.filter((bird) => {
    return !members.some((member) => member.email === bird.email || member.uid === bird.uid);
  });

  // 💌 L'INVITATION
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || inviteEmail.trim() === '') {
      alert("Veuillez sélectionner un oiseau dans la liste.");
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
      alert(err.message || "Cet oiseau n'a pas pu être trouvé sur l'Îlot.");
    } finally {
      setIsInviting(false);
    }
  };

  // 🚫 LE BANNISSEMENT (Nouvelle fonction)
  const handleRemoveMember = async (e: React.MouseEvent, targetMemberId: string, memberName: string) => {
    e.stopPropagation(); // Évite de sélectionner l'oiseau quand on clique sur la corbeille
    
    if (!confirm(`Voulez-vous vraiment bannir ${memberName} de ce nid ? Le lien dans Neo4j sera détruit.`)) {
      return;
    }

    try {
      await teams.removeMember(teamId, targetMemberId);
      
      // Si l'oiseau banni était celui sélectionné dans le panneau de droite, on vide la sélection
      if (selectedUser && (selectedUser.uid || selectedUser.user?._id || selectedUser.id) === targetMemberId) {
        setSelectedUser(null);
      }
      
      await fetchTeamMembers(); // On met à jour la liste
    } catch (err: any) {
      console.error("Erreur lors du bannissement :", err);
      alert(err.message || "Impossible de bannir cet oiseau.");
    }
  };

  // 💥 LA DISSOLUTION DU NID
  const handleDeleteTeam = async () => {
    if (!confirm("⚠️ ATTENTION ! Voulez-vous vraiment détruire ce nid ? Cette action est irréversible et détruira l'île dans MongoDB et Neo4j.")) {
      return;
    }

    try {
      await teams.delete(teamId);
      // 🟢 On redirige en gardant la langue de l'oiseau
      router.push(`/${locale}/dashboard/teams`);
      router.refresh();
    } catch (err: any) {
      console.error("Erreur lors de la dissolution :", err);
      alert(err.message || "Impossible de détruire ce nid.");
    }
  };
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* 🟢 EN-TÊTE DU NID */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Nid : {teamId}</h1>
          <p className="text-emerald-700/70 mt-2 font-medium">
            Gérez la volée et ajustez les niveaux de pouvoir dans la matrice hybride.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 💥 BOUTON DISSOUDRE */}
          <button 
            onClick={handleDeleteTeam}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all border border-red-200"
            title="Détruire le nid"
          >
            <Trash2 className="w-4 h-4" />
            Dissoudre
          </button>

          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl shadow-inner ml-2">
            🌿
          </div>
        </div>
      </div>

      {/* 🔴 MODALE D'INVITATION AVEC LISTE DÉROULANTE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Accueillir un oiseau</h2>
            <p className="text-slate-500 text-sm mb-6">Sélectionnez un oiseau disponible pour rejoindre l'escouade.</p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Oiseau à inviter</label>
                <select
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors bg-slate-50"
                  required
                >
                  <option value="" disabled>-- Sélectionnez un profil --</option>
                  {availableBirds.length === 0 ? (
                    <option value="" disabled>Aucun oiseau disponible</option>
                  ) : (
                    availableBirds.map((bird) => (
                      <option key={bird._id || bird.uid} value={bird.email}>
                        {bird.username} ({bird.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle initial</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors bg-slate-50"
                >
                  <option value="VISITEUR">Visiteur (Lecture seule)</option>
                  <option value="BATISSEUR">Bâtisseur (Contribution)</option>
                  <option value="ADMIN">Admin (Gestion du nid)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sceller l'invitation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 ZONE DE TRAVAIL (2 Colonnes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : La Liste des Membres */}
        <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold mb-6 text-slate-800">La Volée</h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Scan du Graphe en cours...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium italic">
              Le nid est vide pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => {
                const memberId = member.uid || member.user?._id || member.id || member._id;
                const memberName = member.username || member.user?.username || 'Oiseau inconnu';
                const memberRole = member.role;
                const isSelected = selectedUser && (
                  (selectedUser.uid || selectedUser.user?._id || selectedUser.id) === memberId
                );

                return (
                  <div 
                    key={memberId} 
                    className={`w-full text-left p-2 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {/* Bouton principal pour sélectionner l'oiseau */}
                    <button
                      onClick={() => setSelectedUser(member)}
                      className="flex-grow text-left p-2"
                    >
                      <p className={`font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {memberName}
                      </p>
                      <p className="text-xs text-emerald-600 font-semibold mt-1">{memberRole}</p>
                    </button>

                    {/* 🚫 BOUTON CORBEILLE POUR BANNIR */}
                    <button
                      onClick={(e) => handleRemoveMember(e, memberId, memberName)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Bannir cet oiseau"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLONNE DROITE : Le Panneau de Contrôle (RolesTab) */}
        <div className="col-span-1 lg:col-span-2">
          {selectedUser ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RolesTab
                targetUserId={selectedUser.uid || selectedUser.user?._id || selectedUser.id}
                targetUserEmail={selectedUser.email || selectedUser.user?.email}
                projectId={teamId}
              />
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="text-5xl mb-4 opacity-50 grayscale">🪶</div>
              <p className="text-slate-500 font-medium text-lg">
                Sélectionnez un oiseau pour inspecter et ajuster ses plumes dans la matrice.
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}