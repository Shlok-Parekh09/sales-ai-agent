const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

function envValue(name) {
  return String(process.env[name] || "").trim();
}

const groqApiKey = envValue("GROQ_API_KEY");
const groq = groqApiKey
  ? new Groq({ apiKey: groqApiKey })
  : null;
const mistralApiKey = envValue("MISTRAL_API_KEY");
const tavilyApiKey = envValue("TAVILY_API_KEY");
const mistralAlertsModel =
  process.env.MISTRAL_ALERTS_MODEL || "mistral-small-latest";
const mistralPipelineModel =
  process.env.MISTRAL_PIPELINE_MODEL || "mistral-medium-latest";
let mistralAuthBlockedReason = "";
let mistralAuthBlockedLogged = false;

const FIT_SCORE_RUBRIC = [
  { label: "ICP alignment", weight: 0.25 },
  { label: "Business trigger urgency", weight: 0.2 },
  { label: "Problem fit", weight: 0.25 },
  { label: "Buying committee clarity", weight: 0.15 },
  { label: "Evidence quality", weight: 0.15 },
];

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

function normaliseSellerContext(value) {
  const seller = value && typeof value === "object" ? value : {};
  return {
    companyName: safeTrim(seller.companyName),
    companyWebsite: safeTrim(seller.companyWebsite),
    companyDescription: safeTrim(seller.companyDescription),
    outreachGoal: safeTrim(seller.outreachGoal),
    idealCustomer: safeTrim(seller.idealCustomer),
    senderName: safeTrim(seller.senderName),
    senderEmail: safeTrim(seller.senderEmail),
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

async function fetchCompanyResearch(context) {
  if (!tavilyApiKey) {
    return {
      available: false,
      reason: "Detailed company research requires TAVILY_API_KEY in backend/.env.",
      answer: "",
      sources: [],
    };
  }

  const queryParts = [
    context.company_name,
    context.city,
    context.type,
    "company overview recent news growth sales revenue operations CRM",
  ].filter(Boolean);

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query: queryParts.join(" "),
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 8,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Research request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = await response.json();
  const sources = toArray(payload?.results)
    .map((result) => ({
      title: safeTrim(result?.title),
      url: safeTrim(result?.url),
      content: safeTrim(result?.content).slice(0, 900),
      score: Number(result?.score || 0),
    }))
    .filter((source) => source.title && source.url && source.content)
    .slice(0, 8);

  return {
    available: sources.length > 0,
    reason: sources.length > 0 ? "" : "No reliable research sources were returned.",
    answer: safeTrim(payload?.answer),
    sources,
  };
}

function buildProspectingFallback({
  context,
  scoreReasoning = "No analysis was generated because a valid Groq API key is not configured.",
  researchSummary = "Research is unavailable until a valid Groq API key is configured.",
  fallbackReason = "GROQ_API_KEY is not configured.",
}) {
  return {
    fitScore: 0,
    scoreReasoning,
    researchSummary,
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
    fallbackReason,
    researchAvailable: false,
    enrichedProfile: context,
  };
}

function normaliseFitBreakdown(value) {
  const items = Array.isArray(value) ? value : [];
  return FIT_SCORE_RUBRIC.map((rubricItem, index) => {
    const rawItem =
      items.find((item) => safeTrim(item?.label).toLowerCase() === rubricItem.label.toLowerCase()) ||
      items[index] ||
      {};

    return {
      label: rubricItem.label,
      score: clamp(Number(rawItem.score === undefined || rawItem.score === null || rawItem.score === "" ? 50 : rawItem.score), 0, 100),
      summary: safeTrim(rawItem.summary),
    };
  });
}

function calculateFitScore(fitBreakdown, researchAvailable) {
  if (!researchAvailable) return 0;

  const weightedScore = FIT_SCORE_RUBRIC.reduce((sum, rubricItem) => {
    const item = fitBreakdown.find(
      (breakdownItem) => breakdownItem.label.toLowerCase() === rubricItem.label.toLowerCase()
    );
    return sum + (item ? item.score * rubricItem.weight : 0);
  }, 0);

  const evidenceQuality =
    fitBreakdown.find((item) => item.label === "Evidence quality")?.score || 0;
  const cappedScore = evidenceQuality < 35 ? Math.min(weightedScore, 60) : weightedScore;

  return clamp(Math.round(cappedScore), 0, 100);
}

function normaliseAgentResult(raw, fallback, enriched, research) {
  const publicSignals =
    Array.isArray(raw.publicSignals) && raw.publicSignals.length
      ? raw.publicSignals
          .map((signal) => ({
            label: safeTrim(signal?.label),
            detail: safeTrim(signal?.detail),
            source: safeTrim(signal?.source),
            impact: safeTrim(signal?.impact),
          }))
          .filter((signal) => signal.label && signal.detail)
          .slice(0, 8)
      : fallback.publicSignals;
  const fitBreakdown = normaliseFitBreakdown(raw.fitBreakdown);

  return {
    ...fallback,
    ...raw,
    email1: raw.email1 || fallback.email1,
    email2: raw.email2 || fallback.email2,
    researchSummary: raw.researchSummary || fallback.researchSummary,
    scoreReasoning: raw.scoreReasoning || fallback.scoreReasoning,
    fitScore: calculateFitScore(fitBreakdown, Boolean(research?.available)),
    publicSignals,
    fitBreakdown,
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
    researchAvailable: Boolean(research?.available),
    researchSources: toArray(research?.sources).map((source) => ({
      title: source.title,
      url: source.url,
    })),
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
- researchDetails.problem must explain only a risk or gap that appears in the supplied CRM fields.
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
  const sellerContext = normaliseSellerContext(req.body?.sellerContext);

  const fallback = buildProspectingFallback({
    context,
  });
  // Echo the target email back so frontend can use it directly
  if (email) fallback.targetEmail = email;

  if (!groq) {
    return res.json(fallback);
  }

  let research;
  try {
    research = await fetchCompanyResearch(context);
  } catch (err) {
    return res.json({
      ...fallback,
      researchSummary: "Detailed research could not be completed. Verify the research API key and try again.",
      fallbackReason: err.message,
    });
  }

  if (!research.available) {
    return res.json({
      ...buildProspectingFallback({
        context,
        scoreReasoning:
          "Groq is configured, but source-backed fit scoring requires a Tavily API key.",
        researchSummary: research.reason,
        fallbackReason: research.reason,
      }),
      researchSummary: research.reason,
      fallbackReason: research.reason,
    });
  }

  const systemPrompt = `You are a B2B sales prospecting agent for the seller's company.
Your job is to:
1. Produce a detailed, source-backed company research brief.
2. Score fit for the seller's offering using the required rubric.
3. Write personalized outreach based on the supplied CRM inputs and research sources.
4. Create adaptive messaging adjustments based on the supplied CRM inputs and research sources.
5. Summarize verified company priorities, likely business problems, and how the seller's company can help.

Return ONLY valid JSON.

Quality rules:
- Write in polished, professional English with correct grammar.
- Use only the supplied CRM inputs and research sources.
- Write from the seller's company, not from CustBuds unless the seller's company is actually CustBuds.
- Do not invent research, contacts, company news, headcount, market facts, metrics, funding, technology, or activity history.
- Do not use placeholder or hardcoded values.
- If a field cannot be supported by the supplied inputs, leave it empty or explain that the information is unavailable.
- Avoid casual phrasing, hype, and unsupported claims.
- Every publicSignals item must include a source title or source URL from the supplied research sources.
- fitBreakdown must use exactly these five labels in this order: ICP alignment, Business trigger urgency, Problem fit, Buying committee clarity, Evidence quality.
- Score each fitBreakdown category fairly. Treat unknown information as neutral around 50, not as a poor fit. Use scores below 40 only when the evidence shows a clear mismatch. Use 70-85 for credible fit with partial evidence and 85+ only for strongly supported fit.
- The server will calculate final fitScore from fitBreakdown; still return your best fitScore estimate.
- email1 and email2 must each start with a clear "Subject:" line and then the email body.
- Emails must explain what the seller's sales team wants to discuss based on the seller's outreach goal and offering.
- Emails must not mention CustBuds unless CustBuds is the seller's company.

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

Seller company: ${sellerContext.companyName || "Not provided"}
Seller website: ${sellerContext.companyWebsite || ""}
Seller offering: ${sellerContext.companyDescription || "Not provided"}
Seller outreach goal: ${sellerContext.outreachGoal || "Not provided"}
Seller ideal customer: ${sellerContext.idealCustomer || ""}
Sender: ${sellerContext.senderName || ""}${sellerContext.senderEmail ? ` (${sellerContext.senderEmail})` : ""}

Research answer:
${research.answer || ""}

Research sources:
${research.sources
  .map(
    (source, index) =>
      `${index + 1}. ${source.title}
URL: ${source.url}
Excerpt: ${source.content}`
  )
  .join("\n\n")}

Create a detailed, high-signal output for the seller's sales team. The outreach must be about the seller's company, offering, and outreach goal above.

Important:
- Do not mention tech stacks, frameworks, or tooling.
- Do not create publicSignals unless the signal is directly supported by the research sources above.
- Do not include fabricated values, generic market assumptions, or guessed company initiatives.
- Do not default to CustBuds, CRM, AI-native CRM, target research, fit scoring, outreach personalization, or deal-risk visibility unless those are explicitly part of the seller offering.
- In researchSummary, clearly include:
  1. a concise company overview,
  2. recent priorities or business developments supported by sources,
  3. likely business pressures relevant to the seller's offering,
  4. the most relevant positioning angle for the seller's company,
  5. uncertainties or gaps that should be verified before outreach.
- Fit score rubric:
  - ICP alignment: company size, segment, and operating complexity fit for the seller's ideal customer profile.
  - Business trigger urgency: recent changes that make action timely.
  - Problem fit: evidence of a problem or opportunity related to the seller's outreach goal.
  - Buying committee clarity: whether the likely buyer function is identifiable from the inputs or sources.
  - Evidence quality: source quality, specificity, recency, and amount of corroboration.
- Email requirements:
  - Generate a professional subject line for each email.
  - The body must be grammatically correct, concise, and specific.
  - Explain why the seller is reaching out and what conversation the seller's sales team wants to start.
  - Tie the opening to verified research about the target company.
  - Ask for one clear next step.`;

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
    const result = normaliseAgentResult(parsed, fallback, context, research);
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
  console.log(
    `API keys: GROQ_API_KEY=${groqApiKey ? "configured" : "missing"}, TAVILY_API_KEY=${
      tavilyApiKey ? "configured" : "missing"
    }, MISTRAL_API_KEY=${mistralApiKey ? "configured" : "missing"}`
  );
});
