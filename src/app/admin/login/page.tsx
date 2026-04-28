import { login } from '../actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <h1 style={{
          color: '#C8F135',
          fontFamily: 'Georgia, serif',
          fontSize: '28px',
          letterSpacing: '0.1em',
          margin: '0 0 6px',
        }}>CALIBRE</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 32px' }}>
          Área administrativa
        </p>

        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
            Senha
            <input
              type="password"
              name="password"
              required
              autoFocus
              style={{
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <p style={{
              color: '#ff6b6b',
              fontSize: '13px',
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.2)',
              padding: '10px 14px',
              borderRadius: '10px',
              margin: 0,
            }}>
              Senha incorreta.
            </p>
          )}

          <button
            type="submit"
            style={{
              background: '#C8F135',
              color: '#0A0A0A',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.05em',
              border: 'none',
              borderRadius: '100px',
              padding: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
