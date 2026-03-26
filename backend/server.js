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

const mockPublicData = {
  zomato: {
    recent_news:
      "Raised fresh capital and is expanding quick-commerce operations across additional cities.",
    tech_stack: ["React", "Go", "Kafka", "PostgreSQL", "AWS"],
    key_contact: { name: "Rahul Mehta", title: "VP Engineering" },
    pain_points: [
      "Scaling B2B restaurant onboarding",
      "Keeping field sales follow-up consistent across regions",
      "Maintaining visibility into expansion pipeline health",
    ],
    industry: "FoodTech / Delivery",
    headcount_range: "5,000-10,000",
  },
  meesho: {
    recent_news:
      "Investing heavily in enterprise partnerships and operational automation as the platform scales.",
    tech_stack: ["React", "Java", "Kafka", "MySQL", "GCP"],
    key_contact: { name: "Aarav Shah", title: "Director of Revenue Operations" },
    pain_points: [
      "Coordinating partner outreach across fast-growing teams",
      "Spotting deal risk early enough to recover momentum",
      "Reducing manual work for revenue managers",
    ],
    industry: "E-commerce Marketplace",
    headcount_range: "10,000+",
  },
  nykaa: {
    recent_news:
      "Expanding omnichannel and B2B initiatives while tightening execution across new growth bets.",
    tech_stack: ["React", "Node.js", "Python", "PostgreSQL", "Azure"],
    key_contact: { name: "Leena Kapoor", title: "VP Sales Strategy" },
    pain_points: [
      "Managing complex B2B motions alongside core retail growth",
      "Keeping pipeline quality high across multiple business units",
      "Improving stakeholder alignment before deals stall",
    ],
    industry: "Retail / Beauty Commerce",
    headcount_range: "1,000-5,000",
  },
  default: {
    recent_news:
      "Recently reached an expansion milestone and appears to be investing in new go-to-market capacity.",
    tech_stack: ["React", "Node.js", "PostgreSQL"],
    key_contact: { name: "The Decision Maker", title: "VP of Sales" },
    pain_points: [
      "Manual prospecting taking up rep time",
      "Limited visibility into pipeline health",
      "High-effort follow-up sequences",
    ],
    industry: "Technology",
    headcount_range: "Unknown",
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function lookupCompany(companyName) {
  const normalised = String(companyName || "").toLowerCase().trim();
  const match = Object.keys(mockPublicData).find(
    (key) => key !== "default" && normalised.includes(key)
  );
  return clone(mockPublicData[match || "default"]);
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

function buildPublicSignals(companyName, enriched) {
  return [
    {
      label: "Recent momentum",
      detail: enriched.recent_news,
      source: "Public company updates",
      impact: `Tie CustBuds to ${companyName}'s current growth priorities and execution pressure.`,
    },
    {
      label: "Operating environment",
      detail: `${enriched.industry} teams in the ${enriched.headcount_range} range often need tighter pipeline control and lower rep admin.`,
      source: "Industry pattern",
      impact: "Position AI-assisted selling as an operating leverage play, not just a CRM replacement.",
    },
    {
      label: "Workflow pressure",
      detail:
        enriched.pain_points[0] ||
        `${companyName} likely needs tighter prospecting and pipeline execution as the team grows.`,
      source: "Revenue workflow pattern",
      impact: "Anchor the conversation on a concrete selling bottleneck instead of generic AI positioning.",
    },
  ];
}

function parseHeadcountMidpoint(value) {
  const raw = String(value || "").toLowerCase().replace(/,/g, "").trim();
  if (!raw) return null;

  const rangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2;
  }

  const plusMatch = raw.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (plusMatch) {
    return Number(plusMatch[1]);
  }

  const singleMatch = raw.match(/(\d+(?:\.\d+)?)/);
  return singleMatch ? Number(singleMatch[1]) : null;
}

function buildFitBreakdown(companySize, type, enriched) {
  const midpoint =
    parseHeadcountMidpoint(companySize) || parseHeadcountMidpoint(enriched.headcount_range);
  let sizeScore = 70;
  if (midpoint !== null) {
    if (midpoint <= 10) sizeScore = 60;
    else if (midpoint <= 50) sizeScore = 68;
    else if (midpoint <= 200) sizeScore = 80;
    else if (midpoint <= 1000) sizeScore = 90;
    else if (midpoint <= 5000) sizeScore = 87;
    else sizeScore = 82;
  }

  const urgencyMatches = enriched.pain_points.filter((point) =>
    /pipeline|prospecting|follow-up|sales|visibility|stakeholder|manual/i.test(point)
  ).length;
  const urgencyScore = clamp(68 + urgencyMatches * 8, 68, 92);

  const motionText = `${type || ""} ${enriched.industry || ""}`.toLowerCase();
  const motionMatches = [
    "prospect",
    "partner",
    "technology",
    "marketplace",
    "retail",
    "delivery",
    "commerce",
    "b2b",
  ].filter((keyword) => motionText.includes(keyword)).length;
  const motionScore = clamp(
    70 + motionMatches * 4 + (/prospect|partner|customer/i.test(String(type || "")) ? 6 : 0),
    70,
    90
  );

  const readinessSignals = [
    midpoint !== null,
    Boolean(enriched.recent_news),
    Boolean(enriched.industry && enriched.industry !== "Unknown"),
  ].filter(Boolean).length;
  const adoptionScore = clamp(70 + readinessSignals * 6, 70, 88);

  return [
    {
      label: "ICP fit",
      score: sizeScore,
      summary:
        sizeScore >= 80
          ? "Company size and operating complexity align well with CustBuds' strongest use cases."
          : "There is fit, but the buying motion may require a narrower initial entry point.",
    },
    {
      label: "Pain urgency",
      score: urgencyScore,
      summary:
        urgencyScore >= 85
          ? "Their likely revenue workflow friction maps directly to the platform's automation strengths."
          : "Pain exists, but the message should emphasize measurable workflow lift.",
    },
    {
      label: "Go-to-market relevance",
      score: motionScore,
      summary:
        motionScore >= 80
          ? "The current business motion suggests a strong case for AI-assisted prospecting and pipeline monitoring."
          : "Positioning should stay focused on one revenue team and one bottleneck first.",
    },
    {
      label: "Adoption readiness",
      score: adoptionScore,
      summary:
        adoptionScore >= 80
          ? "Their digital maturity suggests they can absorb workflow automation quickly."
          : "Keep implementation language light and outcomes-focused.",
    },
  ];
}

function buildProspectingFallback({
  companyName,
  city,
  companySize,
  type,
  owner,
  enriched,
}) {
  const publicSignals = buildPublicSignals(companyName, enriched);
  const fitBreakdown = buildFitBreakdown(companySize, type, enriched);
  const fitWeights = [0.35, 0.3, 0.2, 0.15];
  const fitScore = Math.round(
    fitBreakdown.reduce(
      (sum, item, index) => sum + item.score * (fitWeights[index] || 0),
      0
    )
  );
  const contactName = owner || enriched.key_contact.name || "the revenue leader";
  const firstName = contactName.split(" ")[0] || "there";
  const mainPain = enriched.pain_points[0] || "manual revenue execution";
  const secondPain =
    enriched.pain_points[1] || "limited visibility into pipeline health";
  const proofPoint = publicSignals[0].detail;

  return {
    fitScore,
    scoreReasoning: `${companyName} shows a strong fit because its current growth motion suggests pressure on prospecting quality, pipeline visibility, and follow-up consistency.`,
    researchSummary: `${companyName}${city ? ` in ${city}` : ""} is currently focused on ${proofPoint.charAt(0).toLowerCase()}${proofPoint.slice(1)}. The likely problem for the team is ${mainPain.toLowerCase()} alongside ${secondPain.toLowerCase()}. CustBuds can help by improving target research, follow-up consistency, and early deal-risk visibility without adding more manual admin work.`,
    publicSignals,
    fitBreakdown,
    buyerPersonas: [
      {
        name: contactName,
        title: enriched.key_contact.title,
        why: "Likely to own revenue workflow efficiency, team productivity, or pipeline performance.",
      },
      {
        name: "Revenue Operations Lead",
        title: "RevOps / GTM Systems",
        why: "Can sponsor automation if the message is framed around process lift and data visibility.",
      },
    ],
    sequence: [
      {
        step: "Step 1",
        channel: "Email",
        timing: "Day 1",
        objective: "Connect CustBuds to a visible business priority",
        message: `Anchor on ${proofPoint} and relate it to the cost of ${mainPain.toLowerCase()}.`,
      },
      {
        step: "Step 2",
        channel: "Call / voicemail",
        timing: "Day 3",
        objective: "Test urgency and validate ownership",
        message: `Ask whether ${contactName} or RevOps is currently responsible for fixing ${secondPain.toLowerCase()}.`,
      },
      {
        step: "Step 3",
        channel: "Follow-up email",
        timing: "Day 6",
        objective: "Offer a low-friction next step",
        message: "Propose a short workflow teardown focused on prospecting coverage and deal-risk visibility.",
      },
      {
        step: "Step 4",
        channel: "Executive note",
        timing: "Day 10",
        objective: "Escalate with business outcomes",
        message: "Reframe the conversation around rep productivity, response speed, and pipeline accuracy.",
      },
    ],
    email1: `Subject: Reducing manual prospecting load at ${companyName}

${firstName}, I noticed ${proofPoint.charAt(0).toLowerCase()}${proofPoint.slice(1)}. Teams in that position usually start feeling pressure on ${mainPain.toLowerCase()} and on keeping pipeline quality high as volume increases.

CustBuds helps revenue teams research targets faster, score fit automatically, and keep follow-up moving without adding more admin work. If useful, I can share a short walkthrough focused on how teams use it to tighten pipeline coverage and cut rep busywork.`,
    email2: `Subject: Re: reducing manual prospecting load at ${companyName}

${firstName}, following up in case improving ${secondPain.toLowerCase()} is on the roadmap this quarter. I can send a concise point of view on how teams use CustBuds to surface risk earlier and keep outreach personalized without manual sequence work.`,
    callOpener: `I was reaching out because ${companyName} looks like it is scaling through a moment where prospecting quality and pipeline visibility matter more than ever. I wanted to ask how your team is currently handling target research, follow-up, and deal-risk coverage today.`,
    messagingAdjustments: [
      {
        signal: "No opens after the first email",
        adjustment: "Shift the subject line from product framing to a current operating priority.",
        talkingPoints: [
          `Reference ${proofPoint.toLowerCase()}.`,
          "Ask whether the bigger issue is target quality or follow-up consistency.",
          "Offer a one-page diagnostic instead of a meeting ask.",
        ],
      },
      {
        signal: "Opened but no reply",
        adjustment: "Move from general value to a sharper operational hypothesis.",
        talkingPoints: [
          `Name ${mainPain.toLowerCase()} directly.`,
          "Suggest a 15-minute workflow teardown tied to current pipeline execution.",
          "Give two concrete outcomes the team could improve in one quarter.",
        ],
      },
      {
        signal: "Positive engagement from the contact",
        adjustment: "Expand the message to implementation and stakeholder coverage.",
        talkingPoints: [
          "Bring RevOps into the conversation early.",
          "Show how research, scoring, and deal monitoring work together in one motion.",
          "Offer a pilot plan with clear success criteria.",
        ],
      },
    ],
    nextActions: [
      `Lead with ${publicSignals[0].label.toLowerCase()} in the first touch.`,
      "Use the follow-up to validate who owns pipeline inspection and outbound consistency.",
      "Route strong interest into a short workflow teardown instead of a generic demo.",
    ],
    generatedAt: new Date().toISOString(),
    fallback: true,
    enrichedProfile: enriched,
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

  if (!deals.length || !mistralApiKey) {
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
    risk: safeTrim(deal.risk),
    health: Number(deal.health),
    value: safeTrim(deal.value),
    owner: safeTrim(deal.owner),
    close: safeTrim(deal.close),
    company: safeTrim(deal.company),
    contact: safeTrim(deal.contact),
    activityCount: Number(deal.activityCount || 0),
    lastActivityLabel: safeTrim(deal.lastActivityLabel),
    researchSummary: safeTrim(deal.researchSummary),
    companyFocus: safeTrim(deal.companyFocus),
    signals: toArray(deal.signals).map((signal) => safeTrim(signal)).filter(Boolean).slice(0, 4),
    recovery: deal.recovery && typeof deal.recovery === "object"
      ? {
          headline: safeTrim(deal.recovery.headline),
          action: safeTrim(deal.recovery.action),
          talkingPoints: toArray(deal.recovery.talkingPoints)
            .map((point) => safeTrim(point))
            .filter(Boolean)
            .slice(0, 4),
        }
      : null,
  }));

  const alertsPrompt = `Deals snapshot:
${JSON.stringify(compactDeals, null, 2)}

Write concise alert rows for the highest-priority risk signals. Use any researchSummary or companyFocus context to make the alert more specific to what the company is currently doing and why the risk matters now.`;

  const pipelinePrompt = `Deals snapshot:
${JSON.stringify(compactDeals.filter((deal) => deal.recovery), null, 2)}

Write recovery plays for the pipeline risk monitor using the existing risk, recovery context, and company research details. For each deal, explain what the company is currently focused on, what problem CustBuds can solve for them, and how the seller should position help.`;

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
- Keep each msg under 120 characters.
- Use only tones "danger", "info", or "positive".
- Use only the provided deal ids.
- Focus on risk signals, not generic summaries.
- When research context is available, tie the alert to what the company is currently doing.
- Surface possible risks such as momentum loss, missing stakeholders, weak research coverage, competitor pressure, or a mismatch between current focus and deal progress.`,
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
- Use only the provided deal ids.
- Headline should be a short, concrete recovery angle.
- Action should be one sentence.
- talkingPoints should contain 2 to 4 specific seller talking points.
- Preserve the risk context already present in the snapshot.
- researchDetails.currentFocus must summarize what the company is currently focused on.
- researchDetails.problem must explain the revenue or pipeline problem CustBuds can solve.
- researchDetails.helpAngle must say how CustBuds should help in practical business terms.
- Do not mention tech stacks, frameworks, or engineering tooling.`,
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
  const { companyName, city, companySize, type, owner } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: "companyName is required." });
  }

  const enriched = lookupCompany(companyName);
  if (owner && owner.trim() !== "" && owner.trim() !== "No owner") {
    enriched.key_contact = { name: owner.trim(), title: "Company Contact" };
  }

  const fallback = buildProspectingFallback({
    companyName,
    city,
    companySize,
    type,
    owner,
    enriched,
  });

  if (!groq) {
    return res.json(fallback);
  }

  const systemPrompt = `You are a B2B sales prospecting agent for CustBuds CRM.
Your job is to:
1. Research the target using the supplied public signals.
2. Score fit for CustBuds from 0-100.
3. Write personalized outreach.
4. Create adaptive messaging adjustments based on engagement signals.
5. Summarize what the company is currently focused on, what problem they are likely facing, and how CustBuds can help.

Return ONLY valid JSON.

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
City: ${city || "Unknown"}
Company size: ${companySize || "Unknown"}
Type: ${type || "Unknown"}

Public research inputs:
- Industry: ${enriched.industry}
- Headcount range: ${enriched.headcount_range}
- Recent news: ${enriched.recent_news}
- Key contact: ${enriched.key_contact.name} (${enriched.key_contact.title})
- Pain points:
${enriched.pain_points.map((point, index) => `  ${index + 1}. ${point}`).join("\n")}

Create a concise, high-signal output for a revenue team selling an AI-native CRM that improves target research, fit scoring, outreach personalization, and deal-risk visibility.

Important:
- Do not mention tech stacks, frameworks, or tooling.
- In researchSummary, clearly include:
  1. what the company is currently focused on,
  2. what problem or pressure they are likely facing,
  3. how CustBuds can help solve that problem.`;

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
    return res.json(normaliseAgentResult(parsed, fallback, enriched));
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
