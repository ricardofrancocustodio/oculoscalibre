import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { OrchestratorWorkspace } from './OrchestratorWorkspace';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export default async function AdminOrquestradorPage() {
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
            Admin · Orquestrador editorial
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/admin" style={navLinkStyle}>Leads</Link>
          <Link href="/admin/posts" style={navLinkStyle}>Posts</Link>
          <Link href="/admin/orquestrador" style={{ ...navLinkStyle, color: '#fff' }}>Orquestrador</Link>
        </nav>
      </div>

      <main style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>
        <OrchestratorWorkspace />
      </main>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '13px',
  textDecoration: 'none',
};
