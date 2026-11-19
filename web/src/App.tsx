import { FormEvent, useEffect, useState } from "react";

interface DocResume {
  id: number;
  nom: string;
  confidentiel: boolean;
}

interface Reponse {
  reponse: string;
  fournisseur: "ollama" | "anthropic";
  modele: string;
  raison: string;
  sources: string[];
}

export default function App() {
  const [docs, setDocs] = useState<DocResume[]>([]);
  const [nom, setNom] = useState("");
  const [contenu, setContenu] = useState("");
  const [confidentiel, setConfidentiel] = useState(false);

  const [question, setQuestion] = useState("");
  const [tache, setTache] = useState("question");
  const [priorite, setPriorite] = useState("qualite");
  const [resultat, setResultat] = useState<Reponse | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const chargerDocs = () =>
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => setErreur("Impossible de charger les documents"));

  useEffect(() => {
    chargerDocs();
  }, []);

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, contenu, confidentiel }),
    });
    setNom("");
    setContenu("");
    setConfidentiel(false);
    chargerDocs();
  }

  async function demander(e: FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, tache, priorite }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.erreur);
      setResultat(data);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main>
      <h1>Assistant PME</h1>

      <section>
        <h2>Poser une question</h2>
        <form onSubmit={demander}>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Votre question…" required />
          <div className="ligne">
            <label>
              Tâche
              <select value={tache} onChange={(e) => setTache(e.target.value)}>
                <option value="question">Question</option>
                <option value="resume">Résumé</option>
                <option value="analyse">Analyse</option>
              </select>
            </label>
            <label>
              Priorité
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                <option value="qualite">Qualité</option>
                <option value="cout">Coût</option>
              </select>
            </label>
            <button disabled={chargement}>{chargement ? "…" : "Demander"}</button>
          </div>
        </form>
        {erreur && <p className="erreur">{erreur}</p>}
        {resultat && (
          <div className="resultat">
            <p className="badge">
              {resultat.fournisseur === "ollama" ? "Local" : "Cloud"} · {resultat.modele} — {resultat.raison}
            </p>
            <p className="texte">{resultat.reponse}</p>
            {resultat.sources.length > 0 && <small>Sources : {resultat.sources.join(", ")}</small>}
          </div>
        )}
      </section>

      <section>
        <h2>Documents</h2>
        <ul>
          {docs.map((d) => (
            <li key={d.id}>
              {d.nom} {d.confidentiel && <span className="confidentiel">confidentiel</span>}
            </li>
          ))}
        </ul>
        <form onSubmit={ajouter}>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du document" required />
          <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Contenu" required />
          <div className="ligne">
            <label>
              <input type="checkbox" checked={confidentiel} onChange={(e) => setConfidentiel(e.target.checked)} />
              Confidentiel (traité uniquement en local)
            </label>
            <button>Ajouter</button>
          </div>
        </form>
      </section>
    </main>
  );
}
