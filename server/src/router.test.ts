import { describe, expect, it } from "vitest";
import { choisirModele } from "./router.js";

const modeles = { ollama: "llama3.2", rapide: "claude-haiku-5-5", avance: "claude-sonnet-5-5" };

describe("choisirModele", () => {
  it("garde les documents confidentiels en local, même pour une analyse", () => {
    const choix = choisirModele({ tache: "analyse", priorite: "qualite", confidentiel: true }, modeles);
    expect(choix.fournisseur).toBe("ollama");
  });

  it("utilise le modèle avancé pour une analyse", () => {
    const choix = choisirModele({ tache: "analyse", priorite: "cout", confidentiel: false }, modeles);
    expect(choix.modele).toBe("claude-sonnet-5-5");
  });

  it("utilise Ollama quand la priorité est le coût", () => {
    const choix = choisirModele({ tache: "question", priorite: "cout", confidentiel: false }, modeles);
    expect(choix.fournisseur).toBe("ollama");
  });

  it("utilise le modèle rapide par défaut", () => {
    const choix = choisirModele({ tache: "resume", priorite: "qualite", confidentiel: false }, modeles);
    expect(choix.modele).toBe("claude-haiku-5-5");
  });
});
