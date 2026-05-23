/**
 * NHB Consultancy — Netlify Function: Claude AI Proxy
 *
 * This function acts as a secure server-side proxy for the Anthropic API.
 * The API key lives here (server-side) and is never exposed to the browser.
 *
 * Endpoint: /.netlify/functions/claude
 * Method:   POST
 * Body:     Standard Anthropic /v1/messages payload (model, messages, system, max_tokens)
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const payload = JSON.parse(event.body);

    // Enforce safe defaults — always use Sonnet 4, cap tokens
    const safePayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: payload.max_tokens || 1000,
      system: payload.system || '',
      messages: payload.messages || [],
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(safePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: data.error?.message || 'API error' }),
      };
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
