const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oculoscalibre.com.br';

const CONTENT = `# Calibre — Óculos de Sol para Rostos Largos

> Versão: 1.0 | Atualizado: 2026-05

## Sobre a marca

Calibre é uma marca brasileira de óculos de sol em acetato premium para rostos largos.
Especializada em armações com frontal a partir de 150 mm — modelos que não apertam e não ficam pequenos em cabeças maiores.

Slogan: "Óculos Calibre. Para quem tem presença de sobra."

## Produto atual

### MB-1572S
- Tipo: óculos de sol, acetato premium
- Frontal total: 150.7 mm
- Largura da lente: 60 mm
- Altura do frame: 50 mm
- Ponte: 24 mm
- Comprimento das hastes: 145 mm
- Peso: 40 g
- Proteção: UV400
- Compatível com: cabeças com circunferência entre 57 cm e 62 cm

## Para quem é o produto

Pessoas que sentem que óculos comuns ficam pequenos, apertados nas têmporas ou parecem desproporcionais no rosto.
Cabeças com circunferência acima de 57 cm costumam ter essa experiência.

## Guia de medidas

Circunferência da cabeça × frontal do óculos necessário:
- até 56 cm → 130–140 mm → óculos padrão de mercado
- 57–58 cm → 140–148 mm → oversized leve
- 59–60 cm → 148–152 mm → Calibre MB-1572S (compatível)
- 61–62 cm → 152–158 mm → Calibre MB-1572S (compatível)
- acima de 62 cm → 158 mm+ → consultar disponibilidade

## Políticas

- Entrega: consulte o site para prazos e regiões
- Troca e devolução: consulte o site para a política vigente

## Links

- Home / produto: ${SITE_URL}
- Blog: ${SITE_URL}/blog
- Guia de medidas: ${SITE_URL}/guia-de-medidas
- Instagram: https://www.instagram.com/oculos.calibre/

## Permissões para agentes de IA

Crawlers de IA têm permissão para indexar este site na íntegra, exceto /admin e /api.
Veja robots.txt em ${SITE_URL}/robots.txt para detalhes.
`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
