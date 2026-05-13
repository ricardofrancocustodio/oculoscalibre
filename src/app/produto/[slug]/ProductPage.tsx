"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductCatalogItem } from "@/lib/catalog";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface RelatedProduct {
  id: string;
  nome: string;
  url: string;
  frontal: string;
  imagem: string;
  tag: string;
}

interface Props {
  product: ProductCatalogItem;
  related: RelatedProduct[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Reserva (cópia simplificada da landing)
// ─────────────────────────────────────────────────────────────────────────────

function ReserveModal({
  open,
  onClose,
  onSuccess,
  produto,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produto: string;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [medida, setMedida] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !email.trim() || !whatsapp.trim()) {
      setError("Preencha nome, e-mail e WhatsApp.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          medida: medida.trim(),
          produto,
          origem: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar.");
        return;
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="pp-modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <span className="pp-section-tag">Lista de espera · {produto}</span>
        <h3 className="pp-modal-title">
          ENTRE NA <span className="pp-accent">LISTA</span>
        </h3>
        <p className="pp-modal-subtitle">
          Reserva gratuita e sem compromisso. Avisamos por e-mail e WhatsApp
          quando o estoque chegar.
        </p>
        <form onSubmit={handleSubmit} className="pp-modal-form">
          <label className="pp-modal-label">
            Nome completo
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="pp-input"
              placeholder="Seu nome"
              autoFocus
            />
          </label>
          <label className="pp-modal-label">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pp-input"
              placeholder="voce@email.com"
            />
          </label>
          <label className="pp-modal-label">
            WhatsApp (com DDD)
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="pp-input"
              placeholder="(11) 98765-4321"
            />
          </label>
          <label className="pp-modal-label">
            Medida da cabeça em mm <span className="pp-optional">(opcional)</span>
            <input
              type="text"
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
              className="pp-input"
              placeholder="Ex: 152mm"
            />
          </label>
          {error && <p className="pp-error">{error}</p>}
          <button type="submit" className="pp-btn-primary" disabled={submitting}>
            {submitting ? "Enviando..." : "Garantir minha vaga"}
          </button>
          <p className="pp-disclaimer">
            🔒 Seus dados são usados apenas para te avisar do lançamento.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculadora de encaixe
// ─────────────────────────────────────────────────────────────────────────────

function getFrontalNumber(product: ProductCatalogItem): { min: number; max: number } {
  // Tenta achar frontal mínimo e máximo a partir das medidas
  const frontalRow = product.medidas.find((m) => m.label.toLowerCase().includes("frontal"));
  if (!frontalRow) return { min: 145, max: 158 };

  const allFrontals = product.medidas
    .filter((m) => m.label.toLowerCase().includes("frontal"))
    .map((m) => parseFloat(m.value.replace(/[^\d.]/g, "")))
    .filter((n) => !isNaN(n));

  if (allFrontals.length === 0) return { min: 145, max: 158 };

  return {
    min: Math.min(...allFrontals),
    max: Math.max(...allFrontals),
  };
}

function FitCalculator({ product }: { product: ProductCatalogItem }) {
  const [valor, setValor] = useState("");
  const { min, max } = useMemo(() => getFrontalNumber(product), [product]);

  // Regra: o frontal do óculos é ~ 25% da circunferência da cabeça em mm.
  // Para cabeças entre 56cm (560mm) e 64cm (640mm), o frontal ideal vai de ~140mm a ~160mm.
  // Aqui simplificamos: aceita entrada em mm ou cm.
  const resultado = useMemo(() => {
    const raw = parseFloat(valor.replace(",", ".").replace(/[^\d.]/g, ""));
    if (isNaN(raw) || raw <= 0) return null;
    // Se passou em cm, converte
    const mm = raw < 100 ? raw * 10 : raw;
    // Frontal ideal estimado a partir da circunferência
    const frontalIdeal = mm * 0.25;
    if (frontalIdeal < min - 4) {
      return {
        status: "small" as const,
        label: "Pode ficar grande",
        detail: `O ${product.nome} foi pensado para cabeças acima de ${(min * 4) / 10}cm de circunferência. Pode ficar oversized no seu rosto.`,
      };
    }
    if (frontalIdeal > max + 4) {
      return {
        status: "tight" as const,
        label: "Pode apertar",
        detail: `O frontal máximo do ${product.nome} é ${max}mm. Para sua medida (~${frontalIdeal.toFixed(0)}mm ideal), pode ficar apertado nas têmporas.`,
      };
    }
    return {
      status: "ok" as const,
      label: "Encaixe ideal ✓",
      detail: `O ${product.nome} (frontal ${min === max ? `${min}mm` : `${min}–${max}mm`}) deve encaixar bem em uma cabeça desse tamanho.`,
    };
  }, [valor, min, max, product.nome]);

  return (
    <div className="pp-calc">
      <span className="pp-section-tag">Calculadora de encaixe</span>
      <h3 className="pp-h3">
        CABE EM <span className="pp-accent">VOCÊ?</span>
      </h3>
      <p className="pp-muted-text">
        Digite a circunferência da sua cabeça (têmpora a têmpora, passando pela testa).
      </p>
      <div className="pp-calc-input-row">
        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ex: 60cm ou 600mm"
          className="pp-input pp-calc-input"
        />
      </div>
      {resultado && (
        <div className={`pp-calc-result pp-calc-result-${resultado.status}`}>
          <strong>{resultado.label}</strong>
          <span>{resultado.detail}</span>
        </div>
      )}
      <a href="/guia-de-medidas" className="pp-calc-link">
        Não sei minha medida → ver guia completo
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Galeria (vertical no desktop, horizontal no mobile)
// ─────────────────────────────────────────────────────────────────────────────

function ProductGallery({ images, nome, frontal }: { images: string[]; nome: string; frontal: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="pp-gallery">
      <div className="pp-thumbs">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            className={`pp-thumb ${active === i ? "pp-thumb-active" : ""}`}
            aria-label={`Imagem ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${nome} miniatura ${i + 1}`} />
          </button>
        ))}
      </div>
      <div className="pp-main-img-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${nome} — frontal ${frontal}`}
          className="pp-main-img"
        />
        <span className="pp-frontal-badge">✦ {frontal}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductPage({ product, related }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const images = product.imagens && product.imagens.length > 0
    ? product.imagens
    : product.imagemUrl
      ? [product.imagemUrl]
      : [];

  const frontalLabel = product.medidaReferencia.replace("Frontal ", "");
  const priceFmt = product.price ? `R$ ${product.price}` : null;
  const oldPrice = product.id === "mb-1572s" ? "R$ 799" : null;

  const trustBadges = [
    "📦 Frete grátis",
    "↩ 30 dias para troca",
    "☀ Proteção UV400",
    "✅ Certificação CE",
  ];

  const handleOpen = () => {
    setConfirmed(false);
    setModalOpen(true);
  };
  const handleSuccess = () => {
    setModalOpen(false);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 6000);
  };

  // Diferenciais por produto (3 cards)
  const diferenciais = product.beneficios.slice(0, 3).map((b, i) => ({
    titulo: ["FRONTAL AMPLO", "MATERIAL", "PROPÓSITO"][i],
    texto: b,
  }));

  // FAQs do produto (derivadas dos problemas + medida)
  const faqs = [
    {
      q: `O ${product.nome} cabe em cabeça grande?`,
      a: `Sim. O ${product.nome} foi pensado para rostos largos — ${product.medidaReferencia.toLowerCase()}, contra os 138–145mm dos modelos de mercado.`,
    },
    {
      q: "Como funciona a lista de espera?",
      a: "Você reserva gratuitamente sem cobrança. Quando o estoque chegar, avisamos por e-mail e WhatsApp na ordem da fila — você decide se quer fechar a compra.",
    },
    {
      q: "Vocês entregam para todo o Brasil?",
      a: "Sim, frete grátis para todo o território nacional. Trocas e devoluções em até 30 dias após o recebimento.",
    },
    {
      q: "Posso usar como óculos de grau?",
      a: "Sim, a armação aceita lentes de grau. Recomendamos levar a um óptico de confiança para a montagem.",
    },
  ];

  return (
    <>
      <style>{`
        :root {
          --lime: #C8F135;
          --dark: #0A0A0A;
          --card: #111111;
          --border: rgba(255,255,255,0.08);
          --text: rgba(255,255,255,0.85);
          --muted: rgba(255,255,255,0.35);
        }
        .pp-page {
          background: var(--dark);
          color: var(--text);
          min-height: 100vh;
          font-family: var(--font-dm), sans-serif;
        }
        .pp-accent { color: var(--lime); }

        /* NAV */
        .pp-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px);
          background: rgba(10,10,10,0.85);
          border-bottom: 1px solid var(--border);
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pp-logo {
          font-family: var(--font-bebas), sans-serif;
          font-size: 24px;
          letter-spacing: 0.15em;
          color: white;
          text-decoration: none;
        }
        .pp-nav-btn {
          background: var(--lime);
          color: #0A0A0A;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 100px;
          padding: 10px 24px;
          cursor: pointer;
          text-transform: uppercase;
          font-family: inherit;
        }

        /* BREADCRUMB */
        .pp-breadcrumb {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px 0;
          font-size: 12px;
          color: var(--muted);
        }
        .pp-breadcrumb a { color: var(--muted); text-decoration: none; }
        .pp-breadcrumb a:hover { color: white; }
        .pp-breadcrumb-sep { margin: 0 8px; }

        /* HERO */
        .pp-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 900px) {
          .pp-hero { grid-template-columns: 1.2fr 1fr; gap: 56px; }
        }

        /* GALERIA */
        .pp-gallery {
          display: flex;
          flex-direction: column-reverse;
          gap: 16px;
        }
        @media (min-width: 900px) {
          .pp-gallery {
            flex-direction: row;
            align-items: flex-start;
          }
        }
        .pp-thumbs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .pp-thumbs::-webkit-scrollbar { display: none; }
        @media (min-width: 900px) {
          .pp-thumbs {
            flex-direction: column;
            overflow: visible;
          }
        }
        .pp-thumb {
          width: 72px;
          height: 72px;
          flex-shrink: 0;
          border: 2px solid transparent;
          border-radius: 12px;
          overflow: hidden;
          background: var(--card);
          padding: 0;
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 0.2s, border-color 0.2s;
        }
        .pp-thumb:hover { opacity: 0.85; }
        .pp-thumb-active {
          border-color: var(--lime);
          opacity: 1;
        }
        .pp-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #1a1a1a;
        }
        .pp-main-img-wrapper {
          position: relative;
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 1/1;
          width: 100%;
        }
        .pp-main-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 16px;
        }
        .pp-frontal-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(200,241,53,0.12);
          border: 1px solid rgba(200,241,53,0.3);
          color: var(--lime);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 6px 14px;
          border-radius: 100px;
          text-transform: uppercase;
        }

        /* INFO */
        .pp-info { display: flex; flex-direction: column; gap: 16px; }
        .pp-section-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--lime);
          display: block;
        }
        .pp-title {
          font-family: var(--font-bebas), sans-serif;
          font-size: clamp(40px, 6vw, 64px);
          line-height: 1;
          letter-spacing: 0.02em;
          color: white;
        }
        .pp-subtitle {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
        }
        .pp-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--muted);
        }
        .pp-rating-stars { color: var(--lime); letter-spacing: 0.05em; }

        .pp-price-block {
          background: rgba(200,241,53,0.04);
          border: 1px solid rgba(200,241,53,0.15);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pp-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .pp-price-current {
          font-size: 42px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }
        .pp-price-old {
          color: var(--muted);
          text-decoration: line-through;
          font-size: 16px;
        }
        .pp-price-installments {
          color: var(--lime);
          font-size: 13px;
          font-weight: 600;
        }
        .pp-price-disclaimer {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }

        .pp-btn-primary {
          background: var(--lime);
          color: #0A0A0A;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 100px;
          padding: 16px 32px;
          cursor: pointer;
          width: 100%;
          text-transform: uppercase;
          font-family: inherit;
          transition: transform 0.15s, opacity 0.15s;
        }
        .pp-btn-primary:hover { transform: scale(1.02); opacity: 0.95; }
        .pp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .pp-btn-secondary {
          background: transparent;
          color: var(--lime);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.05em;
          border: 1px solid rgba(200,241,53,0.35);
          border-radius: 100px;
          padding: 12px 24px;
          cursor: pointer;
          text-transform: uppercase;
          font-family: inherit;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }
        .pp-btn-secondary:hover { background: var(--lime); color: #0A0A0A; }

        .pp-trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pp-trust-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 100px;
        }

        /* DIFERENCIAIS */
        .pp-diff-section {
          background: var(--card);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 64px 24px;
        }
        .pp-diff-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .pp-h2 {
          font-family: var(--font-bebas), sans-serif;
          font-size: clamp(32px, 5vw, 48px);
          color: white;
          letter-spacing: 0.02em;
          text-align: center;
          margin-bottom: 32px;
        }
        .pp-h3 {
          font-family: var(--font-bebas), sans-serif;
          font-size: clamp(28px, 4vw, 40px);
          color: white;
          letter-spacing: 0.02em;
          margin-bottom: 12px;
        }
        .pp-diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 720px) {
          .pp-diff-grid { grid-template-columns: 1fr; }
        }
        .pp-diff-card {
          background: var(--dark);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
        }
        .pp-diff-card-title {
          font-family: var(--font-bebas), sans-serif;
          color: var(--lime);
          font-size: 20px;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
        }
        .pp-diff-card-text {
          color: var(--text);
          font-size: 14px;
          line-height: 1.6;
        }

        /* SPECS */
        .pp-specs-section {
          max-width: 720px;
          margin: 0 auto;
          padding: 64px 24px;
          text-align: center;
        }
        .pp-specs-table {
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          max-width: 520px;
          margin: 0 auto;
        }
        .pp-spec-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 22px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .pp-spec-row:last-child { border-bottom: none; }
        .pp-spec-row:nth-child(even) { background: rgba(255,255,255,0.02); }
        .pp-spec-label { color: var(--muted); font-size: 14px; }
        .pp-spec-value { color: white; font-weight: 600; font-size: 14px; }

        /* CALCULADORA */
        .pp-calc-section {
          max-width: 640px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .pp-calc {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
        }
        .pp-muted-text {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .pp-calc-input-row { margin-bottom: 16px; }
        .pp-calc-input { text-align: center; font-size: 18px; }
        .pp-calc-result {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          text-align: left;
        }
        .pp-calc-result strong { font-size: 14px; }
        .pp-calc-result-ok {
          background: rgba(200,241,53,0.08);
          border: 1px solid rgba(200,241,53,0.25);
          color: var(--text);
        }
        .pp-calc-result-ok strong { color: var(--lime); }
        .pp-calc-result-tight {
          background: rgba(255,180,50,0.08);
          border: 1px solid rgba(255,180,50,0.25);
        }
        .pp-calc-result-tight strong { color: #ffb432; }
        .pp-calc-result-small {
          background: rgba(255,107,107,0.06);
          border: 1px solid rgba(255,107,107,0.2);
        }
        .pp-calc-result-small strong { color: #ff8585; }
        .pp-calc-link {
          color: var(--muted);
          font-size: 13px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .pp-calc-link:hover { color: var(--lime); }

        /* FAQ */
        .pp-faq-section {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .pp-faq-item {
          border-bottom: 1px solid var(--border);
          padding: 20px 0;
          cursor: pointer;
        }
        .pp-faq-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .pp-faq-q {
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          font-size: 15px;
        }
        .pp-faq-toggle {
          color: var(--lime);
          font-size: 22px;
          font-weight: 300;
          flex-shrink: 0;
          transition: transform 0.3s;
        }
        .pp-faq-wrap {
          overflow: hidden;
          transition: max-height 0.3s;
        }
        .pp-faq-a {
          color: var(--muted);
          font-size: 14px;
          margin-top: 12px;
          line-height: 1.6;
        }

        /* RELACIONADOS */
        .pp-related-section {
          background: var(--card);
          border-top: 1px solid var(--border);
          padding: 64px 24px;
        }
        .pp-related-container { max-width: 1100px; margin: 0 auto; }
        .pp-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 720px) {
          .pp-related-grid { grid-template-columns: 1fr; }
        }
        .pp-related-card {
          background: var(--dark);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s, transform 0.2s;
        }
        .pp-related-card:hover {
          border-color: rgba(200,241,53,0.35);
          transform: translateY(-3px);
        }
        .pp-related-img-wrap {
          aspect-ratio: 4/3;
          background: #111;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pp-related-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .pp-related-body { padding: 20px; }
        .pp-related-tag {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .pp-related-name {
          font-family: var(--font-bebas), sans-serif;
          color: white;
          font-size: 26px;
          letter-spacing: 0.04em;
          margin: 6px 0;
        }
        .pp-related-frontal {
          color: var(--lime);
          font-size: 13px;
          font-weight: 600;
        }

        /* CTA BAND */
        .pp-cta-band {
          background: var(--lime);
          padding: 56px 24px;
          text-align: center;
        }
        .pp-cta-title {
          font-family: var(--font-bebas), sans-serif;
          font-size: clamp(32px, 6vw, 56px);
          color: #0A0A0A;
          margin-bottom: 24px;
          line-height: 1;
        }
        .pp-cta-btn {
          background: #0A0A0A;
          color: var(--lime);
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 100px;
          padding: 16px 40px;
          cursor: pointer;
          text-transform: uppercase;
          font-family: inherit;
        }

        /* FOOTER */
        .pp-footer {
          border-top: 1px solid var(--border);
          padding: 32px 24px;
          text-align: center;
        }
        .pp-footer-logo {
          font-family: var(--font-bebas), sans-serif;
          font-size: 24px;
          letter-spacing: 0.1em;
          color: white;
        }
        .pp-footer-text {
          color: var(--muted);
          font-size: 12px;
          margin-top: 8px;
        }
        .pp-footer-text a { color: var(--muted); }

        /* MOBILE STICKY BAR */
        .pp-sticky-bar {
          display: none;
        }
        @media (max-width: 720px) {
          .pp-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(10,10,10,0.95);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            padding: 12px 16px;
            z-index: 40;
            align-items: center;
            gap: 12px;
          }
          .pp-sticky-price {
            font-family: var(--font-bebas), sans-serif;
            font-size: 22px;
            color: white;
            letter-spacing: 0.02em;
          }
          .pp-sticky-bar .pp-btn-primary {
            flex: 1;
            padding: 12px 20px;
            font-size: 13px;
          }
        }

        /* TOAST */
        .pp-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--lime);
          color: #0A0A0A;
          padding: 14px 24px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 14px;
          z-index: 60;
          box-shadow: 0 12px 40px rgba(200,241,53,0.3);
        }

        /* MODAL */
        .pp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 24px;
        }
        .pp-modal-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 36px;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        @media (max-width: 480px) {
          .pp-modal-card { padding: 28px 22px; border-radius: 20px; }
        }
        .pp-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: var(--muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          font-family: inherit;
        }
        .pp-modal-title {
          font-family: var(--font-bebas), sans-serif;
          font-size: 36px;
          color: white;
          line-height: 1;
          margin: 8px 0 12px;
          letter-spacing: 0.02em;
        }
        .pp-modal-subtitle {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .pp-modal-form { display: flex; flex-direction: column; gap: 14px; }
        .pp-modal-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .pp-optional {
          color: rgba(255,255,255,0.25);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .pp-input {
          background: var(--dark);
          border: 1px solid var(--border);
          color: white;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          width: 100%;
        }
        .pp-input:focus { border-color: var(--lime); }
        .pp-input::placeholder { color: rgba(255,255,255,0.25); }
        .pp-error {
          color: #ff6b6b;
          font-size: 13px;
          background: rgba(255,107,107,0.08);
          border: 1px solid rgba(255,107,107,0.2);
          padding: 10px 14px;
          border-radius: 10px;
        }
        .pp-disclaimer {
          color: var(--muted);
          font-size: 11px;
          text-align: center;
          line-height: 1.5;
        }
      `}</style>

      <div className="pp-page">
        {confirmed && (
          <div className="pp-toast">✓ Vaga reservada! Avisaremos por e-mail.</div>
        )}

        {/* NAV */}
        <nav className="pp-nav">
          <a href="/" className="pp-logo">CALIBRE</a>
          <button onClick={handleOpen} className="pp-nav-btn">
            Reservar
          </button>
        </nav>

        {/* BREADCRUMB */}
        <nav className="pp-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Início</a>
          <span className="pp-breadcrumb-sep">›</span>
          <a href="/#catalogo">Catálogo</a>
          <span className="pp-breadcrumb-sep">›</span>
          <span>{product.nome}</span>
        </nav>

        {/* HERO */}
        <section className="pp-hero">
          <ProductGallery images={images} nome={product.nome} frontal={frontalLabel} />

          <div className="pp-info">
            <span className="pp-section-tag">
              {product.stock === "PreOrder" ? "Pré-lançamento" : product.categoria}
            </span>
            <h1 className="pp-title">
              {product.nome.split(" ").map((word, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 0 ? "CALIBRE" : null}
                  {i === 0 && <br />}
                  <span className="pp-accent">{word}</span>{i < product.nome.split(" ").length - 1 ? " " : ""}
                </span>
              )).slice(0, 2)}
            </h1>
            <p className="pp-subtitle">{product.descricao}</p>

            {priceFmt ? (
              <div className="pp-price-block">
                <div className="pp-price-row">
                  <span className="pp-price-current">{priceFmt}</span>
                  {oldPrice && <span className="pp-price-old">{oldPrice}</span>}
                </div>
                <span className="pp-price-installments">
                  Em até 9x sem juros · Frete grátis para todo o Brasil
                </span>
                <span className="pp-price-disclaimer">
                  🔒 Reserva grátis. Sem cobrança agora.
                </span>
              </div>
            ) : (
              <div className="pp-price-block">
                <span className="pp-price-installments">
                  Pré-lançamento — entre na lista de espera
                </span>
                <span className="pp-price-disclaimer">
                  🔒 Reserva grátis. Avisaremos quando o estoque chegar.
                </span>
              </div>
            )}

            <button onClick={handleOpen} className="pp-btn-primary">
              {product.stock === "InStock"
                ? "Comprar agora"
                : "Reservar minha vaga — Grátis"}
            </button>

            <div className="pp-trust-row">
              {trustBadges.map((b) => (
                <span key={b} className="pp-trust-pill">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="pp-diff-section">
          <div className="pp-diff-container">
            <h2 className="pp-h2">
              POR QUE O <span className="pp-accent">{product.nome.split(" ")[0].toUpperCase()}</span>
            </h2>
            <div className="pp-diff-grid">
              {diferenciais.map((d, i) => (
                <div key={i} className="pp-diff-card">
                  <div className="pp-diff-card-title">{d.titulo}</div>
                  <p className="pp-diff-card-text">{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPECS */}
        <section className="pp-specs-section">
          <span className="pp-section-tag">Especificações técnicas</span>
          <h2 className="pp-h2">
            FEITO COM <span className="pp-accent">PRECISÃO</span>
          </h2>
          <div className="pp-specs-table">
            {product.medidas.map((m) => (
              <div key={m.label} className="pp-spec-row">
                <span className="pp-spec-label">{m.label}</span>
                <span className="pp-spec-value">{m.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CALCULADORA */}
        <section className="pp-calc-section">
          <FitCalculator product={product} />
        </section>

        {/* FAQ */}
        <section className="pp-faq-section">
          <span className="pp-section-tag">Perguntas frequentes</span>
          <h2 className="pp-h2" style={{ textAlign: "left", marginTop: 8 }}>
            DÚVIDAS <span className="pp-accent">FREQUENTES</span>
          </h2>
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </section>

        {/* RELACIONADOS */}
        {related.length > 0 && (
          <section className="pp-related-section">
            <div className="pp-related-container">
              <h2 className="pp-h2">
                OUTROS <span className="pp-accent">MODELOS</span>
              </h2>
              <div className="pp-related-grid">
                {related.map((r) => (
                  <a key={r.id} href={r.url} className="pp-related-card">
                    <div className="pp-related-img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.imagem} alt={r.nome} className="pp-related-img" />
                    </div>
                    <div className="pp-related-body">
                      <span className="pp-related-tag">{r.tag}</span>
                      <div className="pp-related-name">{r.nome}</div>
                      <span className="pp-related-frontal">Frontal {r.frontal}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA BAND */}
        <section className="pp-cta-band">
          <h2 className="pp-cta-title">PARA QUEM TEM PRESENÇA DE SOBRA</h2>
          <button onClick={handleOpen} className="pp-cta-btn">
            Entrar na lista — Grátis
          </button>
        </section>

        {/* FOOTER */}
        <footer className="pp-footer">
          <span className="pp-footer-logo">CALIBRE</span>
          <p className="pp-footer-text">
            © 2026 Calibre. &nbsp;·&nbsp;
            <a href="mailto:contato@oculoscalibre.com.br">contato@oculoscalibre.com.br</a>
            &nbsp;·&nbsp;
            <a href="/guia-de-medidas">Guia de medidas</a>
          </p>
        </footer>

        {/* STICKY BAR (mobile) */}
        <div className="pp-sticky-bar">
          {priceFmt && <span className="pp-sticky-price">{priceFmt}</span>}
          <button onClick={handleOpen} className="pp-btn-primary">
            {product.stock === "InStock" ? "Comprar" : "Reservar"}
          </button>
        </div>

        <ReserveModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
          produto={product.nome}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-faq-item" onClick={() => setOpen(!open)}>
      <div className="pp-faq-header">
        <p className="pp-faq-q">{q}</p>
        <span
          className="pp-faq-toggle"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </div>
      <div className="pp-faq-wrap" style={{ maxHeight: open ? "300px" : "0px" }}>
        <p className="pp-faq-a">{a}</p>
      </div>
    </div>
  );
}
