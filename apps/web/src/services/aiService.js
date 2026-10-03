/**
 * ClubSphere Dynamic AI Copilot Service
 * Dual-Engine LLM Integration (Groq & Google Gemini with Auto-Fallback)
 * Strict domain guardrails, anti-hallucination, and live context injection.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const OUT_OF_CONTEXT_RESPONSE = 
  "This question is out of context. I can only assist with questions regarding the ClubSphere portal, campus clubs, events, memberships, and related club operations.";

/**
 * Builds real-time context from the live club ledger and database state
 */
function buildClubContext(club) {
  if (!club) return 'No club currently active.';

  const eventsSummary = (club.events || []).map(e => 
    `• ${e.title} (ID: ${e.id}): Date ${e.date}, Tickets Sold: ${e.sold || 0}/${e.capacity || 100}, Member Price: ₹${e.memberPrice || 0}, Non-Member Price: ₹${e.nonMemberPrice || 0}, Status: ${e.status || 'Active'}`
  ).join('\n');

  const pendingReimb = (club.reimbursements || []).filter(r => r.status !== 'Reimbursed');
  const reimbTotal = pendingReimb.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const activeMembers = (club.members || []).filter(m => m.paid && (!m.exp || new Date(m.exp) >= new Date())).length;
  const expiredMembers = (club.members || []).length - activeMembers;

  const merchSummary = (club.merchandise || []).map(m => {
    const totalStock = m.stock ? Object.values(m.stock).reduce((a, b) => a + b, 0) : 0;
    return `• ${m.name}: Member ₹${m.memberPrice}, Regular ₹${m.nonMemberPrice}, Units in stock: ${totalStock}`;
  }).join('\n');

  return `
ORGANIZATION PROFILE:
- Club Name: ${club.name} (${club.short || club.id})
- Organization ID: ${club.id} (Prefix: ${club.prefix || 'ORG'})
- Category: ${club.category || 'General'}
- Department: ${club.department || 'Student Affairs'}
- Faculty Advisor: ${club.facultyAdvisor || 'Faculty In-Charge'}
- Contact Email: ${club.contactEmail || 'club@campus.edu'}
- Annual Membership Fee: ₹${club.membershipFee || 500}

FINANCIAL LEDGER (LIVE):
- Available Net Balance: ₹${(club.finance?.netBalance || 0).toLocaleString()}
- Total Income: ₹${(club.finance?.totalIncome || 0).toLocaleString()}
- Total Expenses: ₹${(club.finance?.totalExpenses || 0).toLocaleString()}
- Semester Budget Allocated: ₹${(club.finance?.budgetAllocated || 0).toLocaleString()}
- Pending Reimbursements: ${pendingReimb.length} claims totaling ₹${reimbTotal.toLocaleString()}

EVENT SCHEDULE & TICKET SALES:
${eventsSummary || 'No events currently published.'}

MEMBERSHIP ROSTER:
- Total Registered Members: ${(club.members || []).length}
- Active Paid Members: ${activeMembers}
- Expired / Unpaid Members: ${expiredMembers}

OFFICIAL MERCHANDISE INVENTORY:
${merchSummary || 'No merchandise items active.'}

VOLUNTEERS:
- Registered Volunteers: ${(club.volunteers || []).length}
- Active Campaigns / Fundraisers: ${(club.fundraisers || []).length}

CLUBSPHERE PORTAL CAPABILITIES:
- Membership Management: Digital pass issuance, fee collection, CSV export.
- Event Ticketing: Dynamic member discounts, live QR scanner check-in, capacity gating.
- Finance Ledger: Real-time budget tracking, reimbursement claim approvals.
- Merch Store: Size-variant inventory tracking, secure order pickups.
- Verified Certificates: Cryptographically hashed certificates with live QR verification.
- Audit & Security: Immutable ledger logs, multi-tenant isolation guard.
`.trim();
}

/**
 * Builds the strict system instructions
 */
function buildSystemPrompt(club) {
  return `You are the official AI Copilot for ClubSphere (Campus Student Organization System) assisting the organization: ${club?.name || 'Campus Club'} (${club?.short || 'Club'}).

LIVE ORGANIZATION CONTEXT:
${buildClubContext(club)}

STRICT OPERATIONAL RULES:
1. DOMAIN RESTRICTION (STRICT): You MUST ONLY answer questions strictly regarding:
   - The ClubSphere web portal, its features, modules, navigation, and settings.
   - The active campus club (${club?.name || 'this club'}), its events, schedule, ticket prices, members, merchandise, finances, reimbursements, fundraisers, volunteers, and certificates.
   If the user asks ANY question outside this scope (for example: world history, recipes, general programming, external celebrities, mathematics, general knowledge, weather, outside sports, jokes, etc.), you MUST IMMEDIATELY DECLINE with this EXACT response:
   "${OUT_OF_CONTEXT_RESPONSE}"
   Do not entertain, apologize, or answer out-of-context questions under any circumstances.

2. ZERO HALLUCINATION:
   - Base all answers solely on the LIVE ORGANIZATION CONTEXT provided above.
   - If a specific detail (e.g., student phone number, unlisted event, private key) is not recorded in the context, explicitly state that it is not available in the club database.
   - Do not invent numbers, transactions, or event details.

3. CONCISE & SHORT ANSWERS:
   - Give ONLY short, direct answers focused specifically on the question.
   - Avoid lengthy essays, introductions, or redundant filler. Answer what was asked in 1-3 sentences or a quick bulleted list.

4. MULTI-TENANT ISOLATION:
   - If the user asks for financial data or member records of a different club (e.g. Cultural, Sports, Tech when not active), state:
   "⚠️ Tenant Isolation Guard: I am only authorized to access records for ${club?.name || 'this club'}."
`.trim();
}

/**
 * Call Groq API (Primary High-Speed Engine)
 */
async function callGroq(query, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 350,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error('Groq returned empty response');
  return answer;
}

/**
 * Call Google Gemini API (Reliable Fallback Engine)
 */
async function callGemini(query, systemPrompt) {
  // Try available Gemini models in sequence
  const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUSER QUESTION: ${query}\n\nSHORT DIRECT ANSWER:` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 350,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini ${model} HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text?.trim();
      if (text) return text;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

export const aiService = {
  /**
   * Main Dynamic Query Method with Dual-Engine Fallback
   */
  async queryCopilot(club, query) {
    if (!query || !query.trim()) {
      return "Please enter a question regarding ClubSphere or your club's operations.";
    }

    const trimmedQuery = query.trim();

    // Fast heuristic pre-check for blatant out-of-context queries
    const lower = trimmedQuery.toLowerCase();
    const blatantOutOfContext = [
      'how to cook', 'recipe for', 'capital of', 'who is the president', 
      'weather in', 'tell me a joke', 'write a poem about love',
      'who won the world cup', 'translate to french', 'solve x^2'
    ];
    if (blatantOutOfContext.some(k => lower.includes(k))) {
      return OUT_OF_CONTEXT_RESPONSE;
    }

    const systemPrompt = buildSystemPrompt(club);

    // Engine 1: Groq (Ultra-fast, deterministic)
    try {
      const groqAnswer = await callGroq(trimmedQuery, systemPrompt);
      return groqAnswer;
    } catch (groqErr) {
      console.warn('Groq API failed, falling back to Gemini Engine:', groqErr.message);

      // Engine 2: Gemini Fallback
      try {
        const geminiAnswer = await callGemini(trimmedQuery, systemPrompt);
        return geminiAnswer;
      } catch (geminiErr) {
        console.error('Both Groq and Gemini AI engines failed:', geminiErr.message);
        return `⚠️ AI Copilot temporary network error: Unable to connect to language model service. Please try again shortly.`;
      }
    }
  },

  /**
   * Dynamic Event Planner using LLM
   */
  async generateDynamicEventPlan(club, { guestCapacity, targetBudget, theme }) {
    const prompt = `Generate a realistic, optimized event execution plan for ${club.name} (${club.short}).
Parameters:
- Target Guests: ${guestCapacity} attendees
- Total Allocated Budget: ₹${targetBudget}
- Theme / Type: ${theme || 'Campus Technical & Innovation Fest'}

Return ONLY a valid JSON object matching this exact schema without any markdown formatting or backticks:
{
  "title": "string",
  "venueRecommendation": "string",
  "ticketStrategy": {
    "member": number,
    "nonMember": number
  },
  "budgetSplit": [
    { "category": "string", "percent": number, "amt": number }
  ],
  "volunteerAllocation": [
    { "role": "string", "count": number, "suggested": "string" }
  ]
}`;

    const systemPrompt = `You are an expert campus event logistics consultant for ClubSphere. Provide realistic pricing and budget distributions for university clubs. Respond strictly with raw JSON.`;

    try {
      let rawJson = '';
      try {
        rawJson = await callGroq(prompt, systemPrompt);
      } catch {
        rawJson = await callGemini(prompt, systemPrompt);
      }

      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      // Fallback structured calculation if JSON parse fails
      const memberPrice = Math.round(targetBudget / (guestCapacity * 1.6));
      const nonMemberPrice = Math.round(memberPrice * 1.8);
      return {
        title: `${club.short} Annual Grand Summit 2026`,
        guestCapacity,
        targetBudget,
        venueRecommendation: 'University Central Auditorium & Seminar Hall B',
        ticketStrategy: { member: memberPrice, nonMember: nonMemberPrice },
        budgetSplit: [
          { category: 'Venue, Sound & Lighting', percent: 35, amt: Math.round(targetBudget * 0.35) },
          { category: 'Catering, Energy Drinks & Snacks', percent: 30, amt: Math.round(targetBudget * 0.30) },
          { category: 'Prizes, Certificates & Trophies', percent: 25, amt: Math.round(targetBudget * 0.25) },
          { category: 'Promotion, Banners & Social Ads', percent: 10, amt: Math.round(targetBudget * 0.10) }
        ],
        volunteerAllocation: [
          { role: 'Stage & Audio/Video Leads', count: 3, suggested: 'Param Joshi (A/V Expert)' },
          { role: 'Registration & Fast-pass Desk', count: 4, suggested: 'Diya Patel (Logistics)' },
          { role: 'Hospitality & Mentors Liaison', count: 2, suggested: 'Isha Nair (Design & Hospitality)' }
        ]
      };
    }
  }
};
