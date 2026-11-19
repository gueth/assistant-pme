import Anthropic from "@anthropic-ai/sdk";
import type { Choix } from "./router.js";

const SYSTEME =
  "Tu es l'assistant d'une PME. Réponds en français, de façon concise, uniquement à partir des documents fournis. " +
  "Si l'information n'y est pas, dis-le.";

let anthropic: Anthropic | null = null;

async function appelerAnthropic(modele: string, prompt: string): Promise<string> {
  anthropic ??= new Anthropic(); // lit ANTHROPIC_API_KEY
  const message = await anthropic.messages.create({
    model: modele,
    max_tokens: 1024,
    system: SYSTEME,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .filter((bloc) => bloc.type === "text")
    .map((bloc) => bloc.text)
    .join("\n");
}

async function appelerOllama(modele: string, prompt: string): Promise<string> {
  const url = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modele,
      stream: false,
      messages: [
        { role: "system", content: SYSTEME },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama a répondu ${res.status}`);
  const data = (await res.json()) as { message: { content: string } };
  return data.message.content;
}

export function generer(choix: Choix, prompt: string): Promise<string> {
  return choix.fournisseur === "anthropic"
    ? appelerAnthropic(choix.modele, prompt)
    : appelerOllama(choix.modele, prompt);
}
