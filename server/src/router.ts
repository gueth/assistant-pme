export type Tache = "question" | "resume" | "analyse";
export type Priorite = "cout" | "qualite";

export interface Choix {
  fournisseur: "ollama" | "anthropic";
  modele: string;
  raison: string;
}

export interface Modeles {
  ollama: string;
  rapide: string;
  avance: string;
}

/** Choisit le modèle selon la confidentialité, la tâche et le coût. */
export function choisirModele(
  params: { tache: Tache; priorite: Priorite; confidentiel: boolean },
  modeles: Modeles,
): Choix {
  if (params.confidentiel) {
    return { fournisseur: "ollama", modele: modeles.ollama, raison: "Document confidentiel : traitement en local" };
  }
  if (params.tache === "analyse") {
    return { fournisseur: "anthropic", modele: modeles.avance, raison: "Analyse complexe : modèle avancé" };
  }
  if (params.priorite === "cout") {
    return { fournisseur: "ollama", modele: modeles.ollama, raison: "Priorité au coût : modèle local gratuit" };
  }
  return { fournisseur: "anthropic", modele: modeles.rapide, raison: "Tâche courante : modèle cloud rapide et économique" };
}
