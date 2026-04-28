import { Resend } from 'resend';
import { sql, ensureLeadsTable } from '@/lib/db';

let _resend: Resend | undefined;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, email, whatsapp, medida, produto, origem } = body;

  if (!nome?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return Response.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
  }

  await ensureLeadsTable();

  await sql`
    INSERT INTO leads (nome, email, whatsapp, medida, produto, origem)
    VALUES (
      ${nome.trim()},
      ${email.trim()},
      ${whatsapp.trim()},
      ${medida?.trim() || null},
      ${produto || 'MB-1572S'},
      ${origem || null}
    )
  `;

  await getResend().emails.send({
    from: `Calibre <${process.env.RESEND_FROM}>`,
    to: email.trim(),
    subject: 'Sua vaga na lista de espera está confirmada! ✦',
    html: `
      <div style="background:#0A0A0A;color:#ffffff;font-family:'DM Sans',Arial,sans-serif;max-width:540px;margin:0 auto;padding:40px 32px;border-radius:16px;">
        <h1 style="font-size:32px;color:#C8F135;margin:0 0 8px;">CALIBRE</h1>
        <h2 style="font-size:22px;margin:0 0 24px;color:#fff;">Vaga confirmada, ${nome.trim().split(' ')[0]}!</h2>
        <p style="color:rgba(255,255,255,0.7);line-height:1.7;margin:0 0 16px;">
          Você está na lista de espera do <strong style="color:#fff;">MB-1572S</strong> — o óculos de sol
          para quem o mercado sempre ignorou. 150.7mm de frontal, acetato premium, UV400.
        </p>
        <p style="color:rgba(255,255,255,0.7);line-height:1.7;margin:0 0 32px;">
          Quando o estoque chegar, você será avisado <strong style="color:#fff;">por e-mail e WhatsApp</strong>
          na ordem da lista. Sem cobrança agora — você decide se quer fechar a compra.
        </p>
        <div style="background:rgba(200,241,53,0.08);border:1px solid rgba(200,241,53,0.2);border-radius:12px;padding:20px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">
            🔒 Seus dados são usados apenas para te avisar do lançamento. Sem spam.
          </p>
        </div>
      </div>
    `,
  });

  if (process.env.ADMIN_EMAIL) {
    await getResend().emails.send({
      from: `Calibre <${process.env.RESEND_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Novo lead: ${nome.trim()}`,
      html: `<p><strong>${nome.trim()}</strong> — ${email.trim()} — ${whatsapp.trim()}${medida ? ` — ${medida.trim()}` : ''}</p>`,
    });
  }

  return Response.json({ ok: true });
}
