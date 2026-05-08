import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import type { BlogPostView, BlogSiloSummary } from '@/lib/blog';

const headingFont = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function BlogPageChrome({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div style={pageStyle}>
      <div style={ambientGlowStyle} />
      <div style={ambientGlowSecondaryStyle} />
      <div style={shellStyle}>
        <BlogNav />
        <header style={heroStyle}>
          <span style={eyebrowStyle}>{eyebrow}</span>
          <h1 style={titleStyle}>{title}</h1>
          <p style={descriptionStyle}>{description}</p>
          {actions ? <div style={actionsStyle}>{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function BlogNav() {
  return (
    <nav style={navStyle}>
      <Link href="/" style={brandStyle}>
        CALIBRE
      </Link>
      <div style={navLinksStyle}>
        <Link href="/blog" style={navLinkStyle}>
          Blog
        </Link>
        <Link href="/admin/posts" style={navLinkStyle}>
          Admin de posts
        </Link>
      </div>
    </nav>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionSubtitleStyle}>{subtitle}</p>
    </div>
  );
}

export function SiloCard({ silo }: { silo: BlogSiloSummary }) {
  return (
    <article style={cardStyle}>
      <div style={cardTopStyle}>
        <span style={pillStyle}>Pillar page</span>
        <span style={metaStyle}>{silo.totalPosts} posts</span>
      </div>
      <h3 style={cardTitleStyle}>{silo.siloLabel}</h3>
      <p style={cardDescriptionStyle}>
        {silo.totalClusters > 0
          ? `${silo.totalClusters} subtemas conectados dentro deste silo.`
          : 'Silo principal pronto para receber conteúdos relacionados.'}
      </p>
      <div style={tagRowStyle}>
        {silo.clusters.slice(0, 3).map((cluster) => (
          <Link key={cluster.topicPath} href={cluster.href} style={tagLinkStyle}>
            {cluster.label}
          </Link>
        ))}
      </div>
      <div style={cardFooterStyle}>
        <span style={metaStyle}>
          {silo.latestPost ? `Último post em ${silo.latestPost.publishedLabel}` : 'Sem posts publicados ainda'}
        </span>
        <Link href={silo.href} style={primaryLinkStyle}>
          Abrir silo
        </Link>
      </div>
    </article>
  );
}

export function BlogPostCard({
  post,
  kicker,
}: {
  post: BlogPostView;
  kicker?: string;
}) {
  return (
    <article style={cardStyle}>
      <div style={cardTopStyle}>
        <span style={pillStyle}>{kicker ?? post.siloLabel}</span>
        <span style={metaStyle}>{post.readingTime} min</span>
      </div>
      <h3 style={cardTitleStyle}>{post.titulo}</h3>
      <p style={cardDescriptionStyle}>{post.resumo}</p>
      <div style={tagRowStyle}>
        {post.breadcrumbs.map((crumb) => (
          <Link key={crumb.href} href={crumb.href} style={tagLinkStyle}>
            {crumb.label}
          </Link>
        ))}
      </div>
      <div style={cardFooterStyle}>
        <span style={metaStyle}>{post.publishedLabel ?? 'Rascunho'}</span>
        <Link href={post.href} style={primaryLinkStyle}>
          Ler artigo
        </Link>
      </div>
    </article>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div style={emptyStateStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionSubtitleStyle}>{description}</p>
    </div>
  );
}

export function TwoColumnGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="blog-two-column" style={twoColumnGridStyle}>
      <div>{left}</div>
      <aside>{right}</aside>
    </div>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: '24px' }}>{children}</div>;
}

export const contentPanelStyle: CSSProperties = {
  background: 'rgba(255, 251, 245, 0.8)',
  border: '1px solid rgba(79, 55, 38, 0.12)',
  borderRadius: '28px',
  padding: '28px',
  boxShadow: '0 24px 80px rgba(72, 47, 28, 0.08)',
  backdropFilter: 'blur(18px)',
};

export const metaListStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
  color: '#5F564E',
  fontSize: '14px',
};

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #f8f1e8 0%, #fdfaf6 46%, #f4eadf 100%)',
  color: '#201A16',
  position: 'relative',
  overflow: 'hidden',
};

const ambientGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: 'auto auto 72% -8%',
  width: '340px',
  height: '340px',
  borderRadius: '999px',
  background: 'radial-gradient(circle, rgba(212,108,54,0.18) 0%, rgba(212,108,54,0) 72%)',
  pointerEvents: 'none',
};

const ambientGlowSecondaryStyle: CSSProperties = {
  position: 'absolute',
  inset: '12% -4% auto auto',
  width: '320px',
  height: '320px',
  borderRadius: '999px',
  background: 'radial-gradient(circle, rgba(32,125,127,0.16) 0%, rgba(32,125,127,0) 72%)',
  pointerEvents: 'none',
};

const shellStyle: CSSProperties = {
  width: 'min(1180px, calc(100vw - 32px))',
  margin: '0 auto',
  padding: '28px 0 56px',
  position: 'relative',
};

const navStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '0 4px 22px',
};

const brandStyle: CSSProperties = {
  color: '#201A16',
  textDecoration: 'none',
  letterSpacing: '0.28em',
  fontSize: '12px',
  fontWeight: 800,
};

const navLinksStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const navLinkStyle: CSSProperties = {
  color: '#5F564E',
  textDecoration: 'none',
  fontSize: '13px',
  padding: '10px 14px',
  borderRadius: '999px',
  border: '1px solid rgba(79, 55, 38, 0.12)',
  background: 'rgba(255,255,255,0.56)',
};

const heroStyle: CSSProperties = {
  padding: '12px 4px 34px',
  display: 'grid',
  gap: '16px',
};

const eyebrowStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#A14D26',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: headingFont,
  fontSize: 'clamp(3rem, 7vw, 5.4rem)',
  lineHeight: 0.94,
  maxWidth: '11ch',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: '760px',
  fontSize: '18px',
  lineHeight: 1.65,
  color: '#5F564E',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: headingFont,
  fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
  lineHeight: 1,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#6E6358',
  fontSize: '15px',
  lineHeight: 1.6,
};

const cardStyle: CSSProperties = {
  background: 'rgba(255, 251, 245, 0.82)',
  border: '1px solid rgba(79, 55, 38, 0.12)',
  borderRadius: '26px',
  padding: '22px',
  display: 'grid',
  gap: '16px',
  boxShadow: '0 22px 60px rgba(72, 47, 28, 0.08)',
};

const cardTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: headingFont,
  fontSize: '1.8rem',
  lineHeight: 1.05,
};

const cardDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: '15px',
  lineHeight: 1.68,
  color: '#5F564E',
};

const tagRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const tagLinkStyle: CSSProperties = {
  color: '#155E63',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 700,
  padding: '8px 12px',
  borderRadius: '999px',
  background: 'rgba(21, 94, 99, 0.08)',
};

const cardFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const pillStyle: CSSProperties = {
  color: '#A14D26',
  background: 'rgba(161, 77, 38, 0.08)',
  borderRadius: '999px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

const metaStyle: CSSProperties = {
  color: '#6E6358',
  fontSize: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const primaryLinkStyle: CSSProperties = {
  color: '#201A16',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '14px',
};

const emptyStateStyle: CSSProperties = {
  ...contentPanelStyle,
  textAlign: 'center',
};

const twoColumnGridStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  alignItems: 'start',
};
