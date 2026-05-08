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

function emptyKeyword(): KeywordCandidate {
  return {
    termo: '',
    intencao: '',
    volumeMensal: '',
    fonteVolume: '',
    dificuldade: '',
  };
}

export function OrchestratorWorkspace() {
  const [tema, setTema] = useState('oculos de sol para rosto largo');
  const [siloPath, setSiloPath] = useState('formatos-de-oculos/rosto-largo');
  const [produtoId, setProdutoId] = useState(productCatalog[0]?.id ?? '');
  const [persona, setPersona] = useState('pessoa com rosto largo que sente que oculos comuns ficam pequenos ou apertados');
  const [problemaPrincipal, setProblemaPrincipal] = useState('armacoes comuns apertam nas temporas e parecem pequenas no rosto');
  const [jornadaNarrativa, setJornadaNarrativa] = useState('Jornada do Cliente');
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

  function updateSecondaryKeyword(index: number, patch: Partial<KeywordCandidate>) {
    setKeywordsSecundarias((current) => current.map((keyword, itemIndex) => (
      itemIndex === index ? { ...keyword, ...patch } : keyword
    )));
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
        <h2 style={subtitleStyle}>Keywords Researcher</h2>
        <p style={hintStyle}>Preencha volume real e fonte depois de validar em Google Keyword Planner, Search Console, Semrush, Ahrefs ou ferramenta equivalente.</p>

        <div style={keywordGridStyle}>
          <KeywordFields
            label="Keyword principal"
            keyword={keywordPrincipal}
            onChange={(patch) => setKeywordPrincipal((current) => ({ ...current, ...patch }))}
          />
          {keywordsSecundarias.map((keyword, index) => (
            <KeywordFields
              key={index}
              label={`Keyword secundaria ${index + 1}`}
              keyword={keyword}
              onChange={(patch) => updateSecondaryKeyword(index, patch)}
            />
          ))}
        </div>
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
    </div>
  );
}

function KeywordFields({
  label,
  keyword,
  onChange,
}: {
  label: string;
  keyword: KeywordCandidate;
  onChange: (patch: Partial<KeywordCandidate>) => void;
}) {
  return (
    <div style={keywordPanelStyle}>
      <h3 style={smallTitleStyle}>{label}</h3>
      <input placeholder="termo" value={keyword.termo} onChange={(event) => onChange({ termo: event.target.value })} style={inputStyle} />
      <input placeholder="intencao de busca" value={keyword.intencao} onChange={(event) => onChange({ intencao: event.target.value })} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <input placeholder="volume mensal real" value={keyword.volumeMensal} onChange={(event) => onChange({ volumeMensal: event.target.value })} style={inputStyle} />
        <input placeholder="dificuldade" value={keyword.dificuldade} onChange={(event) => onChange({ dificuldade: event.target.value })} style={inputStyle} />
      </div>
      <input placeholder="fonte do volume" value={keyword.fonteVolume} onChange={(event) => onChange({ fonteVolume: event.target.value })} style={inputStyle} />
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

const keywordGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '14px',
};

const keywordPanelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '16px',
  display: 'grid',
  gap: '10px',
};

const smallTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '14px',
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
