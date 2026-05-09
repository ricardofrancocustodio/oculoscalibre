import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sql, ensureLeadsTable, ensureStatsTable } from '@/lib/db';
import { logout } from './actions';

interface Lead {
  id: number;
  nome: string;
  email: string;
  whatsapp: string;
  medida: string | null;
  produto: string;
  origem: string | null;
  created_at: string;
}

async function getLeads(): Promise<Lead[]> {
  await ensureLeadsTable();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  return rows as Lead[];
}

async function getVisitorCount(): Promise<number> {
  await ensureStatsTable();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM page_views` as { count: number }[];
  return rows[0].count;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  const leads = await getLeads();
  const visitorCount = await getVisitorCount();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ color: '#C8F135', fontWeight: 700, fontSize: '18px', letterSpacing: '0.1em' }}>
            CALIBRE
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginLeft: '12px' }}>
            Admin · Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/admin/posts" style={adminNavLinkStyle}>Posts</Link>
          <Link href="/admin/orquestrador" style={adminNavLinkStyle}>Orquestrador</Link>
          <Link href="/admin/seo-audit" style={adminNavLinkStyle}>Auditoria SEO</Link>
          <form action={logout}>
            <button type="submit" style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.5)',
              padding: '8px 20px',
              borderRadius: '100px',
              fontSize: '12px',
              cursor: 'pointer',
            }}>
              Sair
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '32px 32px 0', display: 'flex', gap: '24px' }}>
        <div style={{
          background: 'rgba(200,241,53,0.08)',
          border: '1px solid rgba(200,241,53,0.2)',
          borderRadius: '12px',
          padding: '16px 24px',
          flex: 1,
          maxWidth: '240px',
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#C8F135', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Acessos ao site
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: 700, color: '#fff' }}>
            {visitorCount}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px 24px',
          flex: 1,
          maxWidth: '240px',
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Total de leads
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: 700, color: '#fff' }}>
            {leads.length}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px 24px',
          flex: 1,
          maxWidth: '240px',
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Taxa de conversão
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: 700, color: '#fff' }}>
            {visitorCount > 0 ? ((leads.length / visitorCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 32px 48px', overflowX: 'auto' }}>
        {leads.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '60px' }}>
            Nenhum lead ainda.
          </p>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Nome', 'E-mail', 'WhatsApp', 'Medida', 'Data'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                    {lead.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{lead.nome}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <a href={`mailto:${lead.email}`} style={{ color: '#C8F135', textDecoration: 'none' }}>
                      {lead.email}
                    </a>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <a
                      href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#C8F135', textDecoration: 'none' }}
                    >
                      {lead.whatsapp}
                    </a>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)' }}>
                    {lead.medida || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {new Date(lead.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
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

const adminNavLinkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.62)',
  fontSize: '13px',
  textDecoration: 'none',
};
