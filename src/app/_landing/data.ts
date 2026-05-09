export interface Spec {
  label: string;
  value: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export const VAGAS_TOTAIS = 100;
export const PRICE = '449';
export const PRICE_OLD = '799';

export const specs: Spec[] = [
  { label: 'Frontal total', value: '150.7mm' },
  { label: 'Largura da lente', value: '60mm' },
  { label: 'Altura do frame', value: '50mm' },
  { label: 'Ponte', value: '24mm' },
  { label: 'Comprimento da haste', value: '145mm' },
  { label: 'Material', value: 'Acetato premium' },
  { label: 'Proteção UV', value: 'UV400' },
  { label: 'Peso', value: '40g' },
];

export const faqs: FAQ[] = [
  {
    q: 'O que é a lista de espera?',
    a: 'Você reserva sua vaga gratuitamente e sem compromisso. Quando o estoque chegar, avisamos por e-mail e WhatsApp na ordem da lista, e você decide se quer fechar a compra. Sem cobrança agora.',
  },
  {
    q: 'Como sei se o óculos vai caber na minha cabeça?',
    a: 'Meça com uma fita métrica a distância de têmpora a têmpora passando pela testa. Se sua medida for até 158mm, o MB-1572S serve perfeitamente. A maioria dos óculos comuns tem 138–145mm — o Calibre resolve o que o mercado ignorou.',
  },
  {
    q: 'Quando recebo meu óculos?',
    a: 'Estamos finalizando a primeira leva de produção. Quem está na lista de espera é avisado primeiro, com prioridade na ordem de entrada. Estimativa de envio das primeiras unidades: em breve, divulgaremos a data exata por e-mail.',
  },
  {
    q: 'E se não servir? Posso trocar?',
    a: 'Sim. Garantia de 30 dias após o recebimento. Se não servir ou não gostar, devolvemos o valor integral sem burocracia.',
  },
  {
    q: 'É óculos de grau ou de sol?',
    a: 'O MB-1572S é óculos de sol com lente escura UV400. Em breve lançaremos a versão com aro para lentes de grau.',
  },
];
