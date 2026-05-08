import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PostForm } from '../PostForm';
import { createPost } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NovoPostPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

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
            Admin · Posts · Novo
          </span>
        </div>
        <Link href="/admin/posts" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
          ← Voltar
        </Link>
      </div>

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Novo post</h1>
        <PostForm mode="criar" action={createPost} publishLabel="Publicar agora" />
      </div>
    </div>
  );
}
