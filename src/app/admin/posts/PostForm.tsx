'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { MarkdownPreview } from './MarkdownPreview';
import { normalizeTopicPath, parsePostPath } from '@/lib/slug';

const ORCHESTRATOR_DRAFT_STORAGE_KEY = 'calibre.orchestratorDraft.v1';

interface StoredOrchestratorDraft {
  titulo?: string;
  resumo?: string;
  conteudo?: string;
  tags?: string;
  topicPath?: string;
  slug?: string;
}

interface PostFormProps {
  mode: 'criar' | 'editar';
  initial?: {
    id: number;
    slug: string;
    titulo: string;
    resumo: string;
    conteudo_md: string;
    capa_url: string | null;
    tags: string[];
    autor: string;
    publicado: boolean;
  };
  action: (formData: FormData) => Promise<void> | void;
  publishLabel?: string;
}

export function PostForm({ mode, initial, action, publishLabel }: PostFormProps) {
  const initialPath = parsePostPath(initial?.slug ?? '');
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [topicPath, setTopicPath] = useState(initialPath.topicPath);
  const [slug, setSlug] = useState(initialPath.articleSlug || initial?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPath.articleSlug || initial?.slug));
  const [resumo, setResumo] = useState(initial?.resumo ?? '');
  const [conteudo, setConteudo] = useState(initial?.conteudo_md ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [autor, setAutor] = useState(initial?.autor ?? 'Calibre');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== 'criar' || initial) return;

    const rawDraft = window.localStorage.getItem(ORCHESTRATOR_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as StoredOrchestratorDraft;
      if (draft.titulo) setTitulo(draft.titulo);
      if (draft.resumo) setResumo(draft.resumo);
      if (draft.conteudo) setConteudo(draft.conteudo);
      if (draft.tags) setTags(draft.tags);
      if (draft.topicPath) setTopicPath(normalizeTopicPath(draft.topicPath));
      if (draft.slug) {
        setSlug(autoSlug(draft.slug));
        setSlugTouched(true);
      }
    } finally {
      window.localStorage.removeItem(ORCHESTRATOR_DRAFT_STORAGE_KEY);
    }
  }, [initial, mode]);

  function autoSlug(value: string) {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  function onTituloChange(v: string) {
    setTitulo(v);
    if (!slugTouched) setSlug(autoSlug(v));
  }

  function submit(e: React.FormEvent<HTMLFormElement>, intent: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('action', intent);
    startTransition(() => {
      void action(fd);
    });
  }

  return (
    <form
      onSubmit={(e) => submit(e, mode === 'criar' ? 'rascunho' : 'salvar')}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <Field label="Título">
        <input
          required
          name="titulo"
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Estrutura do silo e slug do artigo">
        <input
          required={mode === 'criar'}
          name="topic_path"
          value={topicPath}
          onChange={(e) => setTopicPath(normalizeTopicPath(e.target.value))}
          placeholder="guia-de-estilo/armacoes-retangulares"
          style={{ ...inputStyle, marginBottom: '10px' }}
        />
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(autoSlug(e.target.value));
            setSlugTouched(true);
          }}
          placeholder="gerado-do-titulo"
          style={inputStyle}
        />
        <p style={hintStyle}>
          Estrutura do silo: página pilar + subtemas separados por <code>/</code>.
        </p>
        <p style={hintStyle}>
          URL final: <code style={{ color: '#C8F135' }}>/blog/{topicPath ? `${topicPath}/` : ''}{slug || 'slug-aqui'}</code>
        </p>
      </Field>

      <Field label="Resumo (aparece na lista e meta description)">
        <textarea
          required
          name="resumo"
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          rows={3}
          maxLength={280}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
        <p style={hintStyle}>{resumo.length}/280</p>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Field label="Autor">
          <input name="autor" value={autor} onChange={(e) => setAutor(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Tags (separadas por vírgula)">
          <input
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="óculos, moda, dicas"
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Capa (imagem)">
        {initial?.capa_url && (
          <div style={{ marginBottom: '8px' }}>
            <Image
              src={initial.capa_url}
              alt="Capa atual"
              width={240}
              height={126}
              style={{ width: '240px', height: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
              unoptimized
            />
            <label style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <input type="checkbox" name="remover_capa" /> Remover capa atual
            </label>
          </div>
        )}
        <input type="file" name="capa" accept="image/*" style={{ ...inputStyle, padding: '6px' }} />
        <p style={hintStyle}>JPG / PNG / WebP. Recomendado 1200×630.</p>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', minHeight: '400px' }}>
        <Field label="Conteúdo (Markdown)">
          <textarea
            required
            name="conteudo_md"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: '420px',
              resize: 'vertical',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '13px',
              lineHeight: '1.5',
            }}
          />
        </Field>

        <Field label="Preview">
          <div
            style={{
              ...inputStyle,
              minHeight: '420px',
              overflow: 'auto',
              background: '#0d0d0d',
            }}
          >
            <MarkdownPreview source={conteudo} />
          </div>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={pending}
          style={btnStyle('secondary')}
        >
          {pending ? '...' : mode === 'criar' ? 'Salvar rascunho' : 'Salvar'}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            const form = (e.currentTarget as HTMLButtonElement).form;
            if (!form) return;
            const fd = new FormData(form);
            fd.set('action', initial?.publicado ? 'salvar' : 'publicar');
            startTransition(() => {
              void action(fd);
            });
          }}
          style={btnStyle('primary')}
        >
          {pending
            ? '...'
            : publishLabel ?? (initial?.publicado ? 'Salvar (já publicado)' : 'Publicar')}
        </button>

        {initial?.publicado && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLButtonElement).form;
              if (!form) return;
              const fd = new FormData(form);
              fd.set('action', 'despublicar');
              startTransition(() => {
                void action(fd);
              });
            }}
            style={btnStyle('ghost')}
          >
            Despublicar
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color: '#fff',
  padding: '10px 12px',
  fontSize: '14px',
  width: '100%',
  fontFamily: 'inherit',
};

const hintStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.4)',
};

function btnStyle(variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties {
  if (variant === 'primary') {
    return {
      background: '#C8F135',
      color: '#0A0A0A',
      border: 'none',
      borderRadius: '100px',
      padding: '10px 24px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      letterSpacing: '0.05em',
    };
  }
  if (variant === 'ghost') {
    return {
      background: 'transparent',
      color: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '100px',
      padding: '10px 24px',
      fontSize: '13px',
      cursor: 'pointer',
    };
  }
  return {
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '100px',
    padding: '10px 24px',
    fontSize: '13px',
    cursor: 'pointer',
  };
}
