"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types rapides pour nos listes
interface Bird { uid: string; username: string; }
interface Team { uid: string; nom: string; }

export default function CreateTeamPage() {
  const router = useRouter();
  
  // États du formulaire
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [creatorUid, setCreatorUid] = useState(""); 
  const [parentUid, setParentUid] = useState(""); 
  const [inviteUid, setInviteUid] = useState("");
  const [inviteRole, setInviteRole] = useState("BUILDER");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // NOUVEAU : États pour stocker nos listes dynamiques
  const [availableBirds, setAvailableBirds] = useState<Bird[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // NOUVEAU : Récupération des données au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // On lance les deux requêtes en parallèle pour aller plus vite
        const [birdsRes, teamsRes] = await Promise.all([
          fetch("/api/users"), // Route à créer
          fetch("/api/teams")  // GET à ajouter
        ]);

        if (birdsRes.ok && teamsRes.ok) {
          const birdsData = await birdsRes.json();
          const teamsData = await teamsRes.json();
          setAvailableBirds(birdsData.data || []);
          setAvailableTeams(teamsData.data || []);
          
          // Pré-sélectionner le premier oiseau comme leader par défaut pour le test
          if (birdsData.data?.length > 0) setCreatorUid(birdsData.data[0].uid);
        }
      } catch (error) {
        console.error("Erreur de chargement des données de l'Îlot", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (Ton code handleSubmit actuel reste strictement identique)
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const members = inviteUid ? [{ uid: inviteUid, role: inviteRole }] : [];

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nom, 
          description, 
          creatorUid,
          parentUid: parentUid || undefined, 
          members 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`✨ Escouade "${data.data.nom}" créée avec succès !`);
        // On vide les champs pour en recréer une autre
        setNom("");
        setDescription("");
      } else {
        throw new Error(data.error || "Erreur lors de l'inception.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (isLoadingData) {
    return <div className="min-h-screen flex justify-center items-center text-emerald-500">Scan de l'Îlot en cours...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="nexus-card w-full max-w-xl space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-black text-emerald-500 uppercase tracking-tighter">L'Inception</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (Champs Nom et Description identiques) ... */}
          <div className="space-y-4 border-b border-slate-800 pb-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom de l'escouade</label>
              <input type="text" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
              <textarea rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {/* --- MENU DÉROULANT : ÉQUIPES --- */}
          <div className="space-y-4 border-b border-slate-800 pb-6">
            <label className="block text-xs font-bold uppercase text-amber-500 mb-1">Sous-équipe de ? (Optionnel)</label>
            <select 
              className="w-full bg-amber-950/20 border border-amber-900/50 rounded-lg p-3 text-amber-400 focus:border-amber-500 outline-none"
              value={parentUid} 
              onChange={(e) => setParentUid(e.target.value)}
            >
              <option value="">-- Aucune (Escouade Racine) --</option>
              {availableTeams.map(team => (
                <option key={team.uid} value={team.uid}>{team.nom}</option>
              ))}
            </select>
          </div>

          {/* --- MENU DÉROULANT : INVITATIONS --- */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300">Inviter un oiseau (Optionnel)</h3>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none"
                value={inviteUid} 
                onChange={(e) => setInviteUid(e.target.value)}
              >
                <option value="">-- Sélectionner un oiseau --</option>
                {availableBirds.map(bird => (
                  <option key={bird.uid} value={bird.uid}>{bird.username}</option>
                ))}
              </select>

              <select className="bg-slate-900 border border-slate-800 text-emerald-400 rounded-lg p-2 text-sm outline-none font-bold" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="ADMIN">Admin</option>
                <option value="MODERATOR">Modérateur</option>
                <option value="BUILDER">Bâtisseur</option>
                <option value="SPECTATOR">Spectateur</option>
              </select>
            </div>
          </div>

          {/* --- MENU DÉROULANT : LEADER (TEST) --- */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg">
            <label className="block text-xs font-bold uppercase text-cyan-600 mb-1">Oiseau Leader (Test)</label>
            <select 
              required
              className="w-full bg-transparent border-b border-cyan-900/50 text-cyan-400 p-1 text-sm outline-none focus:border-cyan-500"
              value={creatorUid} 
              onChange={(e) => setCreatorUid(e.target.value)}
            >
              {availableBirds.map(bird => (
                <option key={bird.uid} value={bird.uid}>{bird.username}</option>
              ))}
            </select>
          </div>

          {/* ... (Affichage des messages d'erreur et bouton submit identiques) ... */}
          {message && (
            <div className={`p-4 rounded-lg border text-sm font-medium ${status === "error" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"}`}>
              {message}
            </div>
          )}
          <button type="submit" disabled={status === "loading"} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {status === "loading" ? "Forgeage en cours..." : "Créer et Assigner les Rôles"}
          </button>
        </form>
      </div>
    </div>
  );
}