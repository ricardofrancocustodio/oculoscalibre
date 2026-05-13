import type { Metadata } from 'next';
import { absoluteUrl, breadcrumbListSchema, faqPageSchema, jsonLdScript } from '@/lib/json-ld';

const SITE_NAME = 'Calibre';
const TITLE = 'Guia de Medidas: Como Escolher Óculos para Cabeça Grande';
const DESCRIPTION =
  'Tabela completa de circunferência da cabeça × frontal do óculos. Descubra qual modelo Calibre se encaixa no seu rosto largo e como medir sua cabeça em casa.';

export const metadata: Metadata = {
  title: `${TITLE} | ${SITE_NAME}`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    locale: 'pt_BR',
    siteName: SITE_NAME,
  },
  alternates: { canonical: absoluteUrl('/guia-de-medidas') },
};

const FAQS = [
  {
    q: 'Como medir a circunferência da minha cabeça?',
    a: 'Use uma fita métrica flexível ou um barbante. Posicione a fita horizontalmente ao redor da cabeça, passando pela testa (cerca de 2 cm acima das sobrancelhas), pelas orelhas e pela parte mais saliente da nuca. Anote a medida em centímetros.',
  },
  {
    q: 'O que é o frontal do óculos?',
    a: 'O frontal é a largura total da frente do óculos, medida de extremidade a extremidade da armação. É a medida mais importante para quem tem cabeça larga: um frontal pequeno aperta nas têmporas ou parece desproporcional.',
  },
  {
    q: 'Por que óculos comuns apertam em cabeças largas?',
    a: 'A maioria das armações do mercado tem frontal entre 130 mm e 142 mm, projetado para cabeças com circunferência até 56 cm. Cabeças acima de 57 cm precisam de frontais a partir de 140 mm — e idealmente acima de 148 mm — para que o óculos encaixe sem pressão nas têmporas.',
  },
  {
    q: 'Qual a diferença entre óculos para rosto largo e óculos comum?',
    a: 'Óculos para rosto largo têm frontal maior (a partir de 145 mm), hastes mais longas ou com abertura ajustável, e ponte projetada para distribuir o peso sem apertar. A Calibre MB-1572S tem frontal de 150,7 mm — cerca de 10 mm a mais que a média do mercado.',
  },
  {
    q: 'O Calibre MB-1572S serve em cabeça de 60 cm de circunferência?',
    a: 'Sim. A MB-1572S tem frontal total de 150,7 mm e hastes de 145 mm, compatível com cabeças entre 59 cm e 62 cm de circunferência. Para cabeças de 60 cm é a recomendação principal.',
  },
  {
    q: 'Posso confiar apenas na numeração do óculos para saber se serve?',
    a: 'A numeração padrão (ex: 60-24-145) indica largura da lente, ponte e haste — mas não o frontal total. Sempre busque o frontal total em mm para comparar com a medida da sua cabeça.',
  },
];

const TABELA = [
  { circunferencia: 'Até 56 cm', frontalNecessario: '130–140 mm', recomendacao: 'Óculos padrão de mercado', calibre: false },
  { circunferencia: '57–58 cm', frontalNecessario: '140–148 mm', recomendacao: 'Oversized leve', calibre: false },
  { circunferencia: '59–60 cm', frontalNecessario: '148–152 mm', recomendacao: 'Calibre MB-1572S', calibre: true },
  { circunferencia: '61–62 cm', frontalNecessario: '152–158 mm', recomendacao: 'Calibre MB-1572S', calibre: true },
  { circunferencia: 'Acima de 62 cm', frontalNecessario: '158 mm+', recomendacao: 'Consultar disponibilidade', calibre: false },
];

export default function GuiaDeMedidasPage() {
  const schemas = [
    breadcrumbListSchema([
      { name: 'Home', href: '/' },
      { name: 'Guia de Medidas', href: '/guia-de-medidas' },
    ]),
    faqPageSchema(FAQS),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(schemas) }}
      />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px', color: '#fff', fontFamily: 'inherit' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Guia de Medidas</span>
        </nav>

        {/* Heading */}
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Como escolher óculos para cabeça grande: guia de medidas
        </h1>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '48px' }}>
          Descubra qual frontal de óculos combina com a circunferência da sua cabeça e pare de comprar modelos que apertam ou ficam desproporcional.
        </p>

        {/* Seção 1: Como medir */}
        <section style={{ marginBottom: '56px' }} aria-labelledby="como-medir">
          <h2 id="como-medir" style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: '#C8F135' }}>
            1. Como medir a circunferência da cabeça
          </h2>
          <ol style={{ paddingLeft: '20px', lineHeight: 2, color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            <li>Pegue uma fita métrica flexível ou um barbante.</li>
            <li>Posicione ao redor da cabeça: cerca de 2 cm acima das sobrancelhas na frente, passando pelas orelhas e pela parte mais saliente da nuca.</li>
            <li>Mantenha a fita firme mas sem apertar — ela deve ficar paralela ao chão.</li>
            <li>Anote a medida em centímetros. Se usou barbante, meça o barbante com uma régua.</li>
            <li>Repita uma vez para confirmar. Use a maior medida.</li>
          </ol>
        </section>

        {/* Seção 2: Tabela */}
        <section style={{ marginBottom: '56px' }} aria-labelledby="tabela-medidas">
          <h2 id="tabela-medidas" style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: '#C8F135' }}>
            2. Tabela: circunferência da cabeça × frontal do óculos
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>
            O <strong style={{ color: 'rgba(255,255,255,0.7)' }}>frontal total</strong> é a medida mais importante — é a largura de extremidade a extremidade da armação.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '15px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(200,241,53,0.08)', textAlign: 'left' }}>
                  <th scope="col" style={{ padding: '14px 16px', color: '#C8F135', fontWeight: 600, whiteSpace: 'nowrap' }}>Circunferência</th>
                  <th scope="col" style={{ padding: '14px 16px', color: '#C8F135', fontWeight: 600, whiteSpace: 'nowrap' }}>Frontal necessário</th>
                  <th scope="col" style={{ padding: '14px 16px', color: '#C8F135', fontWeight: 600 }}>Recomendação</th>
                </tr>
              </thead>
              <tbody>
                {TABELA.map((row, idx) => (
                  <tr
                    key={row.circunferencia}
                    style={{
                      background: row.calibre
                        ? 'rgba(200,241,53,0.07)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontWeight: row.calibre ? 600 : 400 }}>{row.circunferencia}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{row.frontalNecessario}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {row.calibre
                        ? <><strong style={{ color: '#C8F135' }}>{row.recomendacao}</strong> <span style={{ fontSize: '12px', background: 'rgba(200,241,53,0.15)', color: '#C8F135', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>disponível</span></>
                        : <span style={{ color: 'rgba(255,255,255,0.55)' }}>{row.recomendacao}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            Referência: Calibre MB-1572S — frontal total 150,7 mm | largura da lente 60 mm | ponte 24 mm | hastes 145 mm | peso 40 g
          </p>
        </section>

        {/* CTA */}
        <section style={{ marginBottom: '56px', padding: '28px 24px', background: 'rgba(200,241,53,0.07)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: 1.5 }}>
            Cabeça entre 59 cm e 62 cm? A <strong style={{ color: '#C8F135' }}>MB-1572S</strong> foi feita pra você.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: '#C8F135',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '15px',
              padding: '14px 32px',
              borderRadius: '100px',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Ver o modelo MB-1572S
          </a>
        </section>

        {/* Seção 3: FAQ */}
        <section aria-labelledby="faq-medidas">
          <h2 id="faq-medidas" style={{ fontSize: '22px', fontWeight: 600, marginBottom: '28px', color: '#C8F135' }}>
            3. Perguntas frequentes sobre medidas
          </h2>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  padding: '22px 0',
                }}
              >
                <dt style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px', lineHeight: 1.4 }}>
                  {faq.q}
                </dt>
                <dd style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

      </main>
    </>
  );
}
