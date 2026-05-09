import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/db';
import { getFlatPosts, listSilos, toBlogPostView } from '@/lib/blog';
import { BlogPageChrome, BlogPostCard, EmptyState, SectionTitle, SiloCard, Stack, contentPanelStyle } from './_components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog Calibre — guias sobre óculos para rosto largo',
  description:
    'Conteúdos editoriais organizados em silos sobre medidas, conforto e escolha de óculos para rostos com têmpora a partir de 145mm. Pillar pages, subtemas e artigos conectados.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: 'Blog Calibre — guias sobre óculos para rosto largo',
    description:
      'Pillar pages e subtemas sobre medidas, encaixe e escolha de óculos para rosto largo. Arquitetura de silos com interlinking interno.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Calibre — guias sobre óculos para rosto largo',
    description:
      'Pillar pages e subtemas sobre medidas, encaixe e escolha de óculos para rosto largo.',
  },
};

export default async function BlogHomePage() {
  const posts = await getPublishedPosts();
  const silos = listSilos(posts);
  const recentPosts = posts.map(toBlogPostView).slice(0, 6);
  const legacyPosts = getFlatPosts(posts);

  return (
    <BlogPageChrome
      eyebrow="Blog Calibre"
      title="Silos prontos para construir autoridade temática"
      description="O blog agora nasce com páginas-pilar, trilhas hierárquicas e interlinking focado dentro de cada tema. O objetivo é publicar conteúdos que reforçam o assunto principal sem misturar intenções." 
      actions={
        <>
          <Link href="/admin/posts" style={primaryButtonStyle}>
            Gerenciar posts
          </Link>
          <Link href="/" style={secondaryButtonStyle}>
            Voltar ao site
          </Link>
        </>
      }
    >
      <Stack>
        <section style={contentPanelStyle}>
          <SectionTitle
            title="Como estamos organizando o blog"
            subtitle="Cada silo concentra seus próprios artigos, subtemas e páginas de contexto. Os links laterais e os relacionados respeitam essa fronteira para fortalecer a relevância sem dispersar autoridade."
          />
          <div style={principlesGridStyle}>
            <article style={principleCardStyle}>
              <span style={principleNumberStyle}>01</span>
              <h3 style={principleTitleStyle}>Diretórios hierárquicos</h3>
              <p style={principleTextStyle}>Posts publicados em estruturas como /blog/tema/subtema/artigo, com a página do tema funcionando como pilar.</p>
            </article>
            <article style={principleCardStyle}>
              <span style={principleNumberStyle}>02</span>
              <h3 style={principleTitleStyle}>Interlinking interno</h3>
              <p style={principleTextStyle}>Cada artigo aponta de volta para o pilar do silo e sugere leituras relacionadas dentro do mesmo grupo temático.</p>
            </article>
            <article style={principleCardStyle}>
              <span style={principleNumberStyle}>03</span>
              <h3 style={principleTitleStyle}>Escala organizada</h3>
              <p style={principleTextStyle}>O admin passa a aceitar a trilha do silo separada do slug do artigo, então o crescimento não vira um diretório plano.</p>
            </article>
          </div>
        </section>

        <section>
          <SectionTitle
            title="Silos ativos"
            subtitle="As páginas-pilar abaixo agrupam os conteúdos publicados por tema principal."
          />
          {silos.length === 0 ? (
            <EmptyState
              title="Nenhum silo publicado ainda"
              description="Crie ou edite um post no admin e preencha a estrutura do silo para começar a publicar com URLs hierárquicas."
            />
          ) : (
            <div style={cardsGridStyle}>
              {silos.map((silo) => (
                <SiloCard key={silo.siloSlug} silo={silo} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            title="Artigos mais recentes"
            subtitle="Os conteúdos recentes continuam acessíveis pela home do blog, mas o aprofundamento acontece sempre dentro de cada silo."
          />
          {recentPosts.length === 0 ? (
            <EmptyState
              title="Ainda não há artigos publicados"
              description="Quando você publicar os primeiros posts, eles aparecerão aqui já conectados ao pilar correspondente."
            />
          ) : (
            <div style={cardsGridStyle}>
              {recentPosts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        {legacyPosts.length > 0 ? (
          <section style={contentPanelStyle}>
            <SectionTitle
              title="Artigos legados"
              subtitle="Posts antigos sem trilha de silo continuam acessíveis. Ao editar, basta preencher a estrutura do silo para incorporá-los à arquitetura nova."
            />
            <div style={cardsGridStyle}>
              {legacyPosts.map((post) => (
                <BlogPostCard key={post.slug} post={post} kicker="Legado" />
              ))}
            </div>
          </section>
        ) : null}
      </Stack>
    </BlogPageChrome>
  );
}

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '18px',
};

const principlesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
};

const principleCardStyle = {
  borderRadius: '22px',
  padding: '20px',
  background: 'rgba(255,255,255,0.58)',
  border: '1px solid rgba(79, 55, 38, 0.1)',
  display: 'grid',
  gap: '10px',
};

const principleNumberStyle = {
  color: '#A14D26',
  fontWeight: 800,
  letterSpacing: '0.18em',
  fontSize: '12px',
};

const principleTitleStyle = {
  margin: 0,
  fontSize: '20px',
  lineHeight: 1.1,
};

const principleTextStyle = {
  margin: 0,
  color: '#5F564E',
  fontSize: '14px',
  lineHeight: 1.7,
};

const primaryButtonStyle = {
  color: '#fff',
  background: '#201A16',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '14px',
};

const secondaryButtonStyle = {
  color: '#201A16',
  background: 'rgba(255,255,255,0.58)',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '14px',
  border: '1px solid rgba(79, 55, 38, 0.12)',
};
