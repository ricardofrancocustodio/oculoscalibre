import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { filterPostsForTopic, getRelatedPosts, toBlogPostView } from '@/lib/blog';
import { getPostBySlug, getPublishedPosts, type Post } from '@/lib/db';
import { MarkdownRenderer } from '@/lib/markdown';
import { humanizeSlugSegment } from '@/lib/slug';
import {
  BlogPageChrome,
  BlogPostCard,
  EmptyState,
  SectionTitle,
  Stack,
  TwoColumnGrid,
  contentPanelStyle,
  metaListStyle,
} from '../_components';

export const dynamic = 'force-dynamic';

export default async function BlogEntryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const requestedPath = slug.join('/');
  const exactPost = await getPostBySlug(requestedPath);

  if (exactPost && !exactPost.publicado) {
    notFound();
  }

  const posts = await getPublishedPosts();

  if (exactPost?.publicado) {
    return <PostPage post={exactPost} posts={posts} />;
  }

  const topicPosts = filterPostsForTopic(posts, requestedPath);
  if (topicPosts.length === 0) {
    notFound();
  }

  return <TopicPage topicPath={requestedPath} posts={topicPosts} />;
}

function TopicPage({ topicPath, posts }: { topicPath: ReturnType<typeof filterPostsForTopic>[number]['topicPath']; posts: ReturnType<typeof filterPostsForTopic> }) {
  const segments = topicPath.split('/').filter(Boolean);
  const title = humanizeSlugSegment(segments[segments.length - 1] ?? topicPath);
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join('/') : null;
  const childTopics = collectImmediateChildTopics(posts, segments);

  return (
    <BlogPageChrome
      eyebrow={segments.length === 1 ? 'Pillar page' : 'Subtema do silo'}
      title={title}
      description={`Esta página concentra ${posts.length} artigo${posts.length === 1 ? '' : 's'} do caminho /${topicPath}. Todos os links abaixo permanecem dentro do mesmo contexto temático.`}
      actions={
        parentPath ? (
          <Link href={`/blog/${parentPath}`} style={buttonStyle}>
            Voltar para {humanizeSlugSegment(segments[segments.length - 2] ?? '')}
          </Link>
        ) : (
          <Link href="/blog" style={buttonStyle}>
            Ver todos os silos
          </Link>
        )
      }
    >
      <Stack>
        <TwoColumnGrid
          left={
            <section style={contentPanelStyle}>
              <SectionTitle
                title="Conteúdos deste tema"
                subtitle="A partir daqui o blog aprofunda o mesmo assunto com URLs encadeadas e navegação interna preservada."
              />
              <div style={cardsGridStyle}>
                {posts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} kicker={post.topicLabel ?? post.siloLabel} />
                ))}
              </div>
            </section>
          }
          right={
            <Stack>
              <section style={contentPanelStyle}>
                <SectionTitle
                  title="Leitura guiada"
                  subtitle="Use esta página como pilar para conectar conteúdos do mesmo tema sem dispersar a navegação."
                />
                <div style={metaListStyle}>
                  <span>{posts.length} artigo{posts.length === 1 ? '' : 's'} relacionados</span>
                  <span>{childTopics.length} subtema{childTopics.length === 1 ? '' : 's'} detectado{childTopics.length === 1 ? '' : 's'}</span>
                  <span>URL pilar: /blog/{topicPath}</span>
                </div>
              </section>

              {childTopics.length > 0 ? (
                <section style={contentPanelStyle}>
                  <SectionTitle
                    title="Subtemas conectados"
                    subtitle="Os atalhos abaixo aprofundam o mesmo silo com mais especificidade."
                  />
                  <div style={topicLinksStyle}>
                    {childTopics.map((childTopic) => (
                      <Link key={childTopic.path} href={`/blog/${childTopic.path}`} style={topicLinkStyle}>
                        <strong>{childTopic.label}</strong>
                        <span>{childTopic.count} posts</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </Stack>
          }
        />
      </Stack>
    </BlogPageChrome>
  );
}

function PostPage({ post, posts }: { post: Post; posts: Post[] }) {
  const view = toBlogPostView(post);
  const relatedPosts = getRelatedPosts(posts, post.slug, 3);

  return (
    <BlogPageChrome
      eyebrow={view.siloLabel}
      title={view.titulo}
      description={view.resumo}
      actions={
        <div style={breadcrumbsStyle}>
          <Link href="/blog" style={ghostLinkStyle}>
            Blog
          </Link>
          {view.breadcrumbs.map((crumb) => (
            <Link key={crumb.href} href={crumb.href} style={ghostLinkStyle}>
              {crumb.label}
            </Link>
          ))}
        </div>
      }
    >
      <Stack>
        <TwoColumnGrid
          left={
            <section style={contentPanelStyle}>
              <div style={articleMetaRowStyle}>
                <span>{view.publishedLabel ?? 'Sem data'}</span>
                <span>{view.readingTime} min de leitura</span>
                <span>{view.autor}</span>
              </div>
              {view.capa_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={view.capa_url} alt={view.titulo} style={coverStyle} />
              ) : null}
              <article style={articleBodyStyle}>
                <MarkdownRenderer source={view.conteudo_md} />
              </article>
            </section>
          }
          right={
            <Stack>
              <section style={contentPanelStyle}>
                <SectionTitle
                  title="Navegação do silo"
                  subtitle="A leitura sempre retorna para o contexto temático principal."
                />
                <div style={metaListStyle}>
                  {view.breadcrumbs.map((crumb) => (
                    <Link key={crumb.href} href={crumb.href} style={sideNavLinkStyle}>
                      {crumb.label}
                    </Link>
                  ))}
                  <Link href="/blog" style={sideNavLinkStyle}>
                    Todos os silos
                  </Link>
                </div>
              </section>

              {view.tags.length > 0 ? (
                <section style={contentPanelStyle}>
                  <SectionTitle title="Tags" subtitle="Marcadores úteis para enriquecer o contexto sem quebrar a arquitetura principal." />
                  <div style={tagsStyle}>
                    {view.tags.map((tag) => (
                      <span key={tag} style={tagStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </Stack>
          }
        />

        <section>
          <SectionTitle
            title="Leia em seguida"
            subtitle="Sugestões do mesmo silo para manter a autoridade temática concentrada."
          />
          {relatedPosts.length === 0 ? (
            <EmptyState
              title="Sem relacionados ainda"
              description="Quando houver mais artigos dentro deste silo, eles aparecerão aqui para reforçar o interlinking interno."
            />
          ) : (
            <div style={cardsGridStyle}>
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard key={relatedPost.slug} post={relatedPost} kicker="Mesmo silo" />
              ))}
            </div>
          )}
        </section>
      </Stack>
    </BlogPageChrome>
  );
}

function collectImmediateChildTopics(
  posts: ReturnType<typeof filterPostsForTopic>,
  currentSegments: string[],
) {
  const childTopics = new Map<string, { path: string; label: string; count: number }>();

  for (const post of posts) {
    if (post.topicSegments.length <= currentSegments.length) continue;

    const nextPath = post.topicSegments.slice(0, currentSegments.length + 1).join('/');
    const current = childTopics.get(nextPath);

    if (current) {
      current.count += 1;
      continue;
    }

    childTopics.set(nextPath, {
      path: nextPath,
      label: humanizeSlugSegment(post.topicSegments[currentSegments.length]),
      count: 1,
    });
  }

  return [...childTopics.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

const cardsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '18px',
};

const buttonStyle: CSSProperties = {
  color: '#201A16',
  background: 'rgba(255,255,255,0.58)',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '14px',
  border: '1px solid rgba(79, 55, 38, 0.12)',
};

const topicLinksStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
};

const topicLinkStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#201A16',
  borderRadius: '18px',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.58)',
  border: '1px solid rgba(79, 55, 38, 0.1)',
};

const breadcrumbsStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const ghostLinkStyle: CSSProperties = {
  color: '#155E63',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '13px',
  padding: '10px 12px',
  borderRadius: '999px',
  background: 'rgba(21, 94, 99, 0.08)',
};

const articleMetaRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  color: '#6E6358',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};

const coverStyle: CSSProperties = {
  width: '100%',
  borderRadius: '22px',
  marginTop: '20px',
  objectFit: 'cover' as const,
  maxHeight: '420px',
  border: '1px solid rgba(79, 55, 38, 0.12)',
};

const articleBodyStyle: CSSProperties = {
  marginTop: '26px',
};

const sideNavLinkStyle: CSSProperties = {
  color: '#155E63',
  textDecoration: 'none',
  fontWeight: 700,
};

const tagsStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const tagStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '999px',
  background: 'rgba(161, 77, 38, 0.08)',
  color: '#A14D26',
  fontSize: '12px',
  fontWeight: 700,
};
