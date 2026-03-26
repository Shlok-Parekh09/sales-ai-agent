require("dotenv").config();
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
      label: "Workflow complexity",
      detail: `Current stack includes ${enriched.tech_stack.join(", ")}.`,
      source: "Public technical footprint",
      impact: "Lead with faster adoption and easier workflow orchestration across existing systems.",
    },
  ];
}

function buildFitBreakdown(companySize, type, enriched) {
  const sizeScore = /201|500|1000|5000/.test(String(companySize || ""))
    ? 88
    : /51|11/.test(String(companySize || ""))
    ? 76
    : 64;
  const urgencyScore = enriched.pain_points.some((point) =>
    /pipeline|prospecting|follow-up|sales/i.test(point)
  )
    ? 90
    : 72;
  const motionScore = /prospect|partner|technology/i.test(
    `${type || ""} ${enriched.industry || ""}`
  )
    ? 84
    : 73;
  const adoptionScore = enriched.tech_stack.length >= 4 ? 82 : 74;

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
  const fitScore = Math.round(
    fitBreakdown.reduce((sum, item) => sum + item.score, 0) / fitBreakdown.length
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
    researchSummary: `${companyName}${city ? ` in ${city}` : ""} appears to be operating through a period of growth and execution complexity. The strongest angle for CustBuds is helping the team reduce manual prospecting effort, maintain cleaner pipeline coverage, and run sharper follow-up without adding process overhead.`,
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
- Tech stack: ${enriched.tech_stack.join(", ")}
- Key contact: ${enriched.key_contact.name} (${enriched.key_contact.title})
- Pain points:
${enriched.pain_points.map((point, index) => `  ${index + 1}. ${point}`).join("\n")}

Create a concise, high-signal output for a revenue team selling an AI-native CRM that improves target research, fit scoring, outreach personalization, and deal-risk visibility.`;

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

app.listen(PORT, () => {
  console.log(`CustBuds Prospecting Agent running on http://localhost:${PORT}`);
});
