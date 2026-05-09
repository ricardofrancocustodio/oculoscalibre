import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PostForm } from '../PostForm';
import { updatePost } from '../actions';
import { getPostById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EditarPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum) || idNum <= 0) notFound();

  const post = await getPostById(idNum);
  if (!post) notFound();

  const sp = await searchParams;
  const flash = sp.ok === 'salvo' ? 'Post atualizado.' : sp.ok === 'criado' ? 'Post criado.' : null;

  const boundUpdate = updatePost.bind(null, idNum);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
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
            Admin · Posts · Editar
          </span>
        </div>
        <Link href="/admin/posts" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
          ← Voltar
        </Link>
      </div>

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Editar post</h1>
          {post.publicado && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#C8F135', fontSize: '13px', textDecoration: 'none' }}
            >
              Ver post publicado ↗
            </a>
          )}
        </div>

        {flash && (
          <div style={{
            background: 'rgba(200,241,53,0.08)',
            border: '1px solid rgba(200,241,53,0.3)',
            color: '#C8F135',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
          }}>
            {flash}
          </div>
        )}

        <PostForm
          mode="editar"
          initial={{
            id: post.id,
            slug: post.slug,
            titulo: post.titulo,
            resumo: post.resumo,
            conteudo_md: post.conteudo_md,
            capa_url: post.capa_url,
            tags: post.tags,
            autor: post.autor,
            publicado: post.publicado,
            meta_title: post.meta_title,
            meta_description: post.meta_description,
            keyword_principal: post.keyword_principal,
            keywords_secundarias: post.keywords_secundarias,
            canonical_url: post.canonical_url,
            og_image_url: post.og_image_url,
            cover_alt: post.cover_alt,
            noindex: post.noindex,
          }}
          action={boundUpdate}
        />
      </div>
    </div>
  );
}
