// Netlify Function: reads a candidate's CV (PDF) with Claude and returns structured
// fields for the apply form to pre-fill. Best-effort — on any problem it returns
// { fields: null } so the form simply stays manual (nothing ever breaks).

// Change this if your Anthropic account uses a different model name.
const MODEL = 'claude-haiku-4-5';

const INSTRUCTION = `You are extracting fields from a CV/résumé to pre-fill a job application form.
Return ONLY a JSON object with EXACTLY these keys: name, email, phone, linkedin, currentTitle, currentCompany, seniority, location.
Rules:
- Use the candidate's MOST RECENT / current role for currentTitle and currentCompany.
- "seniority" MUST be one of exactly: "Entry / Junior", "Mid-level", "Senior", "Director / Head", "C-suite / Board". Choose the closest based on their current role.
- "linkedin" = their LinkedIn profile URL if present, else "".
- "location" = their city and/or country if present, else "".
- For any field you cannot confidently find, use an empty string "".
- Do NOT invent or guess information that isn't in the CV.
- Output the raw JSON object only — no prose, no markdown, no code fences.`;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ fields: null, reason: 'not_configured' });

  let body;
  try { body = await req.json(); } catch { return Response.json({ fields: null, reason: 'bad_request' }); }
  const { dataBase64, mediaType } = body || {};
  if (!dataBase64 || mediaType !== 'application/pdf') {
    return Response.json({ fields: null, reason: 'unsupported_type' });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dataBase64 } },
            { type: 'text', text: INSTRUCTION },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const detail = (await resp.text()).slice(0, 300);
      return Response.json({ fields: null, reason: 'api_error', detail });
    }

    const data = await resp.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    let fields = null;
    try {
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      fields = JSON.parse(clean);
    } catch {
      fields = null;
    }
    return Response.json({ fields });
  } catch (err) {
    return Response.json({ fields: null, reason: 'exception' });
  }
};
