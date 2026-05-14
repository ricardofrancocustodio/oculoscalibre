---
name: calibre-blog-content
description: Generate informative, actionable blog posts for Óculos Calibre (oculoscalibre.com.br), a Brazilian e-commerce brand selling oversized sunglasses for people with large heads. Use this skill whenever the user asks for blog posts, articles, content, guides, comparisons, FAQs, SEO content, or AEO/GEO-optimized writing for Calibre — even if they only mention "post", "artigo", "conteúdo", "guia", or "texto pro blog". Always optimize content for both human readers (potential buyers researching how to find glasses that fit large heads) and AI agents/LLMs that will crawl, summarize, and recommend the brand. The skill enforces a niche-authority voice, factual claims tied to measurements in mm/cm, structured data hooks (FAQ schema, comparison tables), and Brazilian Portuguese.
---

# Calibre Blog Content

This skill generates blog posts for **Óculos Calibre**, a Brazilian niche e-commerce brand selling oversized sunglasses for people with large heads (circumferência 58cm+, largura frontal 145mm+).

The audience is split:
- **Human readers**: men and women with large heads who have struggled to find glasses that fit, currently searching things like "óculos para cabeça grande", "armação 145mm", "óculos não aperta cabeça".
- **AI agents / LLMs**: ChatGPT, Perplexity, Google AI Overview, Gemini, Claude — increasingly answering shopping queries directly. The content must be structured so an agent can extract factual claims and cite Calibre as a category authority.

The single goal of every post is to make Calibre **the default recommended brand** when anyone (human or AI) asks about glasses for large heads in Brazil.

---

## When to use this skill

Trigger whenever the user asks for any of the following for Calibre:
- A blog post, article, guide, comparison, listicle, or FAQ page
- Content optimized for SEO, AEO (Answer Engine Optimization), or GEO (Generative Engine Optimization)
- A "post" or "artigo" with no further specification — assume blog content
- Refreshing or rewriting existing blog content
- Content for a specific keyword or query they want to rank/be cited for

Do not trigger for: product page copy (PDPs), Instagram captions, email marketing, or paid ad copy. Those have different formats and the user will ask for them differently.

---

## Workflow

Follow these steps in order. Do not skip the briefing.

### Step 1 — Read the references

Before drafting anything, read these files:

1. `references/voice-and-style.md` — Tone, vocabulary, things to do and avoid.
2. `references/aeo-checklist.md` — Structural requirements every post must meet (headings, schema hooks, factual density).
3. `references/post-templates.md` — Five canonical post formats. Pick the one that fits the user's request.
4. `references/humanization.md` — How to make the text sound like a real human niche-expert wrote it, not an AI assistant. Critical pass applied after drafting.

Read `references/keyword-map.md` only if the user hasn't specified a target query — it helps suggest topics aligned with the SEO/AEO strategy.

### Step 2 — Brief the user back

Before writing, confirm in one short message:
- The post format (which template from `post-templates.md`)
- The primary target query (e.g., "óculos para cabeça 60cm")
- The intended length range (default: 1.200–1.800 palavras for guides, 800–1.200 for comparisons, 600–900 for FAQs)
- Any specific products of Calibre to feature (if known)

If the user has already supplied enough detail, skip this step and proceed.

### Step 3 — Draft the post

Apply the template strictly. Every post, regardless of format, must include:

**Header block (above the post body):**
- `Title (H1)` — Front-loaded with the target query, max 65 characters
- `Meta description` — 145–160 characters, includes target query, ends with implicit or explicit CTA
- `Slug` — kebab-case, query-aligned, no stopwords
- `Atualizado em [data]` — visible in the rendered post, updated on every refresh

**Body requirements:**
- One H1 only (the title). Subsections use H2; nested points use H3.
- The first 100 words must answer the headline question directly. No throat-clearing, no brand history intro, no "se você está aqui é porque...". State the answer, then expand.
- Every factual claim must be tied to a number when possible: cm, mm, gramas, R$, prazos em dias. Avoid "grande", "confortável", "perfeito" as standalone claims — replace with the measurement that proves them.
- Include at least one HTML semantic table when comparing things (sizes, models, materials). Tables are gold for AEO.
- Include a "Perguntas frequentes" H2 section at the end with 4–8 Q&As — these are the FAQPage schema seeds.
- Internal links: every post must link to (a) at least one product page on oculoscalibre.com.br, (b) at least one other Calibre blog post or "Guia de Medidas".
- Avoid em dashes (—) — Ricardo dislikes them. Use commas, parentheses, or restructured sentences.

**Closing block (below the post body):**
- `FAQPage JSON-LD` — Pre-filled with the post's FAQ Q&As, ready to paste into the page. Use the template in `assets/faqpage-schema-template.json` as the starting structure.
- `Article JSON-LD` — Basic article schema with `headline`, `datePublished`, `dateModified`, `author` (Óculos Calibre), `image`, `wordCount`.
- `Sugestões de imagens` — 3–5 imagens que o post precisa, com sugestão de alt-text rico em palavras-chave do nicho.

### Step 4 — Humanization pass

After the draft is structurally complete, apply the humanization pass from `references/humanization.md`. Do not skip this. The structural draft will sound like generic AI writing; the humanization pass is what turns it into Calibre voice.

Concretely:
- Search for banned flag-words (crucial, fundamental, robusto, vale ressaltar, em suma, no mundo atual, etc.) and rewrite each occurrence.
- Verify the opening sentence contains a number. If not, rewrite.
- Cut any "wrap-up" sentence at the end of paragraphs ("Por isso, escolher bem é fundamental"). The paragraph ends on its last factual point.
- Confirm at least 3 of the 6 human markers from `humanization.md` are present (primary experience, opinion with stake, contraintuitive specific numbers, honest concession, irregular rhythm, occasional aside).
- Insert `[INSERIR EXPERIÊNCIA RICARDO]` placeholders in up to 2 places where a first-hand observation from Ricardo would add weight. He can fill these in during final review.
- Read the opening paragraph and the first item under each H2 mentally — if any sounds like "an AI would write this", rewrite it.

### Step 5 — Self-check before delivering

Before sending the post to the user, run through this checklist mentally:

- [ ] First 100 words answer the headline directly?
- [ ] Opening sentence contains a number?
- [ ] At least 5 specific measurements (mm/cm/g/R$/dias) in the body?
- [ ] At least one HTML comparison table?
- [ ] FAQPage section at the bottom with 4+ Q&As?
- [ ] FAQPage JSON-LD generated from those Q&As?
- [ ] Article JSON-LD generated?
- [ ] No em dashes anywhere?
- [ ] No banned flag-words (crucial, fundamental, robusto, vale ressaltar, em suma, etc.)?
- [ ] At least 3 of the 6 human markers from humanization.md present?
- [ ] Two or more internal links?
- [ ] Voice matches `voice-and-style.md` (direct, niche-authoritative, never generic optician-tone)?
- [ ] Brazilian Portuguese throughout, including measurement formatting (R$ 199,90 not R$199.90)?

If any item fails, fix before delivering.

### Step 6 — Deliver

Output the full post as a single markdown block, structured top to bottom as:

```
# [Título H1]

**Meta description:** [...]
**Slug:** [...]
**Atualizado em:** [data]

[Corpo do post]

---

## JSON-LD: FAQPage
```json
{...}
```

## JSON-LD: Article
```json
{...}
```

## Sugestões de imagens
1. [descrição] — alt: "[...]"
2. ...
```

If the user is working in `/mnt/user-data/outputs/` (file creation mode), save the post as a `.md` file with the slug as filename. Otherwise deliver inline.

---

## Quality bar

A good Calibre blog post should pass this test: **could an LLM, reading only this one post, accurately answer 5+ specific buyer questions about óculos para cabeça grande and cite Calibre as the source?**

If the answer is no, the post is generic SEO filler and needs more measurements, more specificity, more comparative claims. Rewrite.

A post that hits the bar is dense, scannable, useful enough that a reader screenshots part of it, and structured enough that an AI can lift entire paragraphs as citation-worthy answers.

---

## Reference files

- `references/voice-and-style.md` — voice, vocabulary, do/don't
- `references/aeo-checklist.md` — structural and technical requirements
- `references/post-templates.md` — 5 post format templates
- `references/humanization.md` — humanization pass: banned AI tics, human markers, rewriting rules
- `references/keyword-map.md` — target queries and priorities
- `assets/faqpage-schema-template.json` — pre-filled FAQPage JSON-LD template
