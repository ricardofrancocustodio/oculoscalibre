import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllPostsAdmin } from '@/lib/db';
import { togglePublish, deletePost } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  const posts = await getAllPostsAdmin();
  const params = await searchParams;
  const flash = flashMessage(params.ok);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      <Header />

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Posts</h1>
          <Link
            href="/admin/posts/novo"
            style={{
              background: '#C8F135',
              color: '#0A0A0A',
              padding: '10px 20px',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.05em',
            }}
          >
            + Novo post
          </Link>
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

        {posts.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '60px' }}>
            Nenhum post ainda. Crie o primeiro.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Título', 'Status', 'Caminho', 'Atualizado', 'Ações'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                    <Link href={`/admin/posts/${p.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                      {p.titulo}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.publicado ? (
                      <span style={{ color: '#C8F135', fontSize: '12px' }}>● Publicado</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>○ Rascunho</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    /blog/{p.slug}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(p.updated_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/admin/posts/${p.id}`}
                      style={actionLink}
                    >
                      Editar
                    </Link>
                    <form action={togglePublish}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" style={actionBtn}>
                        {p.publicado ? 'Despublicar' : 'Publicar'}
                      </button>
                    </form>
                    {p.publicado && (
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" style={actionLink}>
                        Ver
                      </a>
                    )}
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        style={{ ...actionBtn, color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
                      >
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function flashMessage(ok?: string): string | null {
  if (ok === 'criado') return 'Post criado com sucesso.';
  if (ok === 'salvo') return 'Post atualizado.';
  if (ok === 'excluido') return 'Post excluído.';
  return null;
}

function Header() {
  return (
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
          Admin · Posts
        </span>
      </div>
      <nav style={{ display: 'flex', gap: '16px' }}>
        <Link href="/admin" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none' }}>
          Leads
        </Link>
        <Link href="/admin/posts" style={{ color: '#fff', fontSize: '13px', textDecoration: 'none' }}>
          Posts
        </Link>
      </nav>
    </div>
  );
}

const actionLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  textDecoration: 'none',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '100px',
  padding: '6px 14px',
};

const actionBtn: React.CSSProperties = {
  ...actionLink,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
