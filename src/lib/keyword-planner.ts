export interface KeywordSuggestion {
  termo: string;
  volumeMensal: string;
  dificuldade: string;
  intencao: 'informacional' | 'comercial' | 'transacional' | 'navegacional';
  fonte: string;
}

const MOCK_KEYWORDS: KeywordSuggestion[] = [
  { termo: 'oculos de sol para rosto largo', volumeMensal: '1.2k', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de sol masculino para rosto largo', volumeMensal: '800', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de sol feminino para rosto largo', volumeMensal: '950', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'como medir o rosto para oculos', volumeMensal: '2.5k', dificuldade: 'Alta', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'melhores marcas de oculos para rosto grande', volumeMensal: '450', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos de grau para rosto largo', volumeMensal: '1.1k', dificuldade: 'Media', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'armacao de acetato premium', volumeMensal: '300', dificuldade: 'Baixa', intencao: 'transacional', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos que nao apertam na tempora', volumeMensal: '150', dificuldade: 'Muito Baixa', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'medidas de oculos de sol', volumeMensal: '5.4k', dificuldade: 'Alta', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos aviador para rosto largo', volumeMensal: '200', dificuldade: 'Baixa', intencao: 'comercial', fonte: 'Mock Keyword Planner' },
  { termo: 'oculos quadrado para rosto redondo', volumeMensal: '3.2k', dificuldade: 'Media', intencao: 'informacional', fonte: 'Mock Keyword Planner' },
  { termo: 'tamanho de oculos 60mm', volumeMensal: '120', dificuldade: 'Baixa', intencao: 'transacional', fonte: 'Mock Keyword Planner' },
];

const STOPWORDS = new Set(['a', 'as', 'com', 'da', 'de', 'do', 'dos', 'e', 'em', 'o', 'os', 'para', 'por', 'um', 'uma']);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\W+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function searchMockKeywords(query: string): KeywordSuggestion[] {
  if (!query) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = tokenize(normalizedQuery);

  return MOCK_KEYWORDS
    .map((keyword) => {
      const normalizedTerm = keyword.termo.toLowerCase();
      const termTokens = tokenize(normalizedTerm);
      const tokenMatches = queryTokens.filter((token) => termTokens.includes(token)).length;
      const exactPhraseMatch = normalizedTerm.includes(normalizedQuery);
      const startsWithQuery = normalizedTerm.startsWith(normalizedQuery);

      return {
        keyword,
        score: (startsWithQuery ? 30 : 0) + (exactPhraseMatch ? 20 : 0) + tokenMatches,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aStarts = a.keyword.termo.toLowerCase().startsWith(normalizedQuery);
      const bStarts = b.keyword.termo.toLowerCase().startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    })
    .map(({ keyword }) => keyword);
}

export const searchKeywords = searchMockKeywords;
