"use client";

import { useState, useEffect, useRef } from "react";
import { faqs, specs, VAGAS_TOTAIS, type FAQ } from "./data";

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = target / 40;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 30);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}</span>;
}

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="faq-item"
      onClick={() => setOpen(!open)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="faq-header">
        <p className="faq-question">{faq.q}</p>
        <span
          className="faq-toggle"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </div>
      <div
        className="faq-answer-wrapper"
        style={{ maxHeight: open ? "300px" : "0px" }}
      >
        <p className="faq-answer">{faq.a}</p>
      </div>
    </div>
  );
}

// ─── Modal de Reserva ─────────────────────────────────────────────────────────

interface ReserveModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ReserveModal({ open, onClose, onSuccess }: ReserveModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [medida, setMedida] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Trava scroll do body quando o modal abre
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fecha com ESC
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
          produto: "MB-1572S",
          origem: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar. Tente novamente em instantes.");
        return;
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <span className="section-tag">Lista de espera · MB-1572S</span>
        <h3 className="modal-title">
          ENTRE NA <span className="hero-title-accent">LISTA</span>
        </h3>
        <p className="modal-subtitle">
          Reserva gratuita e sem compromisso. Avisamos por e-mail e WhatsApp
          quando o estoque chegar — você decide se quer fechar a compra.
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">
            Nome completo
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="modal-input"
              placeholder="Seu nome"
              autoFocus
            />
          </label>

          <label className="modal-label">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modal-input"
              placeholder="voce@email.com"
            />
          </label>

          <label className="modal-label">
            WhatsApp (com DDD)
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="modal-input"
              placeholder="(11) 98765-4321"
            />
          </label>

          <label className="modal-label">
            Medida da cabeça em mm <span className="modal-optional">(opcional)</span>
            <input
              type="text"
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
              className="modal-input"
              placeholder="Ex: 152mm"
            />
            <span className="modal-hint">
              Têmpora a têmpora, passando pela testa.
            </span>
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Garantir minha vaga"}
          </button>

          <p className="modal-disclaimer">
            🔒 Seus dados são usados apenas para te avisar do lançamento.
            Sem spam.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LandingClient() {
  const [selectedImg, setSelectedImg] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [vagasReservadas, setVagasReservadas] = useState<number | null>(null);

  useEffect(() => {
    // Registra o acesso
    fetch("/api/track", { method: "POST" }).catch(() => {});

    fetch("/api/leads/count")
      .then((r) => r.json())
      .then((d) => setVagasReservadas(typeof d.count === 'number' ? d.count : 0))
      .catch(() => setVagasReservadas(0));
  }, []);
  const vagasRestantes = vagasReservadas === null ? VAGAS_TOTAIS : Math.max(VAGAS_TOTAIS - vagasReservadas, 0);
  const percentual = vagasReservadas === null ? 0 : Math.min((vagasReservadas / VAGAS_TOTAIS) * 100, 100);

  const images = [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=90",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=90",
    "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=90",
    "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=90",
  ];

  const handleReserve = () => {
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setConfirmed(true);
    // Esconde a confirmação depois de 6s
    setTimeout(() => setConfirmed(false), 6000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --lime: #C8F135;
          --dark: #0A0A0A;
          --card: #111111;
          --border: rgba(255,255,255,0.08);
          --text: rgba(255,255,255,0.85);
          --muted: rgba(255,255,255,0.35);
        }

        html, body {
          background: var(--dark);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        .font-display { font-family: 'Bebas Neue', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-lime {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,241,53,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(200,241,53,0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .pulse-btn { animation: pulse-lime 2.5s infinite; }

        .grain::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 100;
          opacity: 0.4;
        }

        /* ── NAV ── */
        .nav {
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
        .nav-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 0.15em;
          color: white;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* ── BADGE ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200,241,53,0.08);
          border: 1px solid rgba(200,241,53,0.2);
          color: var(--lime);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 100px;
          text-transform: uppercase;
        }

        /* ── BUTTONS ── */
        .btn-primary {
          background: var(--lime);
          color: #0A0A0A;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 100px;
          padding: 16px 40px;
          cursor: pointer;
          width: 100%;
          transition: transform 0.15s, opacity 0.15s;
          text-transform: uppercase;
          font-family: inherit;
        }
        .btn-primary:hover { transform: scale(1.02); opacity: 0.92; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-nav {
          width: auto;
          padding: 10px 24px;
          font-size: 13px;
        }

        .btn-dark {
          background: #0A0A0A;
          color: var(--lime);
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 100px;
          padding: 18px 48px;
          cursor: pointer;
          text-transform: uppercase;
          font-family: inherit;
          transition: transform 0.15s;
        }
        .btn-dark:hover { transform: scale(1.03); }

        .section-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--lime);
          margin-bottom: 12px;
          display: block;
        }

        /* ── HERO ── */
        .hero {
          max-width: 1152px;
          margin: 0 auto;
          padding: 64px 24px 48px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .hero {
            grid-template-columns: 1fr 1fr;
          }
        }

        .hero-gallery {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        .hero-image-wrapper {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 1/1;
          position: relative;
        }
        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s;
        }
        .hero-badge {
          position: absolute;
          top: 16px;
          left: 16px;
        }
        .thumbnails {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .thumbnails { justify-content: flex-start; }
        }
        .img-thumb {
          border: 2px solid transparent;
          transition: border-color 0.2s, opacity 0.2s;
          cursor: pointer;
          opacity: 0.5;
          border-radius: 12px;
          overflow: hidden;
          width: 72px;
          height: 72px;
          background: var(--card);
          padding: 0;
        }
        .img-thumb.active {
          border-color: var(--lime);
          opacity: 1;
        }
        .img-thumb:hover { opacity: 0.8; }
        .img-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-info {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
        }
        @media (min-width: 768px) {
          .hero-info { text-align: left; margin: 0; }
        }

        .hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 8vw, 88px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: white;
          margin-bottom: 20px;
        }
        .hero-title-accent { color: var(--lime); }

        .hero-description {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 28px;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 768px) {
          .hero-description { margin-left: 0; margin-right: 0; }
        }
        .hero-description strong { color: var(--text); }

        .price-block { margin-bottom: 28px; }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 6px;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .price-row { justify-content: flex-start; }
        }
        .price-current {
          font-size: 48px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }
        .price-old {
          color: var(--muted);
          text-decoration: line-through;
          font-size: 18px;
        }
        .price-perks {
          color: var(--lime);
          font-size: 13px;
          font-weight: 600;
        }

        /* ── CONTADOR DE VAGAS ── */
        .seats-block {
          background: rgba(200,241,53,0.04);
          border: 1px solid rgba(200,241,53,0.15);
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
        }
        .seats-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
          gap: 12px;
        }
        .seats-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lime);
        }
        .seats-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: white;
          letter-spacing: 0.02em;
        }
        .seats-count strong { color: var(--lime); }
        .seats-bar {
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          overflow: hidden;
          position: relative;
        }
        .seats-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--lime), #a8d126);
          border-radius: 100px;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .seats-hint {
          color: var(--muted);
          font-size: 12px;
          margin-top: 8px;
        }
        .seats-hint strong { color: var(--text); }

        .secure-text {
          color: var(--muted);
          font-size: 12px;
          text-align: center;
          margin-top: 12px;
        }

        .trust-badges {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .trust-badges { justify-content: flex-start; }
        }
        .trust-badge {
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }

        /* ── CONFIRMAÇÃO ── */
        .confirm-toast {
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
          letter-spacing: 0.03em;
          z-index: 60;
          box-shadow: 0 12px 40px rgba(200,241,53,0.3);
          animation: slideDown 0.4s ease;
        }

        /* ── PROBLEMA ── */
        .problem-section {
          background: var(--card);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 80px 24px;
        }
        .problem-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .problem-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 64px);
          color: white;
          margin-bottom: 20px;
          line-height: 1.05;
        }
        .problem-text {
          color: var(--muted);
          max-width: 560px;
          margin: 0 auto 40px;
          line-height: 1.8;
        }
        .problem-text strong { color: var(--text); }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 640px;
          margin: 0 auto;
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
        .stat-card {
          background: var(--dark);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        .stat-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          color: var(--lime);
          line-height: 1;
        }
        .stat-label {
          color: var(--muted);
          font-size: 12px;
          margin-top: 8px;
          line-height: 1.5;
        }

        /* ── SPECS ── */
        .specs-section {
          max-width: 720px;
          margin: 0 auto;
          padding: 80px 24px;
          text-align: center;
        }
        .specs-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 52px);
          color: white;
          margin-bottom: 32px;
        }
        .specs-table {
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin: 0 auto;
          max-width: 480px;
        }
        .spec-row {
          display: flex;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .spec-row:last-child { border-bottom: none; }
        .spec-row:nth-child(even) { background: rgba(255,255,255,0.02); }
        .spec-label { color: var(--muted); font-size: 14px; }
        .spec-value { color: white; font-weight: 600; font-size: 14px; }

        /* ── CTA BAND ── */
        .cta-band {
          background: var(--lime);
          padding: 64px 24px;
          text-align: center;
        }
        .cta-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 7vw, 72px);
          color: #0A0A0A;
          margin-bottom: 12px;
          line-height: 1;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .cta-subtitle {
          color: rgba(0,0,0,0.6);
          margin-bottom: 32px;
          font-size: 16px;
        }

        /* ── FAQ ── */
        .faq-section {
          max-width: 640px;
          margin: 0 auto;
          padding: 80px 24px;
          text-align: center;
        }
        .faq-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 48px);
          color: white;
          margin-bottom: 32px;
        }
        .faq-item {
          border-bottom: 1px solid var(--border);
          padding: 20px 0;
          cursor: pointer;
          text-align: left;
        }
        .faq-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .faq-question {
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 0.02em;
        }
        .faq-toggle {
          color: var(--lime);
          font-size: 24px;
          flex-shrink: 0;
          transition: transform 0.3s;
          font-weight: 300;
        }
        .faq-answer-wrapper {
          overflow: hidden;
          transition: max-height 0.3s;
        }
        .faq-answer {
          color: var(--muted);
          font-size: 14px;
          margin-top: 12px;
          line-height: 1.6;
        }

        /* ── FOOTER ── */
        .footer {
          border-top: 1px solid var(--border);
          padding: 32px 24px;
          text-align: center;
        }
        .footer-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.1em;
          color: white;
        }
        .footer-text {
          color: var(--muted);
          font-size: 12px;
          margin-top: 8px;
        }
        .footer-text a { color: var(--muted); }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 24px;
          animation: fadeIn 0.25s ease;
        }
        .modal-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: scaleIn 0.3s ease;
        }
        @media (max-width: 480px) {
          .modal-card { padding: 28px 22px; border-radius: 20px; }
        }
        .modal-close {
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
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          font-family: inherit;
        }
        .modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 40px;
          color: white;
          line-height: 1;
          margin-bottom: 12px;
          letter-spacing: 0.02em;
        }
        .modal-subtitle {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .modal-optional {
          color: rgba(255,255,255,0.25);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .modal-input {
          background: var(--dark);
          border: 1px solid var(--border);
          color: white;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          transition: border-color 0.2s;
          outline: none;
        }
        .modal-input:focus {
          border-color: var(--lime);
        }
        .modal-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .modal-hint {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          margin-top: 2px;
        }
        .modal-error {
          color: #ff6b6b;
          font-size: 13px;
          background: rgba(255,107,107,0.08);
          border: 1px solid rgba(255,107,107,0.2);
          padding: 10px 14px;
          border-radius: 10px;
        }
        .modal-disclaimer {
          color: var(--muted);
          font-size: 11px;
          text-align: center;
          margin-top: 4px;
          line-height: 1.5;
        }
      `}</style>

      <div className="grain">

        {/* ── TOAST DE CONFIRMAÇÃO ── */}
        {confirmed && (
          <div className="confirm-toast">
            ✓ Vaga reservada! Avisaremos por e-mail.
          </div>
        )}

        {/* ── NAV ── */}
        <nav className="nav">
          <span className="nav-logo">CALIBRE</span>
          <div className="nav-actions">
            <span className="badge">🇧🇷 Frete grátis</span>
            <button onClick={handleReserve} className="btn-primary btn-nav pulse-btn">
              Reservar — Entrar na lista
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">

          {/* Vídeo principal */}
          <div className="hero-gallery fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="hero-image-wrapper">
              <video
                src="/Black_sunglasses_rotating_202604281055.mp4"
                className="hero-image"
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: 'auto', borderRadius: '16px', background: '#000' }}
              />
              <div className="badge hero-badge">✦ 150.7mm</div>
            </div>
          </div>

          {/* Info */}
          <div className="hero-info fade-up" style={{ animationDelay: "0.25s" }}>
            <span className="section-tag">Pré-lançamento · Lista de espera</span>

            <h1 className="hero-title">
              CALIBRE<br />
              <span className="hero-title-accent">MB-1572S</span>
            </h1>

            <p className="hero-description">
              O único óculos de sol masculino premium feito para quem sempre ficou de fora.
              <strong> 150.7mm de frontal.</strong> Acetato italiano. Sem apertar.
            </p>

            <div className="price-block">
              <div className="price-row">
                <span className="price-current">R$ 449</span>
                <span className="price-old">R$ 799</span>
              </div>
              <p className="price-perks">
                ✓ Frete grátis para todo o Brasil &nbsp;·&nbsp; ✓ 30 dias para trocar
              </p>
            </div>

            {/* Contador de vagas */}
            <div className="seats-block">
              <div className="seats-row">
                <span className="seats-label">Vagas da 1ª leva</span>
                <span className="seats-count">
                  <strong>
                    <AnimatedNumber target={vagasReservadas ?? 0} />
                  </strong>
                  {" / "}{VAGAS_TOTAIS}
                </span>
              </div>
              <div className="seats-bar">
                <div
                  className="seats-bar-fill"
                  style={{ width: `${percentual}%` }}
                />
              </div>
              <p className="seats-hint">
                <strong>{vagasRestantes} vaga{vagasRestantes === 1 ? '' : 's'} restante{vagasRestantes === 1 ? '' : 's'}</strong> · reservas
                têm prioridade quando o estoque chegar.
              </p>
            </div>

            <button onClick={handleReserve} className="btn-primary pulse-btn">
              Reservar minha vaga — Grátis
            </button>

            <p className="secure-text">
              🔒 Sem cobrança agora · você decide se quer comprar quando avisarmos
            </p>

            <div className="trust-badges">
              {["🎖️ Acetato premium", "☀️ UV400", "📦 Envio rápido", "↩️ 30 dias de garantia"].map((b) => (
                <span key={b} className="trust-badge">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEMA ── */}
        <section className="problem-section">
          <div className="problem-container">
            <span className="section-tag">O problema que o mercado ignorou</span>
            <h2 className="problem-title">
              95% DOS ÓCULOS <span className="hero-title-accent">NÃO FORAM<br />FEITOS PARA VOCÊ</span>
            </h2>
            <p className="problem-text">
              A maioria dos óculos vendidos no Brasil tem entre <strong>138mm e 145mm</strong> de frontal.
              Se sua cabeça passa de 150mm — e a de muitos passa —
              você simplesmente não existe para o mercado convencional.
            </p>

            <div className="stats-grid">
              {[
                { n: 95, suffix: "%", label: "dos óculos no Brasil têm menos de 145mm" },
                { n: 150, suffix: "mm", label: "o frontal mínimo que você precisava" },
                { n: 30, suffix: "dias", label: "de garantia. Sem perguntas." },
              ].map(({ n, suffix, label }) => (
                <div key={label} className="stat-card">
                  <div className="stat-number">
                    <AnimatedNumber target={n} />{suffix}
                  </div>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SPECS ── */}
        <section className="specs-section">
          <span className="section-tag">Especificações técnicas</span>
          <h2 className="specs-title">
            FEITO COM <span className="hero-title-accent">PRECISÃO</span>
          </h2>

          <div className="specs-table">
            {specs.map((s) => (
              <div key={s.label} className="spec-row">
                <span className="spec-label">{s.label}</span>
                <span className="spec-value">{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="cta-band">
          <h2 className="cta-title">PARA QUEM TEM PRESENÇA DE SOBRA</h2>
          <p className="cta-subtitle">
            Apenas {vagasRestantes} vagas restantes na primeira leva. Reserva grátis.
          </p>
          <button onClick={handleReserve} className="btn-dark">
            Entrar na lista — Grátis
          </button>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section">
          <span className="section-tag">Dúvidas frequentes</span>
          <h2 className="faq-title">
            PERGUNTAS <span className="hero-title-accent">FREQUENTES</span>
          </h2>
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <span className="footer-logo">CALIBRE</span>
          <p className="footer-text">
            © 2026 Calibre. Feito para quem tem presença de sobra. &nbsp;·&nbsp;
            <a href="mailto:contato@oculoscalibre.com.br">
              contato@oculoscalibre.com.br
            </a>
          </p>
        </footer>

        {/* ── MODAL ── */}
        <ReserveModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />

      </div>
    </>
  );
}
