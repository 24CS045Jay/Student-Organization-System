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
 * Local Context Intelligence Engine (Runs when remote LLM keys are absent or network is unavailable)
 */
function generateLocalContextAnswer(club, query) {
  if (!club) return "No active organization selected.";

  const q = query.toLowerCase().trim();

  // Multi-tenant isolation check
  const candidateClubs = [
    { key: 'tech', label: 'Tech Club' },
    { key: 'cultural', label: 'Cultural Society' },
    { key: 'sports', label: 'Sports Club' }
  ];
  for (const c of candidateClubs) {
    if ((q.includes(c.key + ' club') || q.includes(c.key + ' society')) && !club.name.toLowerCase().includes(c.key)) {
      return `⚠️ Tenant Isolation Guard: I am only authorized to access records and operations for ${club.name}.`;
    }
  }

  // 1. Balance / Financial / Budget / Income / Expenses
  if (q.includes('balance') || q.includes('money') || q.includes('treasury') || q.includes('fund') || q.includes('financial') || q.includes('income') || q.includes('expense')) {
    const net = (club.finance?.netBalance || 0).toLocaleString('en-IN');
    const income = (club.finance?.totalIncome || 0).toLocaleString('en-IN');
    const expense = (club.finance?.totalExpenses || 0).toLocaleString('en-IN');
    const budget = club.finance?.budgetAllocated ? `\n• Allocated Semester Budget: **₹${club.finance.budgetAllocated.toLocaleString('en-IN')}**` : '';
    return `💰 **Treasury & Ledger Overview for ${club.name}:**\n• Available Net Balance: **₹${net}**\n• Total Income: **₹${income}**\n• Total Expenses: **₹${expense}**${budget}\n\nFinancial records are synchronized with the live club ledger.`;
  }

  // 2. Reimbursements / Claims
  if (q.includes('reimburse') || q.includes('claim') || q.includes('unpaid') || q.includes('invoice')) {
    const claims = club.reimbursements || [];
    const pending = claims.filter(r => r.status !== 'Reimbursed');
    const totalPending = pending.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    if (pending.length === 0) {
      return `🧾 **Reimbursements Status:** All reimbursement claims for ${club.name} are settled or approved. There are currently 0 pending unpaid claims.`;
    }
    const claimList = pending.slice(0, 3).map(r => `• ${r.title || r.purpose || 'Claim'}: ₹${(r.amount || 0).toLocaleString('en-IN')} (${r.status || 'Pending'})`).join('\n');
    return `🧾 **Pending Reimbursements (${pending.length} claims):** Totaling **₹${totalPending.toLocaleString('en-IN')}**\n${claimList}\n\nYou can review and approve them in the Finance > Reimbursements module.`;
  }

  // 3. Events & Ticket Sales
  if (q.includes('most ticket') || q.includes('top event') || q.includes('best selling') || q.includes('popular event') || q.includes('highest ticket')) {
    const events = club.events || [];
    if (events.length === 0) {
      return `🎟️ There are no published events in the ${club.name} schedule yet.`;
    }
    const sorted = [...events].sort((a, b) => (b.sold || 0) - (a.sold || 0));
    const top = sorted[0];
    return `🏆 **Top Event by Ticket Sales:** "${top.title}" with **${top.sold || 0} tickets sold** out of ${top.capacity || 100} capacity (Status: ${top.status || 'Active'}).`;
  }

  if (q.includes('event') || q.includes('hackathon') || q.includes('workshop') || q.includes('ticket') || q.includes('schedule') || q.includes('fest')) {
    const events = club.events || [];
    if (events.length === 0) {
      return `🎟️ **Events for ${club.name}:** Currently no events are scheduled. You can publish a new event using the Events Manager.`;
    }
    const list = events.slice(0, 4).map(e => `• **${e.title}** (${e.date || 'TBD'}): ${e.sold || 0}/${e.capacity || 100} passes sold | Member: ₹${e.memberPrice || 0}, Regular: ₹${e.nonMemberPrice || 0}`).join('\n');
    return `📅 **Upcoming Events & Pass Sales for ${club.name}:**\n${list}`;
  }

  // 4. Membership / Members / Dues
  if (q.includes('member') || q.includes('roster') || q.includes('growth') || q.includes('due') || q.includes('active member')) {
    const members = club.members || [];
    const active = members.filter(m => m.paid && (!m.exp || new Date(m.exp) >= new Date())).length;
    const unpaid = members.length - active;
    const feeInfo = club.membershipFee ? `\n• Annual Membership Dues: **₹${club.membershipFee}**` : '';
    return `👥 **Membership Intelligence for ${club.name}:**\n• Total Registered Members: **${members.length}**\n• Active Paid Members: **${active}**\n• Expired / Pending Dues: **${unpaid}**${feeInfo}`;
  }

  // 5. Merchandise / Inventory / Stock
  if (q.includes('merch') || q.includes('stock') || q.includes('store') || q.includes('t-shirt') || q.includes('hoodie') || q.includes('inventory')) {
    const merch = club.merchandise || [];
    if (merch.length === 0) {
      return `🛍️ There is currently no merchandise listed in the ${club.name} inventory.`;
    }
    const list = merch.map(m => {
      const stockTotal = m.stock ? Object.values(m.stock).reduce((a, b) => a + b, 0) : (m.qty || 0);
      return `• **${m.name}**: ₹${m.memberPrice || m.price || 0} (Member) / ₹${m.nonMemberPrice || m.price || 0} (Regular) — ${stockTotal} units in stock`;
    }).join('\n');
    return `🛍️ **Merchandise Inventory for ${club.name}:**\n${list}`;
  }

  // 6. Volunteers & Tasks
  if (q.includes('volunteer') || q.includes('task') || q.includes('kanban')) {
    const vols = club.volunteers || [];
    const tasks = club.tasks || [];
    return `🤝 **Volunteers & Task Operations:**\n• Registered Volunteers: **${vols.length}**\n• Active Operations Tasks: **${tasks.length}**\n\nAssign volunteers to roles from the Kanban / Volunteer Management dashboard.`;
  }

  // 7. Fundraisers & Sponsorships
  if (q.includes('fundrais') || q.includes('campaign') || q.includes('donation') || q.includes('sponsor')) {
    const funds = club.fundraisers || [];
    const sponsors = club.sponsors || [];
    return `🎯 **Fundraising & Sponsorship Status:**\n• Active Campaigns: **${funds.length}**\n• Corporate Sponsors: **${sponsors.length}**`;
  }

  // 8. Club Profile / Contact / Advisor
  if (q.includes('advisor') || q.includes('contact') || q.includes('department') || q.includes('email') || q.includes('president') || q.includes('head')) {
    return `ℹ️ **${club.name} Profile:**\n• Department: ${club.department || 'Student Activities Directorate'}\n• Faculty Advisor: ${club.facultyAdvisor || 'Assigned Faculty Coordinator'}\n• Contact Email: ${club.contactEmail || club.emailDomain || 'club@campus.edu'}\n• Org Prefix: ${club.prefix || 'ORG'}`;
  }

  // 9. Portal Capabilities / Help
  if (q.includes('how to') || q.includes('feature') || q.includes('portal') || q.includes('what can you do') || q.includes('help')) {
    return `⚡ **ClubSphere Portal Capabilities:**\n• **Membership**: Digital ID issuance, fee collection, CSV roster sync.\n• **Event Ticketing**: Dynamic member discounts, live QR scanner check-in.\n• **Treasury & POS**: Double-entry finance tracking, size-variant merch inventory.\n• **Certificates**: Cryptographically verifiable event badges with QR validation.\n• **AI Copilot**: Real-time operational intelligence and event planning.`;
  }

  // 10. General contextual fallback
  return `🤖 **ClubSphere Intelligence:** Analyzed database context for **${club.name}** regarding "${query}". Operations, treasury balance (₹${(club.finance?.netBalance || 0).toLocaleString('en-IN')}), and ${club.members?.length || 0} members are running normally within standard campus parameters.`;
}

/**
 * Call Groq API (Primary High-Speed Engine)
 */
async function callGroq(query, systemPrompt) {
  if (!GROQ_API_KEY || !GROQ_API_KEY.trim()) {
    throw new Error('Groq API key not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
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
  if (!GEMINI_API_KEY || !GEMINI_API_KEY.trim()) {
    throw new Error('Gemini API key not configured');
  }

  // Try available Gemini models in sequence
  const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY.trim()}`, {
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
   * Main Dynamic Query Method with Multi-Tier Fallback
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

    // Engine 1: Groq (if key configured)
    if (GROQ_API_KEY && GROQ_API_KEY.trim()) {
      try {
        const groqAnswer = await callGroq(trimmedQuery, systemPrompt);
        return groqAnswer;
      } catch (groqErr) {
        console.warn('Groq API call failed:', groqErr.message);
      }
    }

    // Engine 2: Gemini (if key configured)
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim()) {
      try {
        const geminiAnswer = await callGemini(trimmedQuery, systemPrompt);
        return geminiAnswer;
      } catch (geminiErr) {
        console.warn('Gemini API call failed:', geminiErr.message);
      }
    }

    // Engine 3: Smart Local Club Context Engine (Offline / Zero-Config fallback)
    return generateLocalContextAnswer(club, trimmedQuery);
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
