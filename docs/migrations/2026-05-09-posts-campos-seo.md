# Migration — Campos SEO em `posts`

## Data
2026-05-09

## Objetivo

Adicionar campos opcionais para suportar a auditoria SEO automatizada e os bots `seo-reviewer` e `cannibalization-detector` (Lote C da revisão SEO).

## SQL aplicado

O `ensurePostsTable()` em [src/lib/db.ts](../../src/lib/db.ts) já roda esses `ALTER TABLE ... IF NOT EXISTS` em qualquer chamada de leitura/escrita do admin. Mesmo assim, **rode manualmente** no Neon SQL Editor (`https://console.neon.tech` → seu projeto → SQL Editor) para garantir paridade entre branches/preview/prod sem depender do cold-start:

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title           TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description     TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS keyword_principal    TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords_secundarias TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image_url         TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_alt            TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS revised_at           TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_keyword_principal
  ON posts(keyword_principal)
  WHERE keyword_principal IS NOT NULL;
```

## Campos e usos

| Campo | Tipo | Default | Uso |
|-------|------|---------|-----|
| `meta_title` | TEXT | NULL | `<title>` da página do post (até 60 chars). Fallback: `titulo`. |
| `meta_description` | TEXT | NULL | `<meta name="description">` (120–160 chars). Fallback: `resumo`. |
| `keyword_principal` | TEXT | NULL | Keyword foco. Auditada pelo `seo-reviewer` e usada pelo `cannibalization-detector`. |
| `keywords_secundarias` | TEXT[] | `{}` | Cauda longa relacionada. Lembrete editorial para o redator. |
| `canonical_url` | TEXT | NULL | Override do canonical (útil quando o conteúdo replica outro post). |
| `og_image_url` | TEXT | NULL | Override da imagem OG (default usa `capa_url`). |
| `cover_alt` | TEXT | NULL | Alt text dedicado da capa (acessibilidade + SEO). |
| `noindex` | BOOLEAN | `false` | Quando `true`, o post sai da indexação via `<meta robots noindex>`. |
| `revised_at` | TIMESTAMPTZ | NULL | Marca de revisão de conteúdo. Atualizada quando o post é re-publicado a partir do admin. |

## Reversão (se necessário)

```sql
DROP INDEX IF EXISTS idx_posts_keyword_principal;
ALTER TABLE posts DROP COLUMN IF EXISTS revised_at;
ALTER TABLE posts DROP COLUMN IF EXISTS noindex;
ALTER TABLE posts DROP COLUMN IF EXISTS cover_alt;
ALTER TABLE posts DROP COLUMN IF EXISTS og_image_url;
ALTER TABLE posts DROP COLUMN IF EXISTS canonical_url;
ALTER TABLE posts DROP COLUMN IF EXISTS keywords_secundarias;
ALTER TABLE posts DROP COLUMN IF EXISTS keyword_principal;
ALTER TABLE posts DROP COLUMN IF EXISTS meta_description;
ALTER TABLE posts DROP COLUMN IF EXISTS meta_title;
```

> ⚠️ Reversão é destrutiva — descarta dados editoriais. Confirme com backup antes de rodar.
