'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  buildEditorialOrchestration,
  buildSkillPrompt,
  editorialSkills,
  storytellingStructures,
  type KeywordCandidate,
} from '@/lib/article-orchestrator';
import { productCatalog } from '@/lib/catalog';
import {
  buildArticleDraft,
  buildDraftStoragePayload,
  getRandomArticleWriterProfile,
  type ArticleWriterProfile,
} from '@/lib/article-writer';
import { buildPublisherPackage } from '@/lib/article-publisher';
import { reviewAndAutoFix, type SeoReviewResult } from '@/lib/seo-reviewer';
import type { KeywordSuggestion } from '@/lib/keyword-planner';
import {
  generateArticleWithLlmAction,
  publishOrchestratedPost,
  reviseArticleWithLlmAction,
  suggestSiloPathAction,
  suggestPostClusterAction,
  type PublishOrchestratedPostResult,
  type PostCluster,
  type ClusterPost,
} from './actions';

const ORCHESTRATOR_DRAFT_STORAGE_KEY = 'calibre.orchestratorDraft.v1';
const NARRATIVE_ROTATION_KEY = 'calibre.narrativeRotation';
const REVIEWER_LESSONS_KEY = 'calibre.reviewerLessons.v1';

const BRAND_CONTEXT = {
  tema: 'oculos de sol para rosto largo',
  persona: 'pessoa com rosto largo que sente que oculos comuns ficam pequenos ou apertados',
  problemaPrincipal: 'armacoes comuns apertam nas temporas e parecem pequenas no rosto',
} as const;

function getNextNarrativeIndex(): number {
  try {
    const stored = window.localStorage.getItem(NARRATIVE_ROTATION_KEY);
    const current = stored !== null ? parseInt(stored, 10) : -1;
    const next = (current + 1) % storytellingStructures.length;
    window.localStorage.setItem(NARRATIVE_ROTATION_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

interface SeoIterationRecord {
  iteration: number;
  review: SeoReviewResult;
  deterministicFixes: string[];
  llmUsed: boolean;
  llmTokens?: { input: number; output: number };
  error?: string;
}

interface KeywordPlannerResponse {
  suggestions: KeywordSuggestion[];
  source: 'google-ads' | 'mock';
  warning?: string;
}

function emptyKeyword(): KeywordCandidate {
  return {
    termo: '',
    intencao: '',
    volumeMensal: '',
    fonteVolume: '',
    dificuldade: '',
  };
}

function normalizeTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseVolumeMensal(v: string): number {
  const clean = v.replace(',', '.').trim().toLowerCase();
  if (clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean) || 0;
}

function difficultyWeight(d: string): number {
  const key = d.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, number> = { 'muito baixa': 5, 'baixa': 4, 'media': 3, 'alta': 2, 'muito alta': 1 };
  return map[key] ?? 3;
}

function opportunityScore(s: KeywordSuggestion): number {
  return parseVolumeMensal(s.volumeMensal) * difficultyWeight(s.dificuldade);
}

function suggestionToKeyword(suggestion: KeywordSuggestion): KeywordCandidate {
  return {
    termo: suggestion.termo,
    intencao: suggestion.intencao,
    volumeMensal: suggestion.volumeMensal,
    fonteVolume: suggestion.fonte,
    dificuldade: suggestion.dificuldade,
  };
}

export function OrchestratorWorkspace() {
  const [publisherPending, startPublisherTransition] = useTransition();
  const [llmPending, startLlmTransition] = useTransition();
  const [siloPath, setSiloPath] = useState('formatos-de-oculos/rosto-largo');
  const [siloDetecting, setSiloDetecting] = useState(false);
  const [produtoId, setProdutoId] = useState(productCatalog[0]?.id ?? '');
  const [jornadaNarrativa, setJornadaNarrativa] = useState<string>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(NARRATIVE_ROTATION_KEY) : null;
      const idx = stored !== null ? parseInt(stored, 10) : 0;
      return storytellingStructures[idx % storytellingStructures.length] ?? storytellingStructures[0] ?? 'Jornada do Cliente';
    } catch {
      return storytellingStructures[0] ?? 'Jornada do Cliente';
    }
  });

  const [plannerQuery, setPlannerQuery] = useState('');
  const [plannerResults, setPlannerResults] = useState<KeywordSuggestion[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerWarning, setPlannerWarning] = useState('');
  const [plannerSource, setPlannerSource] = useState<'google-ads' | 'mock' | null>(null);
  const [writerProfile, setWriterProfile] = useState<ArticleWriterProfile>(() => getRandomArticleWriterProfile());
  const [editedMarkdown, setEditedMarkdown] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [llmWarning, setLlmWarning] = useState('');
  const [llmUsage, setLlmUsage] = useState<{ modelo: string; input: number; output: number; cacheRead: number } | null>(null);
  const [seoRunning, setSeoRunning] = useState(false);
  const [seoPhase, setSeoPhase] = useState('');
  const [seoStatus, setSeoStatus] = useState<'pass' | 'warn' | 'fail' | null>(null);
  const [seoHistory, setSeoHistory] = useState<SeoIterationRecord[]>([]);
  const [keywordsContextuais, setKeywordsContextuais] = useState<string[]>([]);
  const [licoesRevisor, setLicoesRevisor] = useState<string[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(REVIEWER_LESSONS_KEY) : null;
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [publisherResult, setPublisherResult] = useState<PublishOrchestratedPostResult | null>(null);
  const [publisherError, setPublisherError] = useState('');
  const [postCluster, setPostCluster] = useState<PostCluster | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const [keywordPrincipal, setKeywordPrincipal] = useState<KeywordCandidate>({
    termo: 'oculos de sol para rosto largo masculino',
    intencao: 'comercial investigativa',
    volumeMensal: '',
    fonteVolume: '',
    dificuldade: '',
  });
  const [keywordsSecundarias, setKeywordsSecundarias] = useState<KeywordCandidate[]>([
    { termo: 'armacao para rosto largo', intencao: 'informacional', volumeMensal: '', fonteVolume: '', dificuldade: '' },
    { termo: 'oculos que nao aperta na lateral', intencao: 'problema/solucao', volumeMensal: '', fonteVolume: '', dificuldade: '' },
    emptyKeyword(),
  ]);

  const plan = useMemo(() => buildEditorialOrchestration({
    tema: BRAND_CONTEXT.tema,
    siloPath,
    produtoId,
    persona: BRAND_CONTEXT.persona,
    problemaPrincipal: BRAND_CONTEXT.problemaPrincipal,
    jornadaNarrativa,
    keywordPrincipal,
    keywordsSecundarias,
  }), [siloPath, produtoId, jornadaNarrativa, keywordPrincipal, keywordsSecundarias]);

  const articleDraft = useMemo(() => buildArticleDraft({
    tema: BRAND_CONTEXT.tema,
    persona: BRAND_CONTEXT.persona,
    jornadaNarrativa,
    keywordPrincipal,
    keywordsObrigatorias: keywordsSecundarias.filter((keyword) => keyword.termo.trim()),
    produto: plan.produto,
    integracaoConteudo: plan.integracaoConteudo,
    profile: writerProfile,
  }), [jornadaNarrativa, keywordPrincipal, keywordsSecundarias, plan.produto, plan.integracaoConteudo, writerProfile]);

  const effectiveDraft = useMemo(() => ({
    ...articleDraft,
    titulo: editedTitle ?? articleDraft.titulo,
    conteudoMarkdown: editedMarkdown ?? articleDraft.conteudoMarkdown,
  }), [articleDraft, editedMarkdown, editedTitle]);

  const publisherPackage = useMemo(() => buildPublisherPackage({
    draft: effectiveDraft,
    topicPath: siloPath,
    slugBase: plan.slugSugerido,
  }), [effectiveDraft, siloPath, plan.slugSugerido]);

  const seoBlocking = seoStatus === 'fail';

  async function handlePlannerSearch(q: string) {
    const query = q.trim();

    setPlannerQuery(query);
    setPlannerWarning('');
    setPlannerSource(null);
    setPostCluster(null);
    setClusterLoading(false);

    if (query.length < 2) {
      setPlannerResults([]);
      setPlannerLoading(false);
      return;
    }

    setKeywordPrincipal({
      termo: query,
      intencao: 'a classificar pelo integrador',
      volumeMensal: '',
      fonteVolume: 'termo buscado no orquestrador',
      dificuldade: '',
    });
    setSeoStatus(null);
    setSeoHistory([]);

    setPlannerLoading(true);
    try {
      const response = await fetch(`/api/admin/keyword-planner?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      const data = await response.json() as KeywordPlannerResponse | { error?: string };

      if (!response.ok) {
        setPlannerResults([]);
        setKeywordsSecundarias([]);
        setPlannerWarning('error' in data && data.error ? data.error : 'Nao foi possivel consultar o Keyword Planner.');
        return;
      }

      const result = data as KeywordPlannerResponse;
      const relatedSuggestions = (result.suggestions ?? []).filter((suggestion) => normalizeTerm(suggestion.termo) !== normalizeTerm(query));
      const ranked = [...relatedSuggestions].sort((a, b) => opportunityScore(b) - opportunityScore(a));
      const topSecundarias = ranked.slice(0, 4);
      const contextual = ranked.slice(4);
      setPlannerResults(ranked);
      setKeywordsSecundarias(topSecundarias.map(suggestionToKeyword));
      setKeywordsContextuais(contextual.map((s) => s.termo));
      setPlannerSource(result.source);
      setPlannerWarning(result.warning ?? '');

      void suggestSiloPathAction({ keyword: query }).then(setSiloPath).catch(() => {});

      setClusterLoading(true);
      void suggestPostClusterAction(query, siloPath, ranked.map((s) => s.termo))
        .then((cluster) => { setPostCluster(cluster); })
        .catch(() => { setPostCluster(null); })
        .finally(() => { setClusterLoading(false); });
    } catch {
      setPlannerResults([]);
      setKeywordsSecundarias([]);
      setPlannerWarning('Erro de rede ao consultar o Keyword Planner.');
    } finally {
      setPlannerLoading(false);
    }
  }

  function prepareDraftInPostEditor() {
    const payload = buildDraftStoragePayload({
      draft: articleDraft,
      topicPath: siloPath,
      slugBase: plan.slugSugerido,
      writerInput: {
        tema: BRAND_CONTEXT.tema,
        persona: BRAND_CONTEXT.persona,
        jornadaNarrativa,
        keywordPrincipal,
        keywordsObrigatorias: keywordsSecundarias.filter((keyword) => keyword.termo.trim()),
        produto: plan.produto,
        integracaoConteudo: plan.integracaoConteudo,
        profile: writerProfile,
      },
    });

    window.localStorage.setItem(ORCHESTRATOR_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    window.location.href = '/admin/posts/novo';
  }

  function generateWithLlm() {
    setLlmWarning('');
    setLlmUsage(null);
    if (!keywordPrincipal.termo.trim()) {
      setLlmWarning('Defina a keyword principal antes de gerar com o LLM.');
      return;
    }

    startLlmTransition(() => {
      void generateArticleWithLlmAction({
        tema: BRAND_CONTEXT.tema,
        keywordPrincipal: keywordPrincipal.termo,
        keywordsSecundarias: keywordsSecundarias
          .map((keyword) => keyword.termo.trim())
          .filter(Boolean),
        keywordsContextuais,
        licoesRevisor,
        persona: BRAND_CONTEXT.persona,
        problemaPrincipal: BRAND_CONTEXT.problemaPrincipal,
        provaConcreta: plan.integracaoConteudo.provaConcreta,
        beneficioCentral: plan.integracaoConteudo.beneficioCentral,
        objecaoPrincipal: plan.integracaoConteudo.objecaoPrincipal,
        ctaSugerido: plan.integracaoConteudo.ctaSugerido,
        tituloSugerido: plan.integracaoConteudo.tituloSugerido,
        h2Sugeridos: plan.integracaoConteudo.h2Sugeridos,
        produto: plan.produto,
        perfilEditorial: {
          nome: writerProfile.nome,
          tamanho: writerProfile.tamanho,
          tecnica: writerProfile.tecnica,
          ritmo: writerProfile.ritmo,
        },
        siloPath,
      })
        .then((result) => {
          setEditedMarkdown(result.conteudoMarkdown);
          const firstHeading = result.conteudoMarkdown.match(/^#\s+(.+)$/m);
          const generatedTitle = firstHeading ? firstHeading[1].trim() : null;
          if (generatedTitle) setEditedTitle(generatedTitle);
          setLlmUsage({
            modelo: result.modelo,
            input: result.usage.inputTokens,
            output: result.usage.outputTokens,
            cacheRead: result.usage.cacheReadTokens,
          });
          setSiloDetecting(true);
          void suggestSiloPathAction({
            keyword: keywordPrincipal.termo,
            titulo: generatedTitle ?? undefined,
            resumo: effectiveDraft.resumo,
          }).then((silo) => { setSiloPath(silo); setSiloDetecting(false); }).catch(() => setSiloDetecting(false));
        })
        .catch((error: unknown) => {
          setLlmWarning(error instanceof Error ? error.message : 'Falha ao gerar com o LLM.');
        });
    });
  }

  async function runSeoReviewLoop() {
    if (seoRunning) return;
    setSeoRunning(true);
    setSeoPhase('');
    setSeoHistory([]);
    setSeoStatus(null);

    const brief = {
      tema: BRAND_CONTEXT.tema,
      keywordPrincipal: keywordPrincipal.termo,
      keywordsSecundarias: keywordsSecundarias.map((k) => k.termo.trim()).filter(Boolean),
      keywordsContextuais,
      persona: BRAND_CONTEXT.persona,
      problemaPrincipal: BRAND_CONTEXT.problemaPrincipal,
      provaConcreta: plan.integracaoConteudo.provaConcreta,
      beneficioCentral: plan.integracaoConteudo.beneficioCentral,
      objecaoPrincipal: plan.integracaoConteudo.objecaoPrincipal,
      ctaSugerido: plan.integracaoConteudo.ctaSugerido,
      tituloSugerido: plan.integracaoConteudo.tituloSugerido,
      h2Sugeridos: plan.integracaoConteudo.h2Sugeridos,
      produto: plan.produto,
      perfilEditorial: {
        nome: writerProfile.nome,
        tamanho: writerProfile.tamanho,
        tecnica: writerProfile.tecnica,
        ritmo: writerProfile.ritmo,
      },
      siloPath,
    };

    let currentMd = effectiveDraft.conteudoMarkdown;
    let currentTitulo = effectiveDraft.titulo;
    const history: SeoIterationRecord[] = [];
    const MAX = 3;

    for (let i = 1; i <= MAX; i++) {
      setSeoPhase(`Iteração ${i}/${MAX} — revisando...`);

      const { review, corrections, updated } = reviewAndAutoFix({
        titulo: currentTitulo,
        resumo: effectiveDraft.resumo,
        conteudoMd: currentMd,
        keywordPrincipal: keywordPrincipal.termo,
        keywordsSecundarias: keywordsSecundarias.map((k) => k.termo.trim()).filter(Boolean),
        siloPath,
      });

      currentMd = updated.conteudoMd;
      currentTitulo = updated.titulo;
      setEditedMarkdown(currentMd);
      setEditedTitle(currentTitulo);

      const hasErrors = review.issues.some((issue) => issue.level === 'error');
      const hasWarnings = review.issues.some((issue) => issue.level === 'warning');

      if (!hasErrors && !hasWarnings) {
        history.push({ iteration: i, review, deterministicFixes: corrections, llmUsed: false });
        setSeoHistory([...history]);
        setSeoStatus('pass');
        setSeoRunning(false);
        setSeoPhase('');
        accumulateLessons([...history]);
        return;
      }

      if (i === MAX) {
        history.push({ iteration: i, review, deterministicFixes: corrections, llmUsed: false });
        setSeoHistory([...history]);
        setSeoStatus(hasErrors ? 'fail' : 'warn');
        accumulateLessons([...history]);
        break;
      }

      setSeoPhase(`Iteração ${i}/${MAX} — corrigindo com IA...`);
      try {
        const llmResult = await reviseArticleWithLlmAction({
          brief,
          currentMarkdown: currentMd,
          issues: review.issues,
        });
        currentMd = llmResult.conteudoMarkdown;
        const h1Match = currentMd.match(/^#\s+(.+)$/m);
        if (h1Match) currentTitulo = h1Match[1].trim();
        setEditedMarkdown(currentMd);
        setEditedTitle(currentTitulo);
        history.push({
          iteration: i,
          review,
          deterministicFixes: corrections,
          llmUsed: true,
          llmTokens: { input: llmResult.usage.inputTokens, output: llmResult.usage.outputTokens },
        });
        setSeoHistory([...history]);
      } catch (error) {
        history.push({
          iteration: i,
          review,
          deterministicFixes: corrections,
          llmUsed: false,
          error: error instanceof Error ? error.message : 'Erro ao chamar IA',
        });
        setSeoHistory([...history]);
        setSeoStatus(hasErrors ? 'fail' : 'warn');
        break;
      }
    }

    setSeoRunning(false);
    setSeoPhase('');
  }

  function accumulateLessons(newHistory: SeoIterationRecord[]) {
    const newIssues = newHistory.flatMap((item) =>
      item.review.issues
        .filter((issue) => issue.level === 'error' || issue.level === 'warning')
        .map((issue) => `[${issue.rule}] ${issue.message}`)
    );
    if (!newIssues.length) return;
    setLicoesRevisor((prev) => {
      const merged = Array.from(new Set([...prev, ...newIssues])).slice(0, 30);
      try { window.localStorage.setItem(REVIEWER_LESSONS_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
      return merged;
    });
  }

  function publishCurrentArticle() {
    setPublisherError('');
    setPublisherResult(null);

    if (publisherPackage.warnings.length) {
      setPublisherError(publisherPackage.warnings.join(' '));
      return;
    }

    if (!seoStatus) {
      setPublisherError('Rode a Revisão SEO antes de publicar.');
      return;
    }

    if (seoBlocking) {
      setPublisherError('Há erros do Revisor SEO bloqueando a publicação. Corrija e revise novamente.');
      return;
    }

    startPublisherTransition(() => {
      void publishOrchestratedPost({
        titulo: effectiveDraft.titulo,
        resumo: effectiveDraft.resumo,
        conteudoMarkdown: effectiveDraft.conteudoMarkdown,
        tags: publisherPackage.tags,
        topicPath: publisherPackage.topicPath,
        slug: publisherPackage.slug,
        metaTitle: effectiveDraft.titulo.slice(0, 60),
        metaDescription: effectiveDraft.resumo,
        keywordPrincipal: keywordPrincipal.termo,
        keywordsSecundarias: keywordsSecundarias
          .map((keyword) => keyword.termo.trim())
          .filter(Boolean),
        coverAlt: `${keywordPrincipal.termo} ilustrado pelo ${plan.produto.nome}`,
      })
        .then((result) => setPublisherResult(result))
        .catch((error: unknown) => {
          setPublisherError(error instanceof Error ? error.message : 'Nao foi possivel publicar o artigo.');
        });
    });
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Entrada do orquestrador</p>
            <h1 style={titleStyle}>Gerador de briefing editorial</h1>
          </div>
          <a href="/admin/posts/novo" style={primaryLinkStyle}>Criar post</a>
        </div>

        <div style={brandContextStyle}>
          <div style={brandContextItemStyle}><span style={labelStyle}>Tema</span><span>{BRAND_CONTEXT.tema}</span></div>
          <div style={brandContextItemStyle}><span style={labelStyle}>Persona</span><span>{BRAND_CONTEXT.persona}</span></div>
          <div style={brandContextItemStyle}><span style={labelStyle}>Dor principal</span><span>{BRAND_CONTEXT.problemaPrincipal}</span></div>
        </div>

        <div style={formGridStyle}>
          <Field label="Produto de referência">
            <select value={produtoId} onChange={(event) => setProdutoId(event.target.value)} style={inputStyle}>
              {productCatalog.map((product) => (
                <option key={product.id} value={product.id}>{product.medidaReferencia} — {product.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Estrutura narrativa (rotação automática)">
            <select value={jornadaNarrativa} onChange={(event) => setJornadaNarrativa(event.target.value)} style={inputStyle}>
              {storytellingStructures.map((structure) => (
                <option key={structure} value={structure}>{structure}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Skill 1</p>
        <div style={keywordResearchHeaderStyle}>
          <div>
            <h2 style={{ ...subtitleStyle, margin: 0 }}>Keywords Researcher</h2>
            <p style={hintStyle}>Busque a palavra-chave principal do artigo. As caudas longas retornadas entram automaticamente como termos obrigatorios para o Redator.</p>
          </div>
          <form
            style={keywordSearchFormStyle}
            onSubmit={(event) => {
              event.preventDefault();
              handlePlannerSearch(plannerQuery);
            }}
          >
            <input
              placeholder="Palavra-chave base"
              value={plannerQuery}
              onChange={(event) => setPlannerQuery(event.target.value)}
              style={{ ...inputStyle, borderColor: '#C8F135' }}
            />
            <button type="submit" style={searchButtonStyle} disabled={plannerLoading}>
              {plannerLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {(plannerSource || plannerWarning || plannerResults.length > 0 || plannerLoading) && (
          <div style={researchResultsStyle}>
            <div style={researchMetaStyle}>
              <span style={pathBadgeStyle}>
                Fonte: {plannerSource === 'google-ads' ? 'Google Ads Keyword Planner' : plannerSource === 'mock' ? 'Fallback local' : 'Aguardando consulta'}
              </span>
              {plannerWarning && <span style={warningInlineStyle}>{plannerWarning}</span>}
            </div>
            <div style={tableScrollStyle}>
              <table style={keywordTableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Papel no artigo</th>
                    <th style={tableHeaderStyle}>Palavra-chave</th>
                    <th style={tableHeaderStyle}>Volume</th>
                    <th style={tableHeaderStyle}>Dificuldade</th>
                    <th style={tableHeaderStyle}>Intencao</th>
                    <th style={tableHeaderStyle}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {plannerLoading && (
                    <tr>
                      <td colSpan={6} style={tableEmptyStyle}>Analisando oportunidades de ranking...</td>
                    </tr>
                  )}
                  {!plannerLoading && plannerResults.length === 0 && (
                    <tr>
                      <td colSpan={6} style={tableEmptyStyle}>Nenhuma cauda longa encontrada para esta busca.</td>
                    </tr>
                  )}
                  {!plannerLoading && plannerResults.map((suggestion, idx) => {
                    const score = opportunityScore(suggestion);
                    const isObrigatoria = idx < 4;
                    return (
                      <tr key={suggestion.termo}>
                        <td style={tableCellStyle}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: isObrigatoria ? 'rgba(200,241,53,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isObrigatoria ? '#C8F135' : 'rgba(255,255,255,0.38)',
                            whiteSpace: 'nowrap',
                          }}>
                            {isObrigatoria ? `#${idx + 1} obrigatória` : 'contexto'}
                          </span>
                        </td>
                        <td style={tableCellStrongStyle}>{suggestion.termo}</td>
                        <td style={tableCellStyle}>{suggestion.volumeMensal}</td>
                        <td style={tableCellStyle}>{suggestion.dificuldade}</td>
                        <td style={tableCellStyle}>{suggestion.intencao}</td>
                        <td style={tableCellStyle}>{score > 0 ? score.toLocaleString('pt-BR') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!plannerLoading && plannerResults.length > 0 && (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.42)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                Score = volume × peso da dificuldade (Muito Baixa=5 … Muito Alta=1). As 4 primeiras entram como keywords obrigatórias no artigo; as demais enriquecem a semântica como contexto.
              </div>
            )}
          </div>
        )}

      </section>

      {(clusterLoading || postCluster) && (
        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>Skill 1 — Estratégia de Conteúdo</p>
              <h2 style={subtitleStyle}>Bateria de Posts — Cluster Semântico</h2>
              <p style={hintStyle}>
                Conjunto de artigos interligados formando um anel de links (<em>Link Wheel</em>). Todos os posts de suporte linkam para o Pilar e para o próximo do anel. O Google entende a unidade temática como autoridade no nicho.
              </p>
            </div>
          </div>

          {clusterLoading && (
            <div style={hintStyle}>Montando o cluster semântico com IA...</div>
          )}

          {postCluster && !clusterLoading && (
            <>
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                <strong style={{ color: '#C8F135' }}>Tópico do cluster:</strong> {postCluster.topico}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ClusterPostCard
                  post={postCluster.pilar}
                  allPosts={[postCluster.pilar, ...postCluster.suportes]}
                  onUsar={(keyword) => { void handlePlannerSearch(keyword); }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>Posts de suporte — anel de links ↓</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>
                {postCluster.suportes.map((post, idx) => (
                  <div key={post.keyword} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ClusterPostCard
                      post={post}
                      allPosts={[postCluster.pilar, ...postCluster.suportes]}
                      onUsar={(keyword) => { void handlePlannerSearch(keyword); }}
                    />
                    {idx < postCluster.suportes.length - 1 && (
                      <div style={{ textAlign: 'center', fontSize: '16px', color: 'rgba(255,255,255,0.2)' }}>↓</div>
                    )}
                    {idx === postCluster.suportes.length - 1 && (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', padding: '4px 0' }}>
                        ↺ linka de volta para o 1º post de suporte (fechando o anel)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
                <strong>Como usar:</strong> clique em "Usar como base" para carregar a keyword do post no Planner e gerar o artigo. Crie um post por vez seguindo a ordem sugerida. Os links internos entre eles devem ser inseridos no texto de cada artigo.
              </div>
            </>
          )}
        </section>
      )}

      <section style={skillsGridStyle}>
        {editorialSkills.map((skill, index) => (
          <article key={skill.id} style={skillCardStyle}>
            <span style={stepStyle}>{String(index + 1).padStart(2, '0')}</span>
            <h3 style={skillTitleStyle}>{skill.nome}</h3>
            <p style={skillTextStyle}>{skill.objetivo}</p>
            <details style={detailsStyle}>
              <summary style={summaryStyle}>Contrato do bot</summary>
              <pre style={promptStyle}>{buildSkillPrompt(skill)}</pre>
            </details>
          </article>
        ))}
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Saida do orquestrador</p>
            <h2 style={subtitleStyle}>Briefing para os bots</h2>
          </div>
          <span style={pathBadgeStyle}>/blog/{plan.postPathSugerido || 'silo/artigo'}</span>
        </div>
        <textarea readOnly value={plan.briefMarkdown} style={briefStyle} />
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Skill 3</p>
            <h2 style={subtitleStyle}>Redator</h2>
            <p style={hintStyle}>Rascunho via template (rapido) ou gerado pelo LLM (OpenAI, ~2000 palavras). Edite livremente antes de revisar e publicar.</p>
          </div>
          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={() => {
                setWriterProfile(getRandomArticleWriterProfile());
                const nextIdx = getNextNarrativeIndex();
                setJornadaNarrativa(storytellingStructures[nextIdx] ?? storytellingStructures[0] ?? 'Jornada do Cliente');
                setSeoStatus(null);
                setSeoHistory([]);
              }}
              style={secondaryButtonStyle}
            >
              Nova variacao
            </button>
            <button
              type="button"
              onClick={() => {
                setEditedMarkdown(null);
                setEditedTitle(null);
                setLlmUsage(null);
                setLlmWarning('');
                setSeoStatus(null);
                setSeoHistory([]);
              }}
              style={secondaryButtonStyle}
            >
              Voltar ao template
            </button>
            <button type="button" onClick={generateWithLlm} disabled={llmPending} style={searchButtonStyle}>
              {llmPending ? 'Gerando com OpenAI...' : 'Gerar com OpenAI'}
            </button>
            <button type="button" onClick={prepareDraftInPostEditor} style={secondaryButtonStyle}>
              Abrir como post
            </button>
          </div>
        </div>

        <div style={writerMetaGridStyle}>
          <span style={writerBadgeStyle}>Perfil: {effectiveDraft.perfil.nome}</span>
          <span style={writerBadgeStyle}>Tamanho: {effectiveDraft.perfil.tamanho}</span>
          <span style={writerBadgeStyle}>Tecnica: {effectiveDraft.perfil.tecnica}</span>
          <span style={writerBadgeStyle}>Ritmo: {effectiveDraft.perfil.ritmo}</span>
          {editedMarkdown ? <span style={{ ...writerBadgeStyle, color: '#C8F135' }}>Fonte: OpenAI (editavel)</span> : <span style={writerBadgeStyle}>Fonte: template</span>}
          {licoesRevisor.length > 0 && (
            <span
              title={`Lições acumuladas:\n${licoesRevisor.join('\n')}`}
              style={{ ...writerBadgeStyle, color: '#FFB347', borderColor: 'rgba(255,179,71,0.3)', cursor: 'default' }}
            >
              ⚑ {licoesRevisor.length} lição{licoesRevisor.length !== 1 ? 'ões' : ''} do revisor
            </span>
          )}
        </div>

        {licoesRevisor.length > 0 && (
          <details style={{ marginBottom: '14px', borderLeft: '2px solid rgba(255,179,71,0.3)', paddingLeft: '12px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#FFB347', userSelect: 'none', fontWeight: 700 }}>
              Memória do revisor — o Redator evita repetir estes erros
            </summary>
            <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {licoesRevisor.map((licao, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>· {licao}</div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLicoesRevisor([]);
                  try { window.localStorage.removeItem(REVIEWER_LESSONS_KEY); } catch { /* ignore */ }
                }}
                style={{ ...secondaryButtonStyle, fontSize: '11px', padding: '6px 10px', marginTop: '8px', alignSelf: 'flex-start', color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}
              >
                Limpar memória
              </button>
            </div>
          </details>
        )}

        <div style={writerSummaryStyle}>
          <strong>{effectiveDraft.titulo}</strong>
          <p>{effectiveDraft.resumo}</p>
        </div>

        {llmWarning && (
          <div style={publisherWarningStyle}>{llmWarning}</div>
        )}

        {llmUsage && (
          <div style={writerMetaGridStyle}>
            <span style={writerBadgeStyle}>Modelo: {llmUsage.modelo}</span>
            <span style={writerBadgeStyle}>Input: {llmUsage.input} tokens</span>
            <span style={writerBadgeStyle}>Output: {llmUsage.output}</span>
            <span style={writerBadgeStyle}>Cache read: {llmUsage.cacheRead}</span>
          </div>
        )}

        <textarea
          value={effectiveDraft.conteudoMarkdown}
          onChange={(event) => setEditedMarkdown(event.target.value)}
          style={draftStyle}
        />
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Skill 4</p>
            <h2 style={subtitleStyle}>Revisor SEO</h2>
            <p style={hintStyle}>Roda local via lib/seo-reviewer. Valida H1, densidade, meta length, alt em imagens, links internos do mesmo silo. Erros bloqueiam a publicacao.</p>
          </div>
          <button type="button" onClick={() => { void runSeoReviewLoop(); }} disabled={seoRunning} style={searchButtonStyle}>
            {seoRunning ? seoPhase || 'Revisando...' : 'Revisar SEO'}
          </button>
        </div>

        {!seoStatus && !seoRunning && (
          <div style={hintStyle}>Não revisado. Rode antes de publicar.</div>
        )}

        {seoRunning && seoHistory.length === 0 && (
          <div style={hintStyle}>{seoPhase}</div>
        )}

        {seoHistory.length > 0 && (
          <>
            <div style={writerMetaGridStyle}>
              {seoStatus && (
                <span style={{
                  ...writerBadgeStyle,
                  color: seoStatus === 'pass' ? '#C8F135' : seoStatus === 'warn' ? '#FFB347' : '#FF6B6B',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}>
                  {seoStatus === 'pass' ? '✓ passou' : seoStatus === 'warn' ? '⚠ warnings' : '✗ falhou'}
                </span>
              )}
              {seoRunning && <span style={{ ...writerBadgeStyle, color: '#FFB347' }}>{seoPhase}</span>}
              <span style={writerBadgeStyle}>{seoHistory.length} iteração{seoHistory.length !== 1 ? 'ões' : ''} rodadas</span>
              {(() => {
                const last = seoHistory[seoHistory.length - 1];
                if (!last) return null;
                const r = last.review;
                return (
                  <>
                    <span style={{ ...writerBadgeStyle, color: r.score >= 80 ? '#C8F135' : r.score >= 60 ? '#FFB347' : '#FF6B6B', fontWeight: 800 }}>Score: {r.score}</span>
                    <span style={writerBadgeStyle}>{r.metrics.wordCount} palavras</span>
                    <span style={writerBadgeStyle}>H1: {r.metrics.h1Count} · H2: {r.metrics.h2Count}</span>
                    <span style={writerBadgeStyle}>Densidade: {r.metrics.keywordDensity.toFixed(2)}%</span>
                    <span style={writerBadgeStyle}>Meta title: {r.metrics.metaTitleLength}/60</span>
                    <span style={writerBadgeStyle}>Meta desc: {r.metrics.metaDescriptionLength}/160</span>
                    <span style={writerBadgeStyle}>Links internos: {r.metrics.internalLinks}</span>
                  </>
                );
              })()}
            </div>

            {seoHistory.map((item) => (
              <details key={item.iteration} style={{ margin: '10px 0', borderLeft: '2px solid rgba(200,241,53,0.2)', paddingLeft: '12px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.6)', userSelect: 'none' }}>
                  Iteração {item.iteration} — score {item.review.score} — {item.review.issues.length} issue{item.review.issues.length !== 1 ? 's' : ''}
                  {item.llmUsed && <span style={{ color: '#C8F135', marginLeft: '8px' }}>✦ corrigido pela IA</span>}
                  {item.deterministicFixes.length > 0 && <span style={{ color: '#C8F135', marginLeft: '8px' }}>({item.deterministicFixes.length} correção automática{item.deterministicFixes.length !== 1 ? 'ões' : ''})</span>}
                  {item.error && <span style={{ color: '#FF6B6B', marginLeft: '8px' }}>erro: {item.error}</span>}
                </summary>
                <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {item.deterministicFixes.map((fix, fi) => (
                    <div key={fi} style={{ fontSize: '12px', color: '#C8F135' }}>✓ {fix}</div>
                  ))}
                  {item.llmUsed && item.llmTokens && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>IA: {item.llmTokens.input} tokens entrada · {item.llmTokens.output} saída</div>
                  )}
                  {item.review.issues.map((issue, ii) => (
                    <div
                      key={`${issue.rule}-${ii}`}
                      style={{
                        fontSize: '12px',
                        color: issue.level === 'error' ? '#FF6B6B' : issue.level === 'warning' ? '#FFB347' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <strong>{issue.level === 'error' ? 'erro' : issue.level === 'warning' ? 'warning' : 'info'}</strong> · {issue.message}
                    </div>
                  ))}
                  {item.review.issues.length === 0 && <div style={{ fontSize: '12px', color: '#C8F135' }}>Sem issues nesta iteração.</div>}
                </div>
              </details>
            ))}

            {seoStatus === 'pass' && (
              <div style={publisherSuccessStyle}>Passou em todas as verificações. Pronto para publicar.</div>
            )}
            {seoStatus === 'warn' && (
              <div style={{ ...publisherWarningStyle, borderColor: '#FFB347', color: '#FFB347' }}>
                Warnings restantes não foram corrigidos automaticamente (ex.: densidade de keyword, links internos). Revise o texto manualmente ou publique assim mesmo.
              </div>
            )}
            {seoStatus === 'fail' && (
              <div style={publisherWarningStyle}>
                Erros bloqueantes após {seoHistory.length} iterações. Corrija o conteúdo no editor acima e rode novamente.
              </div>
            )}
          </>
        )}
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Skill 5</p>
            <h2 style={subtitleStyle}>Publisher</h2>
            <p style={hintStyle}>Recebe o texto revisado, valida silo e slug, publica o post na categoria correta e revalida blog e sitemap.</p>
          </div>
          <button
            type="button"
            onClick={publishCurrentArticle}
            disabled={publisherPending || Boolean(publisherPackage.warnings.length) || !seoStatus || seoBlocking}
            style={searchButtonStyle}
            title={!seoStatus ? 'Rode a Revisão SEO antes' : seoBlocking ? 'Há erros do Revisor SEO bloqueando' : ''}
          >
            {publisherPending ? 'Publicando...' : !seoStatus ? 'Revise antes' : seoBlocking ? 'Há erros SEO' : 'Publicar agora'}
          </button>
        </div>

        <div style={publisherGridStyle}>
          <div style={publisherBoxStyle}>
            <p style={publisherLabelStyle}>Silo detectado pela IA</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                value={siloPath}
                onChange={(event) => setSiloPath(event.target.value)}
                style={{ ...inputStyle, fontSize: '13px', padding: '7px 10px', flex: 1, minWidth: '180px' }}
              />
              <button
                type="button"
                disabled={siloDetecting || !keywordPrincipal.termo.trim()}
                onClick={() => {
                  setSiloDetecting(true);
                  void suggestSiloPathAction({
                    keyword: keywordPrincipal.termo,
                    titulo: effectiveDraft.titulo,
                    resumo: effectiveDraft.resumo,
                  }).then((silo) => { setSiloPath(silo); setSiloDetecting(false); }).catch(() => setSiloDetecting(false));
                }}
                style={{ ...secondaryButtonStyle, fontSize: '11px', padding: '7px 12px', whiteSpace: 'nowrap' }}
              >
                {siloDetecting ? 'Detectando...' : '↺ Re-detectar'}
              </button>
            </div>
          </div>
          <div style={publisherBoxStyle}>
            <p style={publisherLabelStyle}>Slug final</p>
            <strong>{publisherPackage.postPath || 'a definir'}</strong>
          </div>
          <div style={publisherBoxStyle}>
            <p style={publisherLabelStyle}>URL publica prevista</p>
            <strong>{publisherPackage.publicUrl}</strong>
          </div>
        </div>

        <div style={publisherChecklistStyle}>
          <strong>Checklist do Publisher</strong>
          <ul style={publisherListStyle}>
            {publisherPackage.checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        {publisherPackage.warnings.length > 0 && (
          <div style={publisherWarningStyle}>{publisherPackage.warnings.join(' ')}</div>
        )}

        {publisherError && <div style={publisherWarningStyle}>{publisherError}</div>}

        {publisherResult && (
          <div style={publisherSuccessStyle}>
            Publicado em <a href={publisherResult.publicUrl} style={successLinkStyle}>{publisherResult.publicUrl}</a>. Edicao: <a href={publisherResult.adminUrl} style={successLinkStyle}>{publisherResult.adminUrl}</a>
          </div>
        )}
      </section>
    </div>
  );
}

function ClusterPostCard({
  post,
  allPosts,
  onUsar,
}: {
  post: ClusterPost;
  allPosts: ClusterPost[];
  onUsar: (keyword: string) => void;
}) {
  const isPilar = post.tipo === 'pilar';
  const accentColor = isPilar ? '#C8F135' : 'rgba(255,255,255,0.62)';
  const linkedPosts = allPosts.filter((p) => post.linkaPara.includes(p.keyword));

  return (
    <div style={{
      background: isPilar ? 'rgba(200,241,53,0.04)' : '#0A0A0A',
      border: `1px solid ${isPilar ? 'rgba(200,241,53,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '12px',
      padding: '16px',
      display: 'grid',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '999px',
            background: isPilar ? 'rgba(200,241,53,0.15)' : 'rgba(255,255,255,0.06)',
            color: accentColor,
            whiteSpace: 'nowrap',
          }}>
            {isPilar ? '★ Página Pilar' : '◈ Suporte'}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', padding: '3px 9px' }}>
            {post.intencao}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace' }}>
            /blog/{post.siloPath}/…
          </span>
        </div>
        <button
          type="button"
          onClick={() => onUsar(post.keyword)}
          style={{ ...secondaryButtonStyle, fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap' }}
        >
          Usar como base →
        </button>
      </div>

      <div>
        <div style={{ fontSize: '15px', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>{post.titulo}</div>
        <div style={{ fontSize: '12px', color: '#C8F135', marginBottom: '6px', fontFamily: 'monospace' }}>{post.keyword}</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{post.resumo}</div>
      </div>

      {linkedPosts.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Links internos saem deste post →
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {linkedPosts.map((linked) => (
              <span key={linked.keyword} style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: linked.tipo === 'pilar' ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${linked.tipo === 'pilar' ? 'rgba(200,241,53,0.2)' : 'rgba(255,255,255,0.08)'}`,
                color: linked.tipo === 'pilar' ? '#C8F135' : 'rgba(255,255,255,0.5)',
              }}>
                {linked.tipo === 'pilar' ? '★ ' : ''}{linked.keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '18px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#C8F135',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#fff',
  fontSize: '28px',
  lineHeight: 1.1,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#fff',
  fontSize: '22px',
  lineHeight: 1.15,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px',
};

const brandContextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  background: 'rgba(200,241,53,0.05)',
  border: '1px solid rgba(200,241,53,0.15)',
  borderRadius: '10px',
  padding: '12px 16px',
  marginBottom: '16px',
};

const brandContextItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.72)',
  alignItems: 'baseline',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.52)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color: '#fff',
  padding: '11px 12px',
  fontSize: '14px',
  width: '100%',
  fontFamily: 'inherit',
};

const hintStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.46)',
  fontSize: '13px',
  lineHeight: 1.6,
  margin: '8px 0 18px',
};

const skillsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px',
};

const skillCardStyle: React.CSSProperties = {
  ...panelStyle,
  display: 'grid',
  gap: '12px',
};

const stepStyle: React.CSSProperties = {
  color: '#C8F135',
  fontSize: '12px',
  letterSpacing: '0.14em',
  fontWeight: 800,
};

const skillTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '18px',
};

const skillTextStyle: React.CSSProperties = {
  margin: 0,
  color: 'rgba(255,255,255,0.58)',
  fontSize: '13px',
  lineHeight: 1.6,
};

const detailsStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.62)',
  fontSize: '13px',
};

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  color: '#C8F135',
  fontWeight: 700,
};

const promptStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  margin: '10px 0 0',
  background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '12px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  lineHeight: 1.55,
};

const briefStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '560px',
  resize: 'vertical',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  lineHeight: 1.55,
};

const draftStyle: React.CSSProperties = {
  ...briefStyle,
  minHeight: '640px',
};

const primaryLinkStyle: React.CSSProperties = {
  color: '#0A0A0A',
  background: '#C8F135',
  textDecoration: 'none',
  borderRadius: '999px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 800,
};

const pathBadgeStyle: React.CSSProperties = {
  color: '#C8F135',
  background: 'rgba(200,241,53,0.08)',
  border: '1px solid rgba(200,241,53,0.2)',
  borderRadius: '999px',
  padding: '10px 14px',
  fontSize: '12px',
};

const keywordResearchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '18px',
  marginBottom: '16px',
  flexWrap: 'wrap',
};

const keywordSearchFormStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 320px) auto',
  gap: '10px',
  alignItems: 'center',
};

const searchButtonStyle: React.CSSProperties = {
  color: '#0A0A0A',
  background: '#C8F135',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  fontSize: '13px',
  fontWeight: 900,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  color: '#C8F135',
  background: 'transparent',
  border: '1px solid rgba(200,241,53,0.45)',
  borderRadius: '10px',
  padding: '12px 16px',
  fontSize: '13px',
  fontWeight: 900,
  cursor: 'pointer',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const writerMetaGridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '14px',
};

const writerBadgeStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '999px',
  padding: '9px 12px',
  fontSize: '12px',
};

const writerSummaryStyle: React.CSSProperties = {
  background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '14px',
  color: '#fff',
  marginBottom: '14px',
  lineHeight: 1.5,
};

const publisherGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
  marginBottom: '14px',
};

const publisherBoxStyle: React.CSSProperties = {
  background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '14px',
  color: '#fff',
  overflowWrap: 'anywhere',
};

const publisherLabelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.48)',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: '0 0 8px',
};

const publisherChecklistStyle: React.CSSProperties = {
  background: 'rgba(200,241,53,0.06)',
  border: '1px solid rgba(200,241,53,0.18)',
  borderRadius: '12px',
  padding: '14px',
  color: 'rgba(255,255,255,0.86)',
  marginBottom: '14px',
};

const publisherListStyle: React.CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: '18px',
  lineHeight: 1.7,
};

const publisherWarningStyle: React.CSSProperties = {
  background: 'rgba(255,209,102,0.08)',
  border: '1px solid rgba(255,209,102,0.32)',
  borderRadius: '12px',
  color: '#ffd166',
  padding: '12px 14px',
  fontSize: '13px',
  lineHeight: 1.5,
  marginTop: '10px',
};

const publisherSuccessStyle: React.CSSProperties = {
  background: 'rgba(200,241,53,0.08)',
  border: '1px solid rgba(200,241,53,0.3)',
  borderRadius: '12px',
  color: '#fff',
  padding: '12px 14px',
  fontSize: '13px',
  lineHeight: 1.5,
  marginTop: '10px',
};

const successLinkStyle: React.CSSProperties = {
  color: '#C8F135',
  fontWeight: 800,
};

const researchResultsStyle: React.CSSProperties = {
  background: '#0A0A0A',
  border: '1px solid rgba(200,241,53,0.24)',
  borderRadius: '14px',
  marginBottom: '18px',
  overflow: 'hidden',
};

const researchMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  flexWrap: 'wrap',
};

const warningInlineStyle: React.CSSProperties = {
  color: '#ffd166',
  fontSize: '12px',
  lineHeight: 1.45,
  overflowWrap: 'anywhere',
  flex: 1,
  minWidth: '220px',
};

const tableScrollStyle: React.CSSProperties = {
  overflowX: 'auto',
};

const keywordTableStyle: React.CSSProperties = {
  width: '100%',
  minWidth: '720px',
  borderCollapse: 'collapse',
};

const tableHeaderStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.52)',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  whiteSpace: 'nowrap',
};

const tableCellStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: '13px',
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'middle',
};

const tableCellStrongStyle: React.CSSProperties = {
  ...tableCellStyle,
  color: '#fff',
  fontWeight: 800,
};

const tableEmptyStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.58)',
  fontSize: '13px',
  padding: '18px 12px',
  textAlign: 'center',
};

