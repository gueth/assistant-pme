import { createClient } from "@supabase/supabase-js";

export interface Document {
  id: number;
  nom: string;
  contenu: string;
  confidentiel: boolean;
}

const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

export async function listerDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, nom, contenu, confidentiel")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function ajouterDocument(doc: Omit<Document, "id">): Promise<Document> {
  const { data, error } = await supabase.from("documents").insert(doc).select().single();
  if (error) throw error;
  return data;
}

export async function enregistrerQuestion(q: {
  question: string;
  reponse: string;
  fournisseur: string;
  modele: string;
}): Promise<void> {
  const { error } = await supabase.from("questions").insert(q);
  if (error) throw error;
}

/** Recherche simple : garde les documents qui partagent le plus de mots avec la question. */
export function documentsPertinents(question: string, docs: Document[], max = 3): Document[] {
  const mots = question
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((m) => m.length > 3);

  return docs
    .map((doc) => {
      const texte = `${doc.nom} ${doc.contenu}`.toLowerCase();
      return { doc, score: mots.filter((m) => texte.includes(m)).length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((r) => r.doc);
}
