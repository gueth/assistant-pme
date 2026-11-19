# Assistant PME multi-modèles

Application qui répond aux questions d'une PME sur ses documents et **choisit le modèle selon la tâche, le coût et la confidentialité** :

- **Ollama (local)** : données confidentielles ou priorité au coût (gratuit, rien ne sort de la machine).
- **API Anthropic – modèle rapide** (`claude-haiku-5-5`) : questions et résumés courants, peu cher.
- **API Anthropic – modèle avancé** (`claude-sonnet-5-5`) : analyses plus complexes.

Stack : React, TypeScript, Node.js (Express), Supabase, API Anthropic, Ollama.

## Structure

```
assistant-pme/
├── server/            API Node.js + TypeScript
│   └── src/
│       ├── index.ts       routes Express
│       ├── router.ts      choix du modèle (tâche / coût / confidentialité)
│       ├── llm.ts         appels Anthropic et Ollama
│       └── documents.ts   accès Supabase + recherche simple par mots-clés
├── web/               interface React + TypeScript (Vite)
└── supabase/schema.sql  tables `documents` et `questions`
```

## Règles de routage

Définies dans [server/src/router.ts](server/src/router.ts) :

| Condition (dans l'ordre)                          | Modèle choisi            |
|---------------------------------------------------|--------------------------|
| Un document utilisé est marqué confidentiel       | Ollama (local)           |
| Tâche = `analyse`                                 | Claude avancé (Sonnet)   |
| Priorité = `cout`                                 | Ollama (local)           |
| Sinon (question / résumé)                         | Claude rapide (Haiku)    |

La réponse renvoie toujours le modèle utilisé et la raison du choix.

## Installation

### 1. Supabase
Créer un projet Supabase puis exécuter [supabase/schema.sql](supabase/schema.sql) dans l'éditeur SQL.

### 2. Ollama
```bash
ollama pull llama3.2
ollama serve
```

### 3. Serveur
```bash
cd server
cp .env.example .env   # renseigner les clés
npm install
npm run dev            # http://localhost:3001
npm test               # tests du routeur
```

### 4. Interface web
```bash
cd web
npm install
npm run dev            # http://localhost:5173 (proxy /api -> 3001)
```

## API

| Méthode | Route              | Corps                                                        |
|---------|--------------------|--------------------------------------------------------------|
| GET     | `/api/documents`   | –                                                            |
| POST    | `/api/documents`   | `{ nom, contenu, confidentiel }`                             |
| POST    | `/api/questions`   | `{ question, tache: "question"\|"resume"\|"analyse", priorite: "cout"\|"qualite" }` |

Exemple de réponse de `/api/questions` :
```json
{
  "reponse": "...",
  "fournisseur": "ollama",
  "modele": "llama3.2",
  "raison": "Document confidentiel : traitement en local",
  "sources": ["Contrat fournisseur 2026"]
}
```
