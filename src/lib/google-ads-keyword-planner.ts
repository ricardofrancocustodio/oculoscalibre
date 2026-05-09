import 'server-only';

import { searchMockKeywords, type KeywordSuggestion } from '@/lib/keyword-planner';

interface GoogleAdsTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleAdsKeywordIdeaResult {
  text?: string;
  keywordIdeaMetrics?: {
    avgMonthlySearches?: string | number;
    competition?: 'UNSPECIFIED' | 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

interface GoogleAdsKeywordIdeaResponse {
  results?: GoogleAdsKeywordIdeaResult[];
  error?: {
    message?: string;
    status?: string;
  };
}

type GoogleAdsCompetition = NonNullable<GoogleAdsKeywordIdeaResult['keywordIdeaMetrics']>['competition'];

export interface KeywordPlannerSearchResult {
  suggestions: KeywordSuggestion[];
  source: 'google-ads' | 'mock';
  warning?: string;
}

const DEFAULT_LANGUAGE = 'languageConstants/1014';
const DEFAULT_GEO_TARGET = 'geoTargetConstants/2076';
const DEFAULT_API_VERSION = 'v19';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variavel de ambiente ausente: ${name}`);
  return value;
}

function formatVolume(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '0';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  if (numericValue >= 1000) return `${(numericValue / 1000).toFixed(numericValue >= 10000 ? 0 : 1)}k`;
  return String(numericValue);
}

function parseVolume(value: string): number {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) return 0;
  if (normalizedValue.endsWith('k')) {
    return Number(normalizedValue.slice(0, -1).replace(',', '.')) * 1000;
  }
  return Number(normalizedValue.replace(/\D/g, '')) || 0;
}

function formatTokenError(data: GoogleAdsTokenResponse): string {
  if (data.error === 'unauthorized_client') {
    return 'OAuth recusou o refresh token. Gere um novo refresh token usando exatamente o mesmo GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET configurados no .env.local.';
  }

  if (data.error === 'invalid_grant') {
    return 'Refresh token invalido, expirado ou revogado. Gere um novo refresh token com o escopo https://www.googleapis.com/auth/adwords.';
  }

  return data.error_description || data.error || 'Falha ao obter access token do Google Ads.';
}

function mapCompetition(value: GoogleAdsCompetition): KeywordSuggestion['dificuldade'] {
  if (value === 'LOW') return 'Baixa';
  if (value === 'MEDIUM') return 'Media';
  if (value === 'HIGH') return 'Alta';
  return 'Indefinida';
}

function inferIntent(term: string): KeywordSuggestion['intencao'] {
  const normalizedTerm = term.toLowerCase();
  const transactionalMarkers = ['comprar', 'preco', 'valor', 'onde comprar', 'loja', 'promo'];
  const commercialMarkers = ['melhor', 'melhores', 'masculino', 'feminino', 'marca', 'modelo', 'para rosto'];
  const navigationalMarkers = ['calibre', 'mb-1572s'];

  if (navigationalMarkers.some((marker) => normalizedTerm.includes(marker))) return 'navegacional';
  if (transactionalMarkers.some((marker) => normalizedTerm.includes(marker))) return 'transacional';
  if (commercialMarkers.some((marker) => normalizedTerm.includes(marker))) return 'comercial';
  return 'informacional';
}

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: requireEnv('GOOGLE_ADS_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_ADS_CLIENT_SECRET'),
      refresh_token: requireEnv('GOOGLE_ADS_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const data = await response.json() as GoogleAdsTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(formatTokenError(data));
  }

  return data.access_token;
}

async function fetchGoogleAdsKeywordIdeas(query: string): Promise<KeywordSuggestion[]> {
  const accessToken = await getAccessToken();
  const customerId = requireEnv('GOOGLE_ADS_CUSTOMER_ID').replace(/-/g, '');
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim().replace(/-/g, '');
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const language = process.env.GOOGLE_ADS_LANGUAGE_RESOURCE?.trim() || DEFAULT_LANGUAGE;
  const geoTarget = process.env.GOOGLE_ADS_GEO_TARGET_RESOURCE?.trim() || DEFAULT_GEO_TARGET;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': requireEnv('GOOGLE_ADS_DEVELOPER_TOKEN'),
    'Content-Type': 'application/json',
  };

  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}:generateKeywordIdeas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      language,
      geoTargetConstants: [geoTarget],
      keywordPlanNetwork: 'GOOGLE_SEARCH_AND_PARTNERS',
      keywordSeed: {
        keywords: [query],
      },
      pageSize: 12,
    }),
    cache: 'no-store',
  });

  const data = await response.json() as GoogleAdsKeywordIdeaResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || data.error?.status || 'Falha na consulta ao Google Ads Keyword Planner.');
  }

  return (data.results ?? [])
    .filter((result) => result.text)
    .map((result) => ({
      termo: result.text ?? '',
      volumeMensal: formatVolume(result.keywordIdeaMetrics?.avgMonthlySearches),
      dificuldade: mapCompetition(result.keywordIdeaMetrics?.competition),
      intencao: inferIntent(result.text ?? ''),
      fonte: 'Google Ads Keyword Planner',
    }))
    .filter((suggestion) => suggestion.termo)
    .sort((left, right) => parseVolume(right.volumeMensal) - parseVolume(left.volumeMensal));
}

export async function searchKeywordPlanner(query: string): Promise<KeywordPlannerSearchResult> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return { suggestions: [], source: 'mock' };
  }

  try {
    const suggestions = await fetchGoogleAdsKeywordIdeas(normalizedQuery);
    return {
      suggestions: suggestions.length ? suggestions : searchMockKeywords(normalizedQuery),
      source: suggestions.length ? 'google-ads' : 'mock',
      warning: suggestions.length ? undefined : 'Google Ads nao retornou ideias para esta busca; exibindo fallback local.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao consultar Google Ads.';
    return {
      suggestions: searchMockKeywords(normalizedQuery),
      source: 'mock',
      warning: `${message} Exibindo fallback local.`,
    };
  }
}
