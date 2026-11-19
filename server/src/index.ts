import "dotenv/config";
import cors from "cors";
import express from "express";
import { ajouterDocument, documentsPertinents, enregistrerQuestion, listerDocuments } from "./documents.js";
import { generer } from "./llm.js";
import { choisirModele, type Priorite, type Tache } from "./router.js";

const modeles = {
  ollama: process.env.OLLAMA_MODEL ?? "llama3.2",
  rapide: process.env.ANTHROPIC_MODEL_RAPIDE ?? "claude-haiku-5-5",
  avance: process.env.ANTHROPIC_MODEL_AVANCE ?? "claude-sonnet-5-5",
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/documents", async (_req, res, next) => {
  try {
    const docs = await listerDocuments();
    res.json(docs.map(({ id, nom, confidentiel }) => ({ id, nom, confidentiel })));
  } catch (e) {
    next(e);
  }
});

app.post("/api/documents", async (req, res, next) => {
  try {
    const { nom, contenu, confidentiel } = req.body ?? {};
    if (!nom || !contenu) return res.status(400).json({ erreur: "nom et contenu sont requis" });
    const doc = await ajouterDocument({ nom, contenu, confidentiel: Boolean(confidentiel) });
    res.status(201).json({ id: doc.id, nom: doc.nom, confidentiel: doc.confidentiel });
  } catch (e) {
    next(e);
  }
});

app.post("/api/questions", async (req, res, next) => {
  try {
    const question: string = req.body?.question ?? "";
    const tache: Tache = ["question", "resume", "analyse"].includes(req.body?.tache) ? req.body.tache : "question";
    const priorite: Priorite = req.body?.priorite === "cout" ? "cout" : "qualite";
    if (!question.trim()) return res.status(400).json({ erreur: "question requise" });

    const sources = documentsPertinents(question, await listerDocuments());
    const confidentiel = sources.some((d) => d.confidentiel);
    const choix = choisirModele({ tache, priorite, confidentiel }, modeles);

    const contexte = sources.map((d) => `### ${d.nom}\n${d.contenu}`).join("\n\n") || "(aucun document trouvé)";
    const prompt = `Tâche : ${tache}\n\nDocuments :\n${contexte}\n\nQuestion : ${question}`;
    const reponse = await generer(choix, prompt);

    await enregistrerQuestion({ question, reponse, fournisseur: choix.fournisseur, modele: choix.modele });
    res.json({ reponse, ...choix, sources: sources.map((d) => d.nom) });
  } catch (e) {
    next(e);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ erreur: err instanceof Error ? err.message : "Erreur serveur" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API sur http://localhost:${port}`));
