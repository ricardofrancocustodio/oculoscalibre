import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllPostsAdmin, getKeywordCannibalization } from '@/lib/db';
import { reviewPostSeo } from '@/lib/seo-reviewer';

export const dynamic = 'force-dynamic';

const SCORE_GREEN = 80;
const SCORE_YELLOW = 60;

function scoreColor(score: number): string {
  if (score >= SCORE_GREEN) return '#C8F135';
  if (score >= SCORE_YELLOW) return '#FFB347';
  return '#FF6B6B';
}

export default async function SeoAuditPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  const [posts, cannibalization] = await Promise.all([
    getAllPostsAdmin(),
    getKeywordCannibalization(),
  ]);

  const reviews = posts.map((post) => {
    const review = reviewPostSeo({
      titulo: post.titulo,
      resumo: post.resumo,
      conteudoMd: post.conteudo_md,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description,
      keywordPrincipal: post.keyword_principal,
      keywordsSecundarias: post.keywords_secundarias,
      capaUrl: post.capa_url,
      coverAlt: post.cover_alt,
      siloPath: post.slug.split('/')[0] ?? null,
    });
    return { post, review };
  }).sort((a, b) => a.review.score - b.review.score);

  const errorTotal = reviews.reduce((acc, item) => acc + item.review.issues.filter((issue) => issue.level === 'error').length, 0);
  const warningTotal = reviews.reduce((acc, item) => acc + item.review.issues.filter((issue) => issue.level === 'warning').length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#111',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <Link href="/admin" style={{ color: '#C8F135', fontWeight: 700, fontSize: '18px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            CALIBRE
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginLeft: '12px' }}>
            Admin · Auditoria SEO
          </span>
        </div>
        <Link href="/admin/posts" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
          ← Voltar
        </Link>
      </div>

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Auditoria SEO</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 24px' }}>
          {reviews.length} posts auditados · {errorTotal} erro{errorTotal === 1 ? '' : 's'} · {warningTotal} warning{warningTotal === 1 ? '' : 's'}
        </p>

        {cannibalization.length > 0 && (
          <section style={{
            border: '1px solid rgba(255,107,107,0.3)',
            background: 'rgba(255,107,107,0.06)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
          }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 12px', color: '#FF6B6B' }}>
              Canibalização detectada · {cannibalization.length} grupo{cannibalization.length === 1 ? '' : 's'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cannibalization.map((group) => (
                <div key={group.keyword} style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                    Keyword principal compartilhada:
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700 }}>
                    &ldquo;{group.keyword}&rdquo;
                  </p>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {group.posts.map((post) => (
                      <li key={post.id} style={{ fontSize: '13px' }}>
                        <Link href={`/admin/posts/${post.id}`} style={{ color: '#C8F135', textDecoration: 'none' }}>
                          {post.titulo}
                        </Link>
                        <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
                          /{post.slug} · {post.publicado ? 'publicado' : 'rascunho'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          background: '#111',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 110px 110px 110px',
            padding: '12px 20px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span>Score</span>
            <span>Post</span>
            <span>Erros</span>
            <span>Warnings</span>
            <span>Status</span>
          </div>
          {reviews.length === 0 ? (
            <div style={{ padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              Nenhum post cadastrado ainda.
            </div>
          ) : (
            reviews.map(({ post, review }) => {
              const errorCount = review.issues.filter((issue) => issue.level === 'error').length;
              const warningCount = review.issues.filter((issue) => issue.level === 'warning').length;
              return (
                <div
                  key={post.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 110px 110px 110px',
                    padding: '14px 20px',
                    fontSize: '13px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: scoreColor(review.score), fontWeight: 700, fontSize: '16px' }}>
                    {review.score}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Link href={`/admin/posts/${post.id}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                      {post.titulo}
                    </Link>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                      /{post.slug}{post.keyword_principal ? ` · keyword: "${post.keyword_principal}"` : ' · sem keyword'}
                    </span>
                    {review.issues.length > 0 && (
                      <ul style={{ margin: '6px 0 0', padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {review.issues.slice(0, 4).map((issue, index) => (
                          <li key={`${issue.rule}-${index}`} style={{
                            fontSize: '11px',
                            color: issue.level === 'error' ? '#FF6B6B' : 'rgba(255,179,71,0.85)',
                          }}>
                            <strong>{issue.level === 'error' ? 'erro' : 'warn'}</strong> · {issue.message}
                          </li>
                        ))}
                        {review.issues.length > 4 && (
                          <li style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                            … +{review.issues.length - 4} ocorrência{review.issues.length - 4 === 1 ? '' : 's'}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <span style={{ color: errorCount > 0 ? '#FF6B6B' : 'rgba(255,255,255,0.4)' }}>{errorCount}</span>
                  <span style={{ color: warningCount > 0 ? '#FFB347' : 'rgba(255,255,255,0.4)' }}>{warningCount}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {post.publicado ? 'publicado' : 'rascunho'}
                  </span>
                </div>
              );
            })
          )}
        </section>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '16px' }}>
          Critérios: H1 único com keyword · keyword no 1º parágrafo · densidade 0,5–2% · meta title ≤ 60 · meta description 120–160 · alt em imagens · ≥ 2 links internos do mesmo silo · mínimo 300 palavras.
        </p>
      </div>
    </div>
  );
}
