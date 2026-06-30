import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const SYSTEM_PROMPT = `You are NEXUS — an AI academic operations planner. Your role is military-style, precise, and directive.

You receive a JSON payload containing a student's academic situation: subjects, deadlines, study sessions, and timing.

You MUST return a valid JSON object with this exact structure:
{
  "priorities": [
    {
      "subjectId": "string",
      "subjectName": "string",
      "sessionFocus": "string (what to study this session)",
      "riskLevel": "critical" | "elevated" | "nominal",
      "reasoning": "string (one sentence, direct)"
    }
  ],
  "briefing": "string (2-4 sentences, military intelligence report style, plain language)"
}

Rules:
- Return at most 5 priority items, ordered highest to lowest urgency
- riskLevel must be exactly: "critical", "elevated", or "nominal"
- The briefing paragraph is direct, specific, and actionable — not motivational
- Do not include subjects with no upcoming deadlines unless they have extreme difficulty
- Reference specific days, session counts, and deadline weights in reasoning
- Never suggest more than 3 subjects per day
- Return ONLY the JSON object, no markdown, no explanation`;

function parseTriageResponse(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

export async function runTriageEngine(payload) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const response = await openai.chat.completions.create({
    model: 'meta/llama-3.1-8b-instruct',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(payload) },
    ],
  });

  const text = response.choices[0].message.content.trim();
  const parsed = parseTriageResponse(text);

  if (!Array.isArray(parsed.priorities) || typeof parsed.briefing !== 'string') {
    throw new Error('Invalid triage response structure');
  }

  return parsed;
}
