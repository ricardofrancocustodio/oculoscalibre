// Standalone runtime check for Google Ads Keyword Planner env vars.
// Usage: node --env-file=.env.local scripts/test-keyword-planner.mjs

const required = [
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_DEVELOPER_TOKEN',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error('❌ Variaveis ausentes:', missing.join(', '));
  process.exit(1);
}
console.log('✅ Todas as variaveis obrigatorias estao definidas.');
console.log('  LOGIN_CUSTOMER_ID:', process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ? 'set' : 'unset (opcional)');
console.log('  API_VERSION:', process.env.GOOGLE_ADS_API_VERSION || 'v21 (default)');

async function tokenStep() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('❌ OAuth falhou:', data);
    process.exit(2);
  }
  console.log('✅ OAuth: access_token obtido (expira em', data.expires_in, 's).');
  return data.access_token;
}

async function ideasStep(accessToken) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, '');
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION?.trim() || 'v21';

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const res = await fetch(
    `https://googleads.googleapis.com/${apiVersion}/customers/${customerId}:generateKeywordIdeas`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language: 'languageConstants/1014',
        geoTargetConstants: ['geoTargetConstants/2076'],
        keywordPlanNetwork: 'GOOGLE_SEARCH_AND_PARTNERS',
        keywordSeed: { keywords: ['oculos de sol'] },
        pageSize: 5,
      }),
    },
  );

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    console.error('❌ Keyword Planner falhou (HTTP', res.status, '):');
    console.error(JSON.stringify(data, null, 2));
    process.exit(3);
  }

  const ideas = (data.results ?? []).slice(0, 5).map((r) => ({
    termo: r.text,
    volume: r.keywordIdeaMetrics?.avgMonthlySearches,
    competition: r.keywordIdeaMetrics?.competition,
  }));
  console.log('✅ Keyword Planner: recebidas', data.results?.length ?? 0, 'ideias. Amostra:');
  console.table(ideas);
}

const token = await tokenStep();
await ideasStep(token);
console.log('\n🎉 Todas as etapas funcionaram. Env vars OK.');
