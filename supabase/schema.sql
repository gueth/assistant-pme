-- Documents de la PME
create table if not exists documents (
  id bigint generated always as identity primary key,
  nom text not null,
  contenu text not null,
  confidentiel boolean not null default false,
  created_at timestamptz not null default now()
);

-- Historique des questions (utile pour suivre les coûts par modèle)
create table if not exists questions (
  id bigint generated always as identity primary key,
  question text not null,
  reponse text not null,
  fournisseur text not null,
  modele text not null,
  created_at timestamptz not null default now()
);

-- Le serveur utilise la clé service_role : on active RLS sans politique publique
alter table documents enable row level security;
alter table questions enable row level security;
