'use client';

import { useMemo, useState } from 'react';
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
import type { KeywordSuggestion } from '@/lib/keyword-planner';

const ORCHESTRATOR_DRAFT_STORAGE_KEY = 'calibre.orchestratorDraft.v1';

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
  const [tema, setTema] = useState('oculos de sol para rosto largo');
  const [siloPath, setSiloPath] = useState('formatos-de-oculos/rosto-largo');
  const [produtoId, setProdutoId] = useState(productCatalog[0]?.id ?? '');
  const [persona, setPersona] = useState('pessoa com rosto largo que sente que oculos comuns ficam pequenos ou apertados');
  const [problemaPrincipal, setProblemaPrincipal] = useState('armacoes comuns apertam nas temporas e parecem pequenas no rosto');
  const [jornadaNarrativa, setJornadaNarrativa] = useState('Jornada do Cliente');
  
  const [plannerQuery, setPlannerQuery] = useState('');
  const [plannerResults, setPlannerResults] = useState<KeywordSuggestion[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerWarning, setPlannerWarning] = useState('');
  const [plannerSource, setPlannerSource] = useState<'google-ads' | 'mock' | null>(null);
  const [writerProfile, setWriterProfile] = useState<ArticleWriterProfile>(() => getRandomArticleWriterProfile());

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
    tema,
    siloPath,
    produtoId,
    persona,
    problemaPrincipal,
    jornadaNarrativa,
    keywordPrincipal,
    keywordsSecundarias,
  }), [tema, siloPath, produtoId, persona, problemaPrincipal, jornadaNarrativa, keywordPrincipal, keywordsSecundarias]);

  const articleDraft = useMemo(() => buildArticleDraft({
    tema,
    persona,
    jornadaNarrativa,
    keywordPrincipal,
    keywordsObrigatorias: keywordsSecundarias.filter((keyword) => keyword.termo.trim()),
    produto: plan.produto,
    integracaoConteudo: plan.integracaoConteudo,
    profile: writerProfile,
  }), [tema, persona, jornadaNarrativa, keywordPrincipal, keywordsSecundarias, plan.produto, plan.integracaoConteudo, writerProfile]);

  async function handlePlannerSearch(q: string) {
    const query = q.trim();

    setPlannerQuery(query);
    setPlannerWarning('');
    setPlannerSource(null);

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
        setPlannerResults(relatedSuggestions);
        setKeywordsSecundarias(relatedSuggestions.map(suggestionToKeyword));
      setPlannerSource(result.source);
      setPlannerWarning(result.warning ?? '');
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
    });

    window.localStorage.setItem(ORCHESTRATOR_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    window.location.href = '/admin/posts/novo';
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

        <div style={formGridStyle}>
          <Field label="Tema base">
            <input value={tema} onChange={(event) => setTema(event.target.value)} style={inputStyle} />
          </Field>
          <Field label="Estrutura do silo">
            <input value={siloPath} onChange={(event) => setSiloPath(event.target.value)} style={inputStyle} />
          </Field>
          <Field label="Produto do catalogo">
            <select value={produtoId} onChange={(event) => setProdutoId(event.target.value)} style={inputStyle}>
              {productCatalog.map((product) => (
                <option key={product.id} value={product.id}>{product.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Estrutura narrativa">
            <select value={jornadaNarrativa} onChange={(event) => setJornadaNarrativa(event.target.value)} style={inputStyle}>
              {storytellingStructures.map((structure) => (
                <option key={structure} value={structure}>{structure}</option>
              ))}
            </select>
          </Field>
          <Field label="Persona">
            <textarea value={persona} onChange={(event) => setPersona(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <Field label="Problema principal">
            <textarea value={problemaPrincipal} onChange={(event) => setProblemaPrincipal(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
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
                    <th style={tableHeaderStyle}>Palavra-chave relacionada obrigatoria</th>
                    <th style={tableHeaderStyle}>Volume</th>
                    <th style={tableHeaderStyle}>Dificuldade</th>
                    <th style={tableHeaderStyle}>Intencao</th>
                    <th style={tableHeaderStyle}>Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {plannerLoading && (
                    <tr>
                      <td colSpan={5} style={tableEmptyStyle}>Consultando sugestoes relacionadas...</td>
                    </tr>
                  )}
                  {!plannerLoading && plannerResults.length === 0 && (
                    <tr>
                      <td colSpan={5} style={tableEmptyStyle}>Nenhuma cauda longa encontrada para esta busca.</td>
                    </tr>
                  )}
                  {!plannerLoading && plannerResults.map((suggestion) => (
                    <tr key={suggestion.termo}>
                      <td style={tableCellStrongStyle}>{suggestion.termo}</td>
                      <td style={tableCellStyle}>{suggestion.volumeMensal}</td>
                      <td style={tableCellStyle}>{suggestion.dificuldade}</td>
                      <td style={tableCellStyle}>{suggestion.intencao}</td>
                      <td style={tableCellStyle}>{suggestion.fonte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </section>

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
            <p style={hintStyle}>Rascunho gerado a partir do briefing do Integrador, com variacao editorial sorteada para evitar artigos sempre iguais.</p>
          </div>
          <div style={buttonGroupStyle}>
            <button type="button" onClick={() => setWriterProfile(getRandomArticleWriterProfile())} style={secondaryButtonStyle}>
              Nova variacao
            </button>
            <button type="button" onClick={prepareDraftInPostEditor} style={searchButtonStyle}>
              Abrir como post
            </button>
          </div>
        </div>

        <div style={writerMetaGridStyle}>
          <span style={writerBadgeStyle}>Perfil: {articleDraft.perfil.nome}</span>
          <span style={writerBadgeStyle}>Tamanho: {articleDraft.perfil.tamanho}</span>
          <span style={writerBadgeStyle}>Tecnica: {articleDraft.perfil.tecnica}</span>
          <span style={writerBadgeStyle}>Ritmo: {articleDraft.perfil.ritmo}</span>
        </div>

        <div style={writerSummaryStyle}>
          <strong>{articleDraft.titulo}</strong>
          <p>{articleDraft.resumo}</p>
        </div>

        <textarea readOnly value={articleDraft.conteudoMarkdown} style={draftStyle} />
      </section>
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

