const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;
const mistralApiKey = process.env.MISTRAL_API_KEY || "";
const mistralAlertsModel =
  process.env.MISTRAL_ALERTS_MODEL || "mistral-small-latest";
const mistralPipelineModel =
  process.env.MISTRAL_PIPELINE_MODEL || "mistral-medium-latest";
let mistralAuthBlockedReason = "";
let mistralAuthBlockedLogged = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildCompanyContext({ companyName, city, companySize, type, owner }) {
  return {
    company_name: safeTrim(companyName),
    city: safeTrim(city),
    company_size: safeTrim(companySize),
    type: safeTrim(type),
    key_contact:
      owner && owner.trim() !== "" && owner.trim() !== "No owner"
        ? { name: owner.trim(), title: "" }
        : null,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normaliseTone(risk) {
  if (risk === "High") return "danger";
  if (risk === "Medium") return "info";
  return "positive";
}

function normaliseIcon(risk) {
  if (risk === "High") return "!";
  if (risk === "Medium") return "i";
  return "+";
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeTrim(value) {
  return String(value || "").trim();
}

function extractJsonObject(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {}

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {}
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }

  return null;
}

function extractMistralMessageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((chunk) =>
        typeof chunk === "string"
          ? chunk
          : safeTrim(chunk?.text || chunk?.content)
      )
      .join("")
      .trim();
  }
  return "";
}

async function callMistralChat({
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.3,
  maxTokens = 900,
}) {
  if (!mistralApiKey || typeof fetch !== "function" || mistralAuthBlockedReason) {
    return null;
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 || response.status === 403) {
      mistralAuthBlockedReason =
        "Mistral API key was rejected. Update MISTRAL_API_KEY in backend/.env and verify the key is active.";
    }
    throw new Error(`Mistral request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = await response.json();
  return extractMistralMessageText(payload?.choices?.[0]?.message?.content);
}

function buildProspectingFallback({
  context,
}) {
  return {
    fitScore: 0,
    scoreReasoning: "No analysis was generated because a valid Groq API key is not configured.",
    researchSummary: "Research is unavailable until a valid Groq API key is configured.",
    publicSignals: [],
    fitBreakdown: [],
    buyerPersonas: [],
    sequence: [],
    email1: "",
    email2: "",
    callOpener: "",
    messagingAdjustments: [],
    nextActions: [],
    generatedAt: new Date().toISOString(),
    fallback: true,
    enrichedProfile: context,
  };
}

function normaliseAgentResult(raw, fallback, enriched) {
  return {
    ...fallback,
    ...raw,
    email1: raw.email1 || fallback.email1,
    email2: raw.email2 || fallback.email2,
    researchSummary: raw.researchSummary || fallback.researchSummary,
    scoreReasoning: raw.scoreReasoning || fallback.scoreReasoning,
    fitScore: clamp(Number(raw.fitScore || fallback.fitScore), 0, 100),
    publicSignals: Array.isArray(raw.publicSignals) && raw.publicSignals.length
      ? raw.publicSignals
      : fallback.publicSignals,
    fitBreakdown: Array.isArray(raw.fitBreakdown) && raw.fitBreakdown.length
      ? raw.fitBreakdown.map((item) => ({
          label: item.label || "Signal",
          score: clamp(Number(item.score || 0), 0, 100),
          summary: item.summary || "",
        }))
      : fallback.fitBreakdown,
    buyerPersonas: Array.isArray(raw.buyerPersonas) && raw.buyerPersonas.length
      ? raw.buyerPersonas
      : fallback.buyerPersonas,
    sequence: Array.isArray(raw.sequence) && raw.sequence.length
      ? raw.sequence
      : fallback.sequence,
    callOpener: raw.callOpener || fallback.callOpener,
    messagingAdjustments:
      Array.isArray(raw.messagingAdjustments) && raw.messagingAdjustments.length
        ? raw.messagingAdjustments
        : fallback.messagingAdjustments,
    nextActions: Array.isArray(raw.nextActions) && raw.nextActions.length
      ? raw.nextActions
      : fallback.nextActions,
    generatedAt: raw.generatedAt || new Date().toISOString(),
    fallback: false,
    enrichedProfile: enriched,
  };
}

function buildDealIntelFallback(deals) {
  return {
    generatedAt: new Date().toISOString(),
    fallback: true,
    fallbackReason: "No deal intelligence was generated because a valid Mistral API key is not configured.",
    authBlocked: !mistralApiKey || Boolean(mistralAuthBlockedReason),
    alerts: [],
    monitor: [],
  };
}

function normaliseDealIntelResponse(raw, fallback) {
  const alerts = toArray(raw?.alerts)
    .map((alert) => {
      const dealId = Number(alert?.dealId);
      const message = safeTrim(alert?.msg);
      if (!Number.isFinite(dealId) || !message) return null;
      return {
        dealId,
        icon: safeTrim(alert?.icon) || "i",
        msg: message,
        time: safeTrim(alert?.time) || "Now",
        tone: ["danger", "info", "positive"].includes(alert?.tone)
          ? alert.tone
          : "info",
      };
    })
    .filter(Boolean);

  const monitor = toArray(raw?.monitor)
    .map((entry) => {
      const dealId = Number(entry?.dealId);
      const headline = safeTrim(entry?.headline);
      const action = safeTrim(entry?.action);
      if (!Number.isFinite(dealId) || !headline || !action) return null;
      const talkingPoints = toArray(entry?.talkingPoints)
        .map((point) => safeTrim(point))
        .filter(Boolean)
        .slice(0, 4);

      return {
        dealId,
        headline,
        action,
        talkingPoints,
        researchDetails:
          entry?.researchDetails && typeof entry.researchDetails === "object"
            ? {
                currentFocus: safeTrim(entry.researchDetails.currentFocus),
                problem: safeTrim(entry.researchDetails.problem),
                helpAngle: safeTrim(entry.researchDetails.helpAngle),
              }
            : undefined,
      };
    })
    .filter(Boolean);

  return {
    generatedAt: raw?.generatedAt || new Date().toISOString(),
    fallback: false,
    alerts: alerts.length ? alerts : fallback.alerts,
    monitor: monitor.length ? monitor : fallback.monitor,
  };
}

async function dealIntelligenceHandler(req, res) {
  const deals = toArray(req.body?.deals).slice(0, 12);
  const fallback = buildDealIntelFallback(deals);

  if (!deals.length) {
    return res.json({
      ...fallback,
      fallbackReason: "No active deals were provided for analysis.",
      authBlocked: false,
    });
  }

  if (!mistralApiKey) {
    return res.json(fallback);
  }

  if (mistralAuthBlockedReason) {
    return res.json({
      ...fallback,
      fallback: true,
      fallbackReason: mistralAuthBlockedReason,
      authBlocked: true,
    });
  }

  const compactDeals = deals.map((deal) => ({
    id: Number(deal.id),
    name: safeTrim(deal.name),
    stage: safeTrim(deal.stage),
    value: safeTrim(deal.value),
    owner: safeTrim(deal.owner),
    close: safeTrim(deal.close),
    company: safeTrim(deal.company),
    contact: safeTrim(deal.contact),
    activityCount: Number(deal.activityCount || 0),
    lastActivityLabel: safeTrim(deal.lastActivityLabel),
    researchSummary: safeTrim(deal.researchSummary),
    companyFocus: safeTrim(deal.companyFocus),
  }));

  const alertsPrompt = `Deals snapshot:
${JSON.stringify(compactDeals, null, 2)}

Write concise alert rows for the highest-priority risk signals you can justify from the supplied CRM fields, researchSummary, and companyFocus values. If researchSummary or companyFocus is empty, do not infer company priorities.`;

  const pipelinePrompt = `Deals snapshot:
${JSON.stringify(compactDeals, null, 2)}

Write recovery plays for the pipeline risk monitor using only the supplied CRM fields. Explain known context only when the snapshot includes it. Do not infer company research, priorities, metrics, competitors, contacts, or timelines that are not present.`;

    try {
      const [alertsRaw, monitorRaw] = await Promise.all([
      callMistralChat({
        model: mistralAlertsModel,
        systemPrompt: `You write CRM alert text for a sales team.
Return ONLY valid JSON with this schema:
{
  "alerts": [
    {
      "dealId": 0,
      "icon": "!",
      "msg": "Deal name: concise alert text",
      "time": "Today",
      "tone": "danger"
    }
  ]
}

Rules:
- Write in polished, professional English with correct grammar.
- Keep each msg under 120 characters.
- Use only tones "danger", "info", or "positive".
- Use only the provided deal ids.
- Focus on risks visible in the supplied CRM fields, not generic summaries.
- When research context is available, tie the alert to what the company is currently doing.
- Do not invent research, contacts, company priorities, competitor names, metrics, dates, or hardcoded values.
- If the provided data is insufficient for an alert, omit that alert.`,
        userPrompt: alertsPrompt,
        temperature: 0.25,
        maxTokens: 700,
      }),
      callMistralChat({
        model: mistralPipelineModel,
        systemPrompt: `You are a pipeline risk monitor copilot for a B2B sales team.
Return ONLY valid JSON with this schema:
{
  "monitor": [
    {
      "dealId": 0,
      "headline": "",
      "action": "",
      "talkingPoints": ["", "", ""],
      "researchDetails": {
        "currentFocus": "",
        "problem": "",
        "helpAngle": ""
      }
    }
  ]
}

Rules:
- Write in polished, professional English with correct grammar.
- Use only the provided deal ids.
- Headline should be a short, concrete recovery angle.
- Action should be one sentence.
- talkingPoints should contain 2 to 4 specific seller talking points.
- Base every recommendation on the CRM context present in the snapshot.
- researchDetails.currentFocus must summarize only verified context from researchSummary or companyFocus. Leave it empty when no verified context is supplied.
- researchDetails.problem must explain only a risk or gap that appears in the supplied signals.
- researchDetails.helpAngle must say how CustBuds can help in practical business terms without unsupported claims.
- Do not mention tech stacks, frameworks, engineering tooling, fabricated research, metrics, contacts, or hardcoded values.`,
        userPrompt: pipelinePrompt,
        temperature: 0.35,
        maxTokens: 1200,
      }),
    ]);

    const parsedAlerts = extractJsonObject(alertsRaw) || {};
    const parsedMonitor = extractJsonObject(monitorRaw) || {};

    return res.json(
      normaliseDealIntelResponse(
        {
          alerts: parsedAlerts.alerts,
          monitor: parsedMonitor.monitor,
          generatedAt: new Date().toISOString(),
        },
        fallback
      )
    );
  } catch (err) {
    if (mistralAuthBlockedReason) {
      if (!mistralAuthBlockedLogged) {
        console.warn(`Deal intelligence agent disabled: ${mistralAuthBlockedReason}`);
        mistralAuthBlockedLogged = true;
      }
    } else {
      console.error("Deal intelligence agent fallback:", err.message);
    }
    return res.json({
      ...fallback,
      fallback: true,
      fallbackReason: mistralAuthBlockedReason || err.message,
      authBlocked: Boolean(mistralAuthBlockedReason),
    });
  }
}

async function prospectHandler(req, res) {
  const { companyName, city, companySize, type, owner, email } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: "companyName is required." });
  }

  const context = buildCompanyContext({ companyName, city, companySize, type, owner });

  const fallback = buildProspectingFallback({
    context,
  });
  // Echo the target email back so frontend can use it directly
  if (email) fallback.targetEmail = email;

  if (!groq) {
    return res.json(fallback);
  }

  const systemPrompt = `You are a B2B sales prospecting agent for CustBuds CRM.
Your job is to:
1. Use only the supplied CRM inputs.
2. Score fit for CustBuds from 0-100 only when the inputs are sufficient.
3. Write personalized outreach that is based only on the supplied inputs.
4. Create adaptive messaging adjustments based only on the supplied inputs.
5. Summarize what is known, what is unknown, and how CustBuds may help.

Return ONLY valid JSON.

Quality rules:
- Write in polished, professional English with correct grammar.
- Do not invent research, contacts, company news, headcount, market facts, metrics, funding, technology, or activity history.
- Do not use placeholder or hardcoded values.
- If a field cannot be supported by the supplied inputs, leave it empty or explain that the information is unavailable.
- Avoid casual phrasing, hype, and unsupported claims.

JSON schema:
{
  "fitScore": 0,
  "scoreReasoning": "",
  "researchSummary": "",
  "publicSignals": [
    { "label": "", "detail": "", "source": "", "impact": "" }
  ],
  "fitBreakdown": [
    { "label": "", "score": 0, "summary": "" }
  ],
  "buyerPersonas": [
    { "name": "", "title": "", "why": "" }
  ],
  "sequence": [
    { "step": "", "channel": "", "timing": "", "objective": "", "message": "" }
  ],
  "email1": "Subject: ...",
  "email2": "Subject: ...",
  "callOpener": "",
  "messagingAdjustments": [
    { "signal": "", "adjustment": "", "talkingPoints": ["", "", ""] }
  ],
  "nextActions": ["", "", ""]
}`;

  const userPrompt = `Target company: ${companyName}
City: ${city || ""}
Company size: ${companySize || ""}
Type: ${type || ""}
Known contact or owner: ${context.key_contact?.name || ""}

Create a concise, high-signal output for a revenue team selling an AI-native CRM that improves target research, fit scoring, outreach personalization, and deal-risk visibility.

Important:
- Do not mention tech stacks, frameworks, or tooling.
- Do not describe these inputs as public research.
- Do not create publicSignals unless the signal is directly supported by the fields above.
- Do not include fabricated values, generic market assumptions, or guessed company initiatives.
- In researchSummary, clearly include:
  1. what is known from the supplied CRM inputs,
  2. what remains unknown because no verified research was provided,
  3. how CustBuds may help in business terms without claiming unverified facts.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.45,
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    const result = normaliseAgentResult(parsed, fallback, context);
    if (email) result.targetEmail = email;
    return res.json(result);
  } catch (err) {
    console.error("Prospecting agent fallback:", err.message);
    return res.json({
      ...fallback,
      fallback: true,
      fallbackReason: err.message,
    });
  }
}

app.post("/api/agent/prospect", prospectHandler);
app.post("/api/prospect", prospectHandler);
app.post("/api/agent/deal-intelligence", dealIntelligenceHandler);

app.listen(PORT, () => {
  console.log(`CustBuds Prospecting Agent running on http://localhost:${PORT}`);
});
