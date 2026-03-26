// ============================================================
//  CustBuds — Prospecting Agent Backend
//  server.js
//
//  Data-flow:
//    1. Frontend CreateCompanyModal submits { companyName, city, companySize, type }
//       via POST /api/agent/prospect
//    2. We look up the company in mockPublicData to simulate enrichment
//       (replaces a real scraping api like Apollo / Clearbit call)
//    3. We pass BOTH the user input AND the enriched data to the LLM
//    4. The LLM returns strict JSON: { fitScore, scoreReasoning, email1, email2 }
//    5. We forward that JSON straight back to the client
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" })); // allow local frontend connections
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── SIMULATED DATA SOURCE ─────────────────────────────────
const mockPublicData = {
  zomato: {
    recent_news: "Raised $300M Series J; expanding into quick-commerce grocery in 15 new cities.",
    tech_stack: ["React", "Go", "Kafka", "PostgreSQL", "AWS"],
    key_contact: { name: "Rahul Mehta", title: "VP Engineering" },
    pain_points: [
      "Scaling B2B restaurant-partner onboarding",
      "Real-time logistics tracking at scale",
      "Sales rep productivity for enterprise accounts",
    ],
    industry: "FoodTech / Delivery",
    headcount_range: "5,000–10,000",
  },
  default: {
    recent_news: "Recently achieved a significant product milestone and is actively expanding.",
    tech_stack: ["React", "Node.js", "PostgreSQL"],
    key_contact: { name: "The Decision Maker", title: "VP of Sales" },
    pain_points: [
      "Manual prospecting taking up rep time",
      "No visibility into pipeline health",
      "High-effort follow-up sequences",
    ],
    industry: "Technology",
    headcount_range: "Unknown",
  },
};

function lookupCompany(companyName) {
  const normalised = (companyName || "").toLowerCase().trim();
  const match = Object.keys(mockPublicData).find(
    (key) => key !== "default" && normalised.includes(key)
  );
  return mockPublicData[match || "default"];
}

// ── POST /api/agent/prospect ─────────────────────────────
app.post("/api/agent/prospect", async (req, res) => {
  const { companyName, city, companySize, type } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: "companyName is required." });
  }

  // Step 1: Enrich with mock data
  const enriched = lookupCompany(companyName);

  // Step 2: Build the LLM prompt
  const systemPrompt = `You are a world-class B2B Sales Prospecting Agent for CustBuds CRM.
You receive a prospect company profile and must:
1. Score its fit with CustBuds (AI-native CRM for high-growth Indian tech companies) from 0-100.
2. Write two personalised outreach emails referencing the company's ACTUAL recent news and pain points.

Always return ONLY valid JSON. No markdown, no prose outside the JSON object.

JSON schema:
{
  "fitScore": <integer 0-100>,
  "scoreReasoning": "<one concise sentence explaining the score>",
  "email1": "<short cold email, 3-4 sentences, subject line first on its own line starting with 'Subject: '>",
  "email2": "<follow-up email 5-7 days later, 2-3 sentences, subject line first on its own line starting with 'Subject: '>"
}`;

  const userPrompt = `Prospect company: ${companyName}
City: ${city || "Unknown"}
Company size: ${companySize || "Unknown"}
Type: ${type || "Unknown"}

--- Enriched Intelligence (from our data source) ---
Industry: ${enriched.industry}
Headcount range: ${enriched.headcount_range}
Recent news: ${enriched.recent_news}
Tech stack: ${enriched.tech_stack.join(", ")}
Key contact: ${enriched.key_contact.name} (${enriched.key_contact.title})
Known pain points:
${enriched.pain_points.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

Based on everything above, produce the JSON response now.`;

  // Step 3: Call the LLM
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast Groq model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // Guaranteed JSON output
      temperature: 0.7,
    });

    // Step 4: Parse & return back to the UI
    const raw = completion.choices[0].message.content;
    const agentResult = JSON.parse(raw);

    // Attach enriched profile so frontend can display the tech stack and news
    agentResult.enrichedProfile = enriched;

    return res.json(agentResult);
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({ error: "Agent failed", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CustBuds Prospecting Agent running on http://localhost:${PORT}`);
});
