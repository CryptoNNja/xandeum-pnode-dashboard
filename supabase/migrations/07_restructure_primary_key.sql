-- Migration: Restructure primary key to support registry-only nodes
-- Date: 2026-01-16
-- Purpose: Change PRIMARY KEY from ip to id, make ip nullable

-- Étape 1: Ajouter une colonne id auto-incrémentée
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS id BIGSERIAL;

-- Étape 2: Supprimer la contrainte FOREIGN KEY dans pnode_history
ALTER TABLE pnode_history DROP CONSTRAINT IF EXISTS pnode_history_ip_fkey;

-- Étape 3: Supprimer l'ancienne contrainte PRIMARY KEY sur ip (avec CASCADE)
ALTER TABLE pnodes DROP CONSTRAINT IF EXISTS pnodes_pkey CASCADE;

-- Étape 4: Définir id comme nouvelle PRIMARY KEY
ALTER TABLE pnodes ADD PRIMARY KEY (id);

-- Étape 5: Rendre ip nullable
ALTER TABLE pnodes ALTER COLUMN ip DROP NOT NULL;

-- Étape 6: Créer un index unique sur ip (pour les nodes avec IP)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pnodes_ip_unique ON pnodes(ip) WHERE ip IS NOT NULL;

-- Étape 7: Index sur pnode_history.ip pour les performances
CREATE INDEX IF NOT EXISTS idx_pnode_history_ip ON pnode_history(ip);

-- Étape 8: Ajouter la contrainte pour assurer au moins un identifiant
ALTER TABLE pnodes ADD CONSTRAINT chk_pubkey_or_ip 
  CHECK (pubkey IS NOT NULL OR ip IS NOT NULL);

COMMENT ON COLUMN pnodes.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN pnodes.ip IS 'Node IP address - nullable for registry-only nodes';
