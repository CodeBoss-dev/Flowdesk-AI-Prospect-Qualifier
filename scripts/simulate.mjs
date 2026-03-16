/**
 * simulate.mjs
 * Runs 100 scripted prospect personas through real Groq multi-turn conversations.
 * Each persona has a script of responses that drive the conversation naturally.
 * Results are written to src/data/simulationResults.json.
 *
 * Run: node scripts/simulate.mjs
 * Requires: VITE_GROQ_API_KEY in .env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load .env manually (no dotenv dep)
const envPath = path.join(ROOT, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/VITE_GROQ_API_KEY=(.+)/);
if (!apiKeyMatch) { console.error('No VITE_GROQ_API_KEY found in .env'); process.exit(1); }
const API_KEY = apiKeyMatch[1].trim();

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const CONCURRENT = 1;   // sequential — free Groq tier can't handle concurrent multi-turn bursts
const RETRY_DELAY = 8000;
const BETWEEN_CALL_DELAY = 1200; // ms between each API call within a conversation

const SYSTEM_PROMPT = `You are Aria, a smart and warm sales assistant for FlowDesk — an AI-powered internal helpdesk tool for mid-market companies (100–1000 employees).

Your job is to qualify prospects before they book a demo with our team. You do this through a short, natural conversation — not a form. You ask one question at a time. You listen carefully and adapt your next question based on what they tell you.

You are trying to assess four things: whether they have budget, whether they're the decision maker, whether they have a real problem FlowDesk solves, and whether they have a timeline.

FlowDesk is NOT a good fit for: companies under 50 people, B2C businesses, government orgs, or companies already on enterprise-tier ServiceNow or Zendesk. If you detect a disqualifier, wrap up the conversation warmly and honestly — don't waste their time.

Keep the conversation to 5–8 exchanges. Be warm, human, and concise. Never mention scoring, rubrics, or qualification criteria. You're here to understand their situation, not interrogate them.

When you have enough information (or after 8 exchanges), output ONLY the following JSON and nothing else. This signals the end of the conversation:

{
  "done": true,
  "budget_score": <0|5|15|25>,
  "authority_score": <0|5|15|25>,
  "need_score": <0|5|15|25>,
  "timeline_score": <0|5|15|25>,
  "summary": "<2 sentence plain-English summary of this prospect's situation>",
  "disqualified": <true|false>,
  "disqualify_reason": "<only if disqualified — brief honest reason>"
}

Until you are ready to output the final JSON, respond with only your next conversational message. No JSON, no preamble, just the message.`;

const FORCE_JSON = 'The conversation has reached its limit. Summarize what you know and output the final JSON now.';

// ─── 100 Prospect Personas ────────────────────────────────────────────────────
// Each persona has a name, company, and a scripted array of user replies.
// Replies are short and natural — just like a real prospect would type.

const PERSONAS = [
  // HIGH FIT (strong BANT) — 35 personas
  { id: 1,  name: 'Sarah Chen',      company: 'Meridian Logistics',      replies: ["Hi, I'm the VP of Operations at Meridian Logistics, we have about 320 employees.", "We're drowning in IT and HR tickets. Things fall through the cracks constantly and I have no visibility.", "Yes I'm the one who signs off on tools like this.", "We've budgeted around $2,500 a month for this kind of solution.", "We need something in place within the next 3 weeks ideally."] },
  { id: 2,  name: 'James Okafor',    company: 'Finbridge Capital',       replies: ["I'm the Head of IT at Finbridge Capital, around 210 people.", "Our ticket triage process is a mess. Engineers are getting pulled into basic requests.", "I make the final call on IT tooling.", "We have a budget of about $2k a month set aside.", "We're evaluating options this quarter, want to move before end of Q1."] },
  { id: 3,  name: 'Priya Nair',      company: 'Helios SaaS',             replies: ["COO at Helios, we're around 450 employees.", "Support team is overwhelmed, no SLA tracking, tickets getting lost.", "I champion it but CTO needs to co-sign.", "Budget isn't an issue, we're thinking $3–4k range.", "Looking at next 30–45 days."] },
  { id: 4,  name: 'Tom Reeves',      company: 'BuildRight Construction', replies: ["I'm the founder and CEO, we have about 180 people across 3 offices.", "HR and IT requests come to me or just get lost. There's zero structure.", "It's my decision entirely.", "We're flexible on budget, probably $1,500–2k a month.", "Want to have something running by next quarter."] },
  { id: 5,  name: 'Aisha Mwangi',    company: 'NovaCare Health Tech',    replies: ["Head of Operations at NovaCare, we're 260 employees.", "Our resolution times are terrible. Nobody knows who owns what ticket.", "I'm the main decision maker for ops tooling.", "Budget around $2k a month, maybe a bit more.", "We'd like to move in the next month or so."] },
  { id: 6,  name: 'Carlos Rivera',   company: 'SwiftDeliver',            replies: ["I'm VP of Ops at SwiftDeliver, about 400 employees in logistics.", "We're scaling fast and internal support hasn't kept up.", "Yes, I own this decision.", "Budget is around $3,500/month for the right tool.", "We need something now, within 2–3 weeks."] },
  { id: 7,  name: 'Elena Vasquez',   company: 'TrustLayer Fintech',      replies: ["COO at TrustLayer, we have 350 people.", "Compliance teams are filing tickets manually. It's chaos.", "I make this call with CFO input.", "We've set aside $2,500/month.", "Timeline is end of this month."] },
  { id: 8,  name: 'Marcus Webb',     company: 'Arcadia Cloud',           replies: ["I'm the Head of IT, about 280 employees.", "We use spreadsheets to track tickets. It's embarrassing honestly.", "Yes, fully my decision.", "Budget's around $2k.", "We want to start next month."] },
  { id: 9,  name: 'Fatima Al-Rashid','company': 'DataBridge Analytics',  replies: ["VP Operations at DataBridge, roughly 190 employees.", "Tickets are falling through the cracks. Senior staff getting pulled into trivia.", "I own this entirely.", "$1,800/month is our target.", "Looking to go live in 3–4 weeks."] },
  { id: 10, name: 'Oliver Strauss',  company: 'Northwind Logistics',     replies: ["CTO at Northwind, we're at 500 employees.", "Engineering keeps getting interrupted by IT support requests.", "My call.", "We'd pay $3–4k for the right platform.", "Ready to move this month."] },
  { id: 11, name: 'Ingrid Larsen',   company: 'PolarOps SaaS',           replies: ["COO, 420 employees.", "No ticket system at all. Everything is Slack DMs.", "Yes, my decision.", "Budget around $3k.", "We need something in place ASAP, 2 weeks max."] },
  { id: 12, name: 'Kwame Asante',    company: 'SunbeltTech',             replies: ["Head of IT, 300 people.", "Tickets get sent to a shared email and nobody monitors it.", "I own this.", "$2,500/month budget.", "Want to be live by end of month."] },
  { id: 13, name: 'Nadia Petrov',    company: 'Horizon FinOps',          replies: ["VP of Ops, 240 employees.", "Resolution times are through the roof. Employees are frustrated.", "Yes, I'm the buyer.", "Around $2k/month.", "Next 3–4 weeks."] },
  { id: 14, name: 'Hiroshi Tanaka',  company: 'FluxScale Systems',       replies: ["COO, 380 people.", "We have no internal helpdesk structure. It's ad-hoc.", "I decide with the CEO.", "Budget $3,000/month.", "We'd want to start immediately."] },
  { id: 15, name: 'Amara Diallo',    company: 'ClearOps Logistics',      replies: ["Head of Operations, 155 employees.", "IT team is tiny but getting too many requests.", "Yes, I sign off.", "$1,500/month.", "Trying to move in 2–3 weeks."] },
  { id: 16, name: 'Ben Nguyen',      company: 'LaunchPad SaaS',          replies: ["Founder-CEO, 120 people.", "I'm the one people message for everything. It doesn't scale.", "My decision.", "We can do $900–1,200/month.", "Want it live this month."] },
  { id: 17, name: 'Rosa Fuentes',    company: 'MedLink Tech',            replies: ["Head of IT, 290 employees.", "Clinical staff filing IT tickets through email. Very disorganized.", "Yes, full authority.", "$2,500/month.", "We're looking at the next 3 weeks."] },
  { id: 18, name: 'Patrick Dolan',   company: 'BridgeWave Fintech',      replies: ["COO, 460 employees.", "Support team is overwhelmed since we doubled headcount.", "My call.", "$3,500/month budget.", "We need something in the next 2–4 weeks."] },
  { id: 19, name: 'Yuki Sato',       company: 'HyperShip Logistics',     replies: ["VP Operations, 330 employees.", "Warehouse staff and office staff both filing tickets the same way. No routing.", "I decide.", "$2,800/month.", "This quarter, ideally this month."] },
  { id: 20, name: 'Liam O\'Brien',   company: 'CelticTech',              replies: ["Head of IT, 210 people.", "We're on a ticketing spreadsheet. I'm embarrassed to say it.", "My decision.", "$1,800/month.", "We want to migrate in the next 30 days."] },
  { id: 21, name: 'Sofia Lindqvist', company: 'NordOps',                 replies: ["COO, 390 employees.", "HR tickets and IT tickets go to the same mailbox. Zero structure.", "Yes, I own this.", "$3,000/month.", "We'd like to go live by end of this month."] },
  { id: 22, name: 'Derek Powell',    company: 'Apogee Analytics',        replies: ["VP of Engineering, 250 people.", "Dev team keeps getting pulled into IT support.", "I decide with the COO.", "$2,000/month.", "Looking at next 2–3 weeks."] },
  { id: 23, name: 'Zara Hussain',    company: 'UrbanGrid Fintech',       replies: ["Head of Operations, 175 people.", "Tickets get lost. No SLA tracking. Teams frustrated.", "My call.", "$1,500/month.", "We want something by end of this month."] },
  { id: 24, name: 'Anton Keller',    company: 'EuroScale SaaS',          replies: ["CTO, 430 employees.", "Internal requests flood into engineering slack. It's blocking us.", "Yes, I'm the decision maker.", "$3,500/month budget.", "Ready to move in the next 2 weeks."] },
  { id: 25, name: 'Camille Dupont',  company: 'LyonOps Logistics',       replies: ["COO, 200 employees.", "We have a ticket backlog and zero visibility on resolution.", "My decision.", "$1,800/month.", "We're looking to deploy this quarter."] },
  { id: 26, name: 'Noah Adeyemi',    company: 'LagosCloud',              replies: ["Head of IT, 140 people.", "Staff email me directly. It's not sustainable.", "Yes, my call.", "$1,200/month.", "We need this now, within a month."] },
  { id: 27, name: 'Isabelle Martin', company: 'ParisTech',               replies: ["VP of Operations, 360 employees.", "Ticket resolution is slow and unpredictable.", "I decide.", "$2,800/month.", "Looking at the next 3–4 weeks."] },
  { id: 28, name: 'Chen Wei',        company: 'ShanghaiOps',             replies: ["COO, 480 employees.", "Our helpdesk is completely manual. We need automation.", "Yes, my call.", "$3,500/month.", "This month if possible."] },
  { id: 29, name: 'Grace Abara',     company: 'AfriTech SaaS',           replies: ["Head of Ops, 110 employees.", "We're small but growing fast. Support requests are increasing.", "My decision.", "$900/month.", "We'd like something in 2–3 weeks."] },
  { id: 30, name: 'Ethan Brooks',    company: 'PinnacleSaaS',            replies: ["VP Ops, 280 employees.", "We're losing track of tickets daily. SLAs are a joke.", "My call.", "$2,200/month.", "Next 2–4 weeks."] },
  { id: 31, name: 'Leila Ahmadi',    company: 'TehranTech',              replies: ["CTO, 320 people.", "Dev team shouldn't be handling IT requests but they are.", "Yes, I decide.", "$2,500/month.", "We're ready to move this month."] },
  { id: 32, name: 'Santiago Mora',   company: 'AndeanOps',               replies: ["COO, 260 employees.", "Every department has its own way of filing requests. Chaos.", "My decision.", "$2,000/month.", "Looking at the next 30 days."] },
  { id: 33, name: 'Anna Kowalski',   company: 'WarsawScale',             replies: ["Head of IT, 190 people.", "We have a basic ticketing system but it doesn't integrate with anything.", "I own this.", "$1,600/month.", "We want to move this quarter."] },
  { id: 34, name: 'Tariq Hassan',    company: 'GulfStream Fintech',      replies: ["COO, 440 people.", "Compliance tickets and IT tickets are mixed. Very risky.", "Yes, fully mine.", "$3,200/month.", "Next 2–3 weeks."] },
  { id: 35, name: 'Mei Lin',         company: 'SingaporeOps',            replies: ["VP Operations, 390 employees.", "Manual triage is eating up my team's time.", "My call.", "$3,000/month.", "End of this month."] },

  // MEDIUM FIT (vague authority / budget / timeline) — 30 personas
  { id: 36, name: 'Daniel Park',     company: 'Stackbase Inc',           replies: ["I work in IT operations, we have about 95 people.", "Yeah tickets are kind of slow to get resolved.", "I'd need to talk to my manager before committing.", "Not sure on budget, probably a few thousand.", "Sometime this year I guess."] },
  { id: 37, name: 'Lucy Harrington', company: 'Acme SaaS',               replies: ["I'm an ops manager at a 130-person company.", "It takes forever to get anything done internally.", "My director would need to approve it.", "We haven't discussed budget for this specifically.", "Probably Q3 or Q4."] },
  { id: 38, name: 'Raj Kumar',       company: 'Brightfield Tech',        replies: ["I'm in charge of IT, company's about 160 employees.", "Things get lost but it's not a crisis yet.", "It would go through my VP.", "Maybe $1,500 but I'm not certain.", "We're not in a rush, maybe mid-year."] },
  { id: 39, name: 'Hannah Schmidt',  company: 'BerlinTech',              replies: ["Operations coordinator, 200 employees.", "We have delays but management isn't super focused on it yet.", "I'd escalate to the COO.", "I really don't know what budget is available.", "Exploring options, no firm date."] },
  { id: 40, name: 'Jake Morrison',   company: 'CoastalOps',              replies: ["IT support lead, 115 people.", "Ticket backlog is growing but it's manageable.", "I'll need my boss to sign off.", "Depends on the pricing.", "Probably sometime this year."] },
  { id: 41, name: 'Amina Toure',     company: 'SahelSaaS',               replies: ["I handle internal operations for a 175-person company.", "Things are okay but there's definitely room to improve.", "The COO would make the call.", "Budget TBD honestly.", "We're just exploring right now."] },
  { id: 42, name: 'Victor Petrov',   company: 'EastBlock Systems',       replies: ["IT manager, 220 employees.", "Tickets take too long but we're coping.", "My VP of IT is the decision maker.", "I think we have around $1,500–2k but I'd need to confirm.", "No specific timeline yet."] },
  { id: 43, name: 'Claire Bouchard', company: 'MontrealOps',             replies: ["Ops coordinator, 105 people.", "We're not structured at all but leadership hasn't prioritized it.", "I'd need approval from above.", "Not sure what we can spend.", "Sometime this year."] },
  { id: 44, name: 'Mohammed Ali',    company: 'CairoTech',               replies: ["IT team lead, 185 employees.", "There are issues but we're managing.", "The CTO makes these decisions.", "Budget around $1,500, maybe.", "We're not in a rush."] },
  { id: 45, name: 'Petra Novak',     company: 'PragueTech',              replies: ["Operations, 150 people.", "Requests are slow but not alarming.", "I'd need to loop in my manager.", "Unknown budget right now.", "Maybe Q3."] },
  { id: 46, name: 'Sam Liu',         company: 'TaipeiSaaS',              replies: ["IT operations, 130 employees.", "Some friction but we're getting by.", "My director would decide.", "I'd guess around $1k–1,500.", "We're in planning mode."] },
  { id: 47, name: 'Rachel Kim',      company: 'SeoulCloud',              replies: ["Ops manager, 145 people.", "Internally it's a bit chaotic but not critical.", "VP Ops would approve.", "Budget unclear.", "Not urgent."] },
  { id: 48, name: 'Ali Hassan',      company: 'DubaiOps',                replies: ["IT lead, 200 people.", "We have a backlog but the business isn't hurting from it yet.", "My CTO decides.", "$1,500/month maybe.", "End of year probably."] },
  { id: 49, name: 'Emma Walsh',      company: 'DublinTech',              replies: ["Internal IT, 120 employees.", "Tickets are slow to resolve.", "My manager would need to sign off.", "Budget not confirmed.", "Looking at options."] },
  { id: 50, name: 'Felix Wagner',    company: 'MunichOps',               replies: ["IT coordinator, 170 people.", "Things fall through the cracks occasionally.", "Head of IT decides.", "About $1,200 I think, but not sure.", "H2 this year."] },
  { id: 51, name: 'Chiara Bianchi',  company: 'MilanSaaS',               replies: ["Operations assistant, 135 people.", "We have delays but leadership hasn't acted on it.", "Would need sign-off from management.", "No budget allocated yet.", "Just exploring."] },
  { id: 52, name: 'Jorge Santos',    company: 'LisbonTech',              replies: ["IT support, 155 employees.", "There are inefficiencies.", "My manager decides.", "Probably $1,000–1,500.", "No timeline."] },
  { id: 53, name: 'Kate Murphy',     company: 'SydneyOps',               replies: ["Ops coordinator, 100 employees.", "Ticket resolution is slow.", "VP of Ops approves this.", "Budget TBD.", "Sometime this year."] },
  { id: 54, name: 'David Osei',      company: 'AccraCloud',              replies: ["IT manager, 125 employees.", "We get by but there's definitely room for improvement.", "CTO decides.", "$1,000/month maybe.", "No firm date."] },
  { id: 55, name: 'Anna Svensson',   company: 'StockholmSaaS',           replies: ["Internal ops, 180 employees.", "Things take longer than they should.", "My COO would sign off.", "Not sure on budget.", "Looking at next year perhaps."] },
  { id: 56, name: 'Chris Nakamura',  company: 'OsakaTech',               replies: ["IT operations lead, 165 employees.", "Moderate inefficiencies.", "My director makes decisions.", "Around $1,500 I think.", "Mid-year."] },
  { id: 57, name: 'Amelia Carter',   company: 'LondonOps',               replies: ["Operations, 140 people.", "We have issues but they're manageable.", "Head of IT approves.", "Budget unknown.", "Q3 or Q4."] },
  { id: 58, name: 'Max Richter',     company: 'ViennaScale',             replies: ["IT team, 190 employees.", "Some pain points but not critical.", "My VP decides.", "Maybe $1,200–1,500.", "No rush."] },
  { id: 59, name: 'Nia Mensah',      company: 'AbujaOps',                replies: ["Ops coordinator, 115 employees.", "Not super urgent but there are definitely delays.", "My COO signs off.", "Budget unclear.", "We're just exploring."] },
  { id: 60, name: 'Luca Ferrari',    company: 'RomeSaaS',                replies: ["IT lead, 200 employees.", "We have delays and it's slightly frustrating.", "My CTO decides.", "$1,800 maybe.", "Probably H2."] },
  { id: 61, name: 'Sana Malik',      company: 'KarachiTech',             replies: ["Internal IT, 145 people.", "Tickets aren't super organized.", "Manager decides.", "Not sure on budget.", "Not urgent."] },
  { id: 62, name: 'Diego Morales',   company: 'BogotaOps',               replies: ["IT operations, 160 employees.", "We lose track of requests occasionally.", "COO approves.", "Maybe $1,200.", "No timeline."] },
  { id: 63, name: 'Nora Fitzpatrick','company': 'BelfastCloud',           replies: ["Ops manager, 130 people.", "Things fall through cracks sometimes.", "My director would decide.", "Around $1,000 budget.", "Sometime this year."] },
  { id: 64, name: 'Riku Virtanen',   company: 'HelsinkiSaaS',            replies: ["IT, 170 employees.", "We have inefficiencies but leadership is slow to act.", "Head of IT decides.", "Budget TBD.", "Next year probably."] },
  { id: 65, name: 'Mei Huang',       company: 'ShenzhenTech',            replies: ["Operations lead, 110 employees.", "Moderate ticket delays.", "My COO would sign off.", "Maybe $900.", "Exploring options, no date."] },

  // LOW FIT (poor BANT, small team, no budget, no timeline) — 20 personas
  { id: 66, name: 'Josh Cooper',     company: 'TinyStartup',             replies: ["I run a 30-person startup.", "We just email each other for requests.", "It's just me making decisions.", "We can't spend much, maybe $200/month?", "We're not sure if we need this yet."] },
  { id: 67, name: 'Mia Reynolds',    company: 'FreelanceOps',            replies: ["We're a team of about 15 people.", "It's pretty informal, but that's fine for now.", "I handle it myself.", "Very limited budget.", "No plans to change anything soon."] },
  { id: 68, name: 'Leo Walker',      company: 'MicroConsult',            replies: ["About 25 employees.", "We're too small for a big system.", "It's my call.", "We can't afford much.", "No timeline."] },
  { id: 69, name: 'Sophie Grant',    company: 'LocalRetail',             replies: ["We sell to consumers directly, about 40 employees.", "We don't have an IT department.", "That'd be me I guess.", "Very tight budget.", "Not something we're focused on."] },
  { id: 70, name: 'Mike Torres',     company: 'SmallBiz Co',             replies: ["We're about 20 people.", "People just slack me when they need things.", "I decide everything.", "Maybe $100/month.", "Not right now."] },
  { id: 71, name: 'Ella James',      company: 'NanoSaaS',                replies: ["12-person team.", "Everything is pretty ad hoc.", "It's just me.", "No budget for software.", "Not in the cards."] },
  { id: 72, name: 'Sam Brown',       company: 'TinyCo',                  replies: ["We're like 18 people.", "We use email and that's fine.", "I'm the founder.", "Very limited budget.", "Not planning anything."] },
  { id: 73, name: 'Isabel Cruz',     company: 'MiniAgency',              replies: ["About 22 employees.", "It's informal, doesn't need a system.", "My partner and I decide.", "Maybe $150/month.", "No timeline."] },
  { id: 74, name: 'Alex Ward',       company: 'ZeroOps',                 replies: ["We're 8 people.", "We're too small for this.", "It's just me.", "Almost no budget.", "Not relevant to us."] },
  { id: 75, name: 'Lily Scott',      company: 'SparkConsult',            replies: ["25-person team.", "We're figuring out if we even need a tool.", "I'd decide.", "Very low budget.", "No urgency at all."] },
  { id: 76, name: 'Owen Hughes',     company: 'PebbleSaaS',              replies: ["We have maybe 35 people.", "Pretty informal ops.", "That's me.", "Can't spend more than $200.", "Not this year."] },
  { id: 77, name: 'Grace Kelly',     company: 'WeeConsult',              replies: ["A 16-person consultancy.", "It works for now.", "I make all calls.", "Low budget.", "No plans."] },
  { id: 78, name: 'Ryan Stone',      company: 'PocketBiz',               replies: ["20 employees.", "We just manage on Slack.", "Yes, it's my decision.", "Maybe $100–150.", "Not anytime soon."] },
  { id: 79, name: 'Chloe Evans',     company: 'MicroShip',               replies: ["We're 28 people.", "Things work but slowly.", "I'd decide.", "Very little budget.", "No timeline."] },
  { id: 80, name: 'Tom Bailey',      company: 'TinyFreight',             replies: ["About 32 employees.", "We have some issues but it's fine.", "I make the call.", "Very limited.", "Not planning."] },
  { id: 81, name: 'Ava Clark',       company: 'SmallScale',              replies: ["We're 14 people.", "We don't really have IT issues per se.", "It's me.", "No budget for this.", "Not now."] },
  { id: 82, name: 'Noah Lewis',      company: 'NanoFreight',             replies: ["About 19 people.", "We email internally.", "My decision.", "Maybe $100.", "No urgency."] },
  { id: 83, name: 'Mia Harris',      company: 'GrainSaaS',               replies: ["A 23-person team.", "We're doing okay.", "I'm the founder.", "Limited budget.", "Not right now."] },
  { id: 84, name: 'Jack Young',      company: 'DropletOps',              replies: ["We have 27 employees.", "Very informal process.", "I decide.", "Very low budget.", "Not a priority."] },
  { id: 85, name: 'Ella Wright',     company: 'SeedStage',               replies: ["About 11 people.", "Too small for this I think.", "It's me.", "No budget.", "Not relevant."] },

  // DISQUALIFIED — 15 personas
  { id: 86,  name: 'Robert Chambers',  company: 'Dept of Education',     replies: ["We're a government agency, about 500 employees.", "We have lots of IT requests.", "I'm the IT director.", "$5,000/month budget.", "We need something soon."] },
  { id: 87,  name: 'Patricia Moore',   company: 'City Hall IT',          replies: ["Municipal government, around 300 staff.", "Very high ticket volume.", "I make IT decisions.", "We have budget available.", "Looking at Q2."] },
  { id: 88,  name: 'Kevin Hart',       company: 'State Revenue Service', replies: ["Government IT department, 800 employees.", "Massive backlog of requests.", "Director of IT.", "Budget approved.", "We need this ASAP."] },
  { id: 89,  name: 'Linda Ross',       company: 'County Health Dept',    replies: ["Public sector, 400 employees.", "Huge IT pain point.", "I'm the decision maker.", "Budget available.", "This quarter."] },
  { id: 90,  name: 'Steve Allen',      company: 'Federal Agency',        replies: ["Government, around 1,000 people.", "Critical IT challenges.", "I'm the CIO.", "Large budget.", "Immediately."] },
  { id: 91,  name: 'Nancy Young',      company: 'ShopFast (B2C)',        replies: ["We're a consumer e-commerce company, 200 employees.", "Our customer support needs help.", "I'm the COO.", "$2,000/month.", "Ready now."] },
  { id: 92,  name: 'Mark Davis',       company: 'FashionDirect',         replies: ["B2C fashion retailer, about 350 employees.", "Customer tickets are piling up.", "Yes, my decision.", "Budget available.", "This month."] },
  { id: 93,  name: 'Susan White',      company: 'HomeGoods Online',      replies: ["Consumer goods company, 150 people.", "We sell directly to customers.", "COO.", "$1,800/month.", "Soon."] },
  { id: 94,  name: 'Paul Wilson',      company: 'B2C Marketplace',       replies: ["We're a consumer marketplace, 250 employees.", "Customer service is overwhelmed.", "I'm the Head of Ops.", "$2,200/month.", "Ready now."] },
  { id: 95,  name: 'Betty Taylor',     company: 'DirectToConsumer Co',   replies: ["B2C, around 180 people.", "Customer-facing tickets are the main issue.", "Yes, I decide.", "Budget available.", "This quarter."] },
  { id: 96,  name: 'George Martinez',  company: 'EnterpriseZen',         replies: ["We use Zendesk Suite enterprise for about 2,000 employees.", "We're looking for additional tools.", "I'm the VP of IT.", "Budget available.", "Now."] },
  { id: 97,  name: 'Sandra Jackson',   company: 'ServiceNow Enterprise', replies: ["We're a 3,000-person company on ServiceNow enterprise.", "Fully implemented.", "IT Director.", "Large budget.", "Exploring options."] },
  { id: 98,  name: 'Donald Thompson',  company: 'ZenEnterprise Corp',    replies: ["On Zendesk enterprise, 1,500 employees.", "Very happy with our current setup.", "CTO.", "Budget available.", "Just exploring."] },
  { id: 99,  name: 'Carol Garcia',     company: 'ServiceNow Global',     replies: ["ServiceNow enterprise implementation, 2,500 employees.", "Fully configured.", "Head of IT.", "Large budget.", "Looking for enhancements."] },
  { id: 100, name: 'Kenneth Robinson', company: 'ZenGlobal Solutions',   replies: ["Zendesk enterprise, 4,000 employees.", "Comprehensive setup.", "VP IT.", "Budget available.", "Exploring options."] },
];

// ─── Groq API helpers ─────────────────────────────────────────────────────────

async function fetchCompletion(messages, retries = 3) {
  await sleep(BETWEEN_CALL_DELAY);
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
  });

  if (response.status === 429) {
    if (retries > 0) {
      const wait = RETRY_DELAY * (4 - retries); // back-off: 8s, 16s, 24s
      process.stdout.write(`    [429] Rate limited — waiting ${wait/1000}s...\n`);
      await sleep(wait);
      return fetchCompletion(messages, retries - 1);
    }
    throw new Error('Rate limit exceeded after retries');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── JSON extraction (mirrors parseResponse.ts) ───────────────────────────────

const VALID_SCORES = [0, 5, 15, 25];

function clamp(val) {
  if (typeof val !== 'number') return 0;
  return VALID_SCORES.includes(val) ? val : 0;
}

function extractResult(raw) {
  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed.done !== true) return null;
    return {
      budget_score: clamp(parsed.budget_score),
      authority_score: clamp(parsed.authority_score),
      need_score: clamp(parsed.need_score),
      timeline_score: clamp(parsed.timeline_score),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      disqualified: parsed.disqualified === true,
      disqualify_reason: typeof parsed.disqualify_reason === 'string' ? parsed.disqualify_reason : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Run one persona through a full conversation ──────────────────────────────

async function runPersona(persona) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Get Aria's opener
  const opener = await fetchCompletion(messages);
  messages.push({ role: 'assistant', content: opener });

  let finalResult = null;
  let turnCount = 0;

  for (const reply of persona.replies) {
    messages.push({ role: 'user', content: reply });
    turnCount++;

    if (turnCount >= 10) {
      messages.push({ role: 'system', content: FORCE_JSON });
    }

    const response = await fetchCompletion(messages);
    const parsed = extractResult(response);

    if (parsed) {
      finalResult = parsed;
      break;
    }

    messages.push({ role: 'assistant', content: response });
  }

  // If we exhausted replies without a JSON, force it
  if (!finalResult) {
    messages.push({ role: 'system', content: FORCE_JSON });
    const forced = await fetchCompletion(messages);
    finalResult = extractResult(forced);
  }

  if (!finalResult) {
    console.warn(`  ⚠️  [${persona.id}] ${persona.name} — could not extract JSON, skipping`);
    return null;
  }

  const total = finalResult.budget_score + finalResult.authority_score + finalResult.need_score + finalResult.timeline_score;
  const tier = total >= 70 ? 'high' : total >= 40 ? 'medium' : 'low';

  return {
    id: persona.id,
    name: persona.name,
    company: persona.company,
    budget: finalResult.budget_score,
    authority: finalResult.authority_score,
    need: finalResult.need_score,
    timeline: finalResult.timeline_score,
    total,
    tier,
    disqualified: finalResult.disqualified,
    disqualify_reason: finalResult.disqualify_reason,
    summary: finalResult.summary,
  };
}

// ─── Run all personas in batches ──────────────────────────────────────────────

async function runBatch(batch) {
  const results = [];
  for (const persona of batch) {
    try {
      process.stdout.write(`  Running [${persona.id}/100] ${persona.name}...\n`);
      const result = await runPersona(persona);
      if (result) process.stdout.write(`  ✓ [${persona.id}] ${persona.name} → ${result.disqualified ? 'DISQ' : result.tier.toUpperCase()} (${result.total})\n`);
      results.push(result);
    } catch (err) {
      console.error(`  ✗ [${persona.id}] ${persona.name} — ${err.message}`);
      results.push(null);
    }
    // Small cooldown between personas
    await sleep(1500);
  }
  return results;
}

async function main() {
  console.log(`\n🚀 FlowDesk Simulation — 100 Prospects via Groq API\n`);

  const allResults = [];
  for (let i = 0; i < PERSONAS.length; i += CONCURRENT) {
    const batch = PERSONAS.slice(i, i + CONCURRENT);
    console.log(`\nBatch ${Math.floor(i / CONCURRENT) + 1}/${Math.ceil(PERSONAS.length / CONCURRENT)}...`);
    const results = await runBatch(batch);
    allResults.push(...results.filter(Boolean));
    // Pause between batches to avoid sustained rate limits
    if (i + CONCURRENT < PERSONAS.length) await sleep(2000);
  }

  const outPath = path.join(ROOT, 'src', 'data', 'simulationResults.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));

  const high = allResults.filter(r => !r.disqualified && r.tier === 'high').length;
  const medium = allResults.filter(r => !r.disqualified && r.tier === 'medium').length;
  const low = allResults.filter(r => !r.disqualified && r.tier === 'low').length;
  const disq = allResults.filter(r => r.disqualified).length;

  console.log(`\n✅ Done! ${allResults.length} results saved to src/data/simulationResults.json`);
  console.log(`   High: ${high}  Medium: ${medium}  Low: ${low}  Disqualified: ${disq}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
