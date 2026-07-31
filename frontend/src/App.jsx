/*
  DIRECTION CONTRACT — ReviewIQ Editorial Intelligence (seed 8d9a0656)
  THESIS: ReviewIQ as an intelligence brief — editorial authority, not SaaS dashboard.
    Refuses the metric-tiles + sidebar + gradient-header the category always ships.
  OWN-WORLD: Paper-white (#F5F6F8) ground, pure-white cards, single accent electric
    ink-blue (#0047FF light / #4D7FFF dark). Barlow Condensed 900 for display numbers
    and section headers. Libre Franklin for all body and UI. 1px column rules as structure.
    No gradients anywhere. No purple. No dark heavy colors in light mode.
  STORY: Search → editorial intelligence brief. #1 issue is the lead story. Numbers
    count up. Charts draw on scroll. Cards reveal staggered.
  FIRST VIEWPORT: Masthead + dark-mode toggle → giant condensed headline → editorial
    search bar (bottom-border only, ink-blue Analyze pill) → feature flags in small caps.
  FORM: Editorial Intelligence — candidate #3 of 7 grounded directions. Seed 8d9a0656.
  FINISH: Unreviewed and undocumented is unfinished; ends with finish review + DESIGN.md.
*/

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from "recharts";

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DEMO_DATA = {
  business: {
    name: "The Golden Fork",
    address: "123 Main St, Austin, TX",
    rating: 3.8,
    total_reviews: 247,
    category: "Restaurant",
    phone: "(512) 555-0147",
    website: "thegoldenfork.com",
  },
  analysis: {
    overall_sentiment: 0.61,
    summary: "The Golden Fork shows strong food quality but faces consistent service challenges. Staff behaviour and wait times are the most frequently cited pain points, appearing in 38% of negative reviews.",
    issues: [
      { id: "rude_staff", title: "Staff Rudeness", description: "Multiple reviewers describe dismissive, forgetful, or rude waitstaff — particularly one described as 'tall with a beard'.", frequency: 6, severity: "critical", priority_rank: 1, category: "service", example_quote: "The waiter was incredibly rude and dismissive. Took 45 minutes to get our food and it arrived cold.", solution: "Implement a mandatory weekly customer-service training. Create anonymous review cards at each table so issues surface before they become public. Consider a staff recognition programme tied to review mentions." },
      { id: "wait_times", title: "Long Wait Times", description: "Customers report excessive wait times both for seating (even with reservations) and food delivery.", frequency: 5, severity: "high", priority_rank: 2, category: "wait_time", example_quote: "Waited over an hour for a table with a reservation.", solution: "Audit your reservation system for double-booking bugs. Set kitchen time targets per dish and track them. Add a 'running late' text notification for reservation holders." },
      { id: "food_temp", title: "Food Arriving Cold", description: "A recurring issue across multiple reviews — food is prepared but not served promptly.", frequency: 4, severity: "high", priority_rank: 3, category: "food", example_quote: "Took 45 minutes to get our food and it arrived cold.", solution: "Install heat lamps at the pass. Implement a maximum 3-minute expedite rule from kitchen pass to table. Track cold-food complaints per shift to identify patterns." },
      { id: "parking", title: "Parking Difficulties", description: "Customers note that parking near the location is limited and stressful.", frequency: 3, severity: "medium", priority_rank: 4, category: "other", example_quote: "Parking is a nightmare. Used to love this place.", solution: "Partner with the lot on Oak Ave for validated parking. Add a parking info card to the reservation confirmation email with the nearest alternatives." },
    ],
    positives: [
      { title: "Food Quality & Taste", frequency: 8, example_quote: "The risotto was perfectly creamy. Best Italian in Austin by far." },
      { title: "Romantic Ambiance", frequency: 5, example_quote: "Perfect date night spot! Romantic lighting, amazing food." },
      { title: "Exceptional Staff (specific)", frequency: 3, example_quote: "Our server Maria was exceptional." },
      { title: "Dessert Menu", frequency: 4, example_quote: "The tiramisu is a must. The seafood pasta changed my life." },
    ],
    keywords: {
      negative: [
        { word: "waiter", count: 8 }, { word: "cold", count: 6 }, { word: "wait", count: 7 },
        { word: "rude", count: 5 }, { word: "parking", count: 4 }, { word: "slow", count: 5 },
        { word: "disappointed", count: 3 }, { word: "forgotten", count: 3 },
      ],
      positive: [
        { word: "amazing", count: 9 }, { word: "pasta", count: 7 }, { word: "romantic", count: 5 },
        { word: "delicious", count: 8 }, { word: "ambiance", count: 6 }, { word: "fresh", count: 5 },
        { word: "friendly", count: 4 }, { word: "recommend", count: 6 },
      ],
    },
    quick_wins: [
      "Reply to all 1–2 star reviews within 24 hours offering a complimentary return visit",
      "Post a public response acknowledging wait time issues and what's being done",
      "Feature 'server Maria' as an example of the experience you aim to deliver",
    ],
    marketing_advice: "Your food quality scores are genuinely strong — customers consistently describe it as the best Italian in Austin. Lead your social media and Google Business posts with food photography and chef spotlights. Run a campaign around your top-rated dishes (risotto, tiramisu, seafood pasta) with the tagline 'Worth the Trip.'",
    alert: { triggered: true, reason: "Rude waiter mentioned in 4 reviews in the past 2 weeks — immediate staff review recommended.", urgency: "high" },
  },
  trends: {
    "2025-01": { avg_rating: 3.5, review_count: 18, sentiment: 0.52 },
    "2025-02": { avg_rating: 3.6, review_count: 15, sentiment: 0.54 },
    "2025-03": { avg_rating: 3.4, review_count: 22, sentiment: 0.49 },
    "2025-04": { avg_rating: 3.7, review_count: 20, sentiment: 0.57 },
    "2025-05": { avg_rating: 3.5, review_count: 25, sentiment: 0.51 },
    "2025-06": { avg_rating: 3.9, review_count: 28, sentiment: 0.63 },
    "2025-07": { avg_rating: 4.1, review_count: 19, sentiment: 0.71 },
  },
  competitors: [
    { name: "Bella Italia", rating: 4.3, total_reviews: 312, avg_sentiment: 0.72, outperforms_you: true, rating_gap: 0.5, top_praise: ["consistent","fast","parking"], top_complaints: ["pricey"], recent_rating: 4.4, sample_positive: "Always consistent. Best carbonara in the city.", sample_negative: "A bit pricey for the portions." },
    { name: "Casa Romana", rating: 4.0, total_reviews: 198, avg_sentiment: 0.61, outperforms_you: true, rating_gap: 0.2, top_praise: ["ambiance","wine"], top_complaints: ["slow"], recent_rating: 3.9, sample_positive: "Great wine list, lovely ambiance.", sample_negative: "Service can be slow on weekends." },
    { name: "Trattoria Mia", rating: 3.6, total_reviews: 143, avg_sentiment: 0.48, outperforms_you: false, rating_gap: -0.2, top_praise: ["affordable","portions"], top_complaints: ["noisy","bland"], recent_rating: 3.5, sample_positive: "Large portions and good value.", sample_negative: "A bit bland and very noisy." },
  ],
  reviews: [
    { id: "r1", author: "Sarah M.", rating: 2, date: "2025-07-01", month: "2025-07", text: "The waiter was incredibly rude and dismissive. Took 45 minutes to get our food and it arrived cold. The pasta was overcooked and bland. Will not be returning." },
    { id: "r2", author: "James K.", rating: 5, date: "2025-07-03", month: "2025-07", text: "Absolutely fantastic! The risotto was perfectly creamy and the service was attentive without being overbearing. Best Italian in Austin by far." },
    { id: "r3", author: "Priya L.", rating: 1, date: "2025-06-28", month: "2025-06", text: "Waited over an hour for a table with a reservation. The waiter kept forgetting our orders. Steak was raw when I ordered medium. Disaster." },
    { id: "r4", author: "Emma S.", rating: 5, date: "2025-05-30", month: "2025-05", text: "Perfect date night spot! Romantic lighting, amazing food, and our server Maria was exceptional. The seafood pasta changed my life." },
    { id: "r5", author: "Carl T.", rating: 2, date: "2025-05-10", month: "2025-05", text: "Cold food, long waits, rude staff. The manager was helpful when we complained but the damage was done. The only saving grace was the dessert." },
    { id: "r6", author: "Lin W.", rating: 3, date: "2025-04-22", month: "2025-04", text: "Decent food but the wait time was unreasonable. Took over 30 minutes just for bread. Service needs serious improvement." },
    { id: "r7", author: "Mark T.", rating: 4, date: "2025-03-15", month: "2025-03", text: "Great tiramisu and lovely atmosphere. Service was a little slow but the food made up for it." },
  ],
};

async function fetchWithFallback(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      let detail = body.detail;
      if (Array.isArray(detail)) detail = detail.map(e => `${e.loc?.join(".")}: ${e.msg}`).join("; ");
      throw new Error(detail || `Server error (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error("Cannot reach the backend. Make sure python main.py is running on port 8000.");
    }
    throw err;
  }
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
:root {
  --bg: #F5F6F8;
  --surface: #FFFFFF;
  --border: #E4E7EC;
  --text: #0D1117;
  --text-sub: #4B5563;
  --text-mute: #9CA3AF;
  --accent: #0047FF;
  --accent-lt: #EBF0FF;
  --accent-md: #BFCFFF;
  --danger: #DC2626;
  --danger-lt: #FEF2F2;
  --danger-md: #FECACA;
  --warn: #D97706;
  --warn-lt: #FFFBEB;
  --warn-md: #FDE68A;
  --success: #059669;
  --success-lt: #ECFDF5;
  --success-md: #A7F3D0;
  --muted: #F3F4F6;
  --font-display: 'Barlow Condensed', system-ui, sans-serif;
  --font-body: 'Libre Franklin', system-ui, sans-serif;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
  --radius: 12px;
  --radius-sm: 8px;
}
[data-theme="dark"] {
  --bg: #0C0C0E;
  --surface: #141416;
  --border: #252528;
  --text: #EDEDED;
  --text-sub: #9CA3AF;
  --text-mute: #6B7280;
  --accent: #4D7FFF;
  --accent-lt: #141D3A;
  --accent-md: #1E2E60;
  --danger: #F87171;
  --danger-lt: #1A0808;
  --danger-md: #2D1212;
  --warn: #FBBF24;
  --warn-lt: #1A1200;
  --warn-md: #2E2100;
  --success: #34D399;
  --success-lt: #04140B;
  --success-md: #092416;
  --muted: #1A1A1C;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
}
*, *::before, *::after { box-sizing: border-box; }
html { font-family: var(--font-body); color: var(--text); -webkit-font-smoothing: antialiased; }
body { margin: 0; background: var(--bg); transition: background-color 0.22s ease; }

/* Smooth theme transitions on key surfaces */
nav, header, .iq-surface {
  transition: background-color 0.22s ease, border-color 0.22s ease;
}

/* Scroll reveal */
.reveal {
  opacity: 0; transform: translateY(22px);
  transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
}
.reveal.visible { opacity: 1; transform: none; }
.reveal-left {
  opacity: 0; transform: translateX(-18px);
  transition: opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1);
}
.reveal-left.visible { opacity: 1; transform: none; }
.reveal-scale {
  opacity: 0; transform: scale(0.95);
  transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.reveal-scale.visible { opacity: 1; transform: none; }
.s0 { transition-delay: 0ms !important; }
.s1 { transition-delay: 65ms !important; }
.s2 { transition-delay: 130ms !important; }
.s3 { transition-delay: 195ms !important; }
.s4 { transition-delay: 260ms !important; }
.s5 { transition-delay: 325ms !important; }

/* Keyframes */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: none; }
}
@keyframes slideUpFast {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
@keyframes stampIn {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes tabEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0%, 100% { opacity: 0.45; transform: scale(0.82); }
  50%       { opacity: 1;    transform: scale(1);    }
}
@keyframes expandWidth {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
@keyframes alertSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: none; }
}

/* Interactive element transitions */
.iq-card {
  transition: box-shadow 0.18s cubic-bezier(0.16,1,0.3,1),
              transform 0.18s cubic-bezier(0.16,1,0.3,1);
}
.iq-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.comp-card {
  transition: box-shadow 0.18s cubic-bezier(0.16,1,0.3,1),
              transform 0.18s cubic-bezier(0.16,1,0.3,1);
}
.comp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }

.review-card {
  transition: box-shadow 0.18s cubic-bezier(0.16,1,0.3,1),
              transform 0.18s cubic-bezier(0.16,1,0.3,1);
}
.review-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.issue-row { transition: background 0.1s ease; cursor: pointer; }
.issue-row:hover { background: var(--muted) !important; }

.iq-btn-primary {
  transition: filter 0.15s ease, transform 0.1s ease;
  cursor: pointer;
}
.iq-btn-primary:hover  { filter: brightness(1.1); }
.iq-btn-primary:active { transform: scale(0.97); }

.iq-btn-ghost {
  transition: background 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}
.iq-btn-ghost:hover { background: var(--muted) !important; }

.tab-btn {
  border: none; background: transparent;
  transition: color 0.15s ease;
  cursor: pointer;
}
.tab-btn:hover { color: var(--text) !important; }

.chip {
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  cursor: default;
}
.chip:hover {
  background: var(--accent-lt) !important;
  border-color: var(--accent-md) !important;
  transform: translateY(-1px);
}

.theme-btn {
  transition: background 0.15s ease;
  cursor: pointer;
}
.theme-btn:hover { background: var(--muted) !important; }

.iq-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--font-body);
}
.iq-input::placeholder { color: var(--text-mute); }

/* Landing-specific search input */
.landing-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--font-body);
  font-size: 17px; flex: 1; padding: 16px 14px;
}
.landing-input::placeholder { color: var(--text-mute); }

/* Dashboard search input */
.dash-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--font-body);
  font-size: 13px;
}
.dash-input::placeholder { color: var(--text-mute); }
.dash-input:focus { outline: none; }

/* Code tags */
code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-left, .reveal-scale, .iq-card, .comp-card,
  .review-card, .issue-row, .chip, .iq-btn-primary {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("iq-theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("iq-theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return [dark, () => setDark(d => !d)];
}

function useScrollReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
        },
        { threshold: 0.06, rootMargin: "0px 0px -28px 0px" }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ref;
}

function useCountUp(target, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEV_COLOR  = { critical: "var(--danger)", high: "#EA580C", medium: "var(--warn)", low: "var(--success)" };
const SEV_BG     = { critical: "var(--danger-lt)", high: "#FFF7ED", medium: "var(--warn-lt)", low: "var(--success-lt)" };
const SEV_BORDER = { critical: "var(--danger-md)", high: "#FED7AA", medium: "var(--warn-md)", low: "var(--success-md)" };
const SEV_LABEL  = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const ratingColor = r => r >= 4 ? "var(--success)" : r >= 3 ? "var(--warn)" : "var(--danger)";

// ─── Utility functions ────────────────────────────────────────────────────────

function getAllMonthsBetween(start, end) {
  const months = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) { m = 1; y++; }
  }
  return months;
}

function formatMonthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[m - 1]} '${String(y).slice(-2)}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  chart: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity=".5"/><rect x="6" y="4" width="3" height="11" rx="1" fill="currentColor" opacity=".75"/><rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/></svg>,
  alert: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L14 13H1L7.5 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="7.5" y1="6" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7.5" cy="11.2" r=".7" fill="currentColor"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9 3.5 11.4l1.3-4L1.5 5h4z"/></svg>,
  trend: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><polyline points="1,12 5,7 8,9 14,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="10,3 14,3 14,7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13 13c0-2-1.3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 14l2-3h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  report: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  home: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7L7 2l6 5v5a1 1 0 01-1 1H9v-3H5v3H2a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="2,7 5,10 11,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.1" y2="11.9"/><line x1="11.9" y1="4.1" x2="12.95" y2="3.05"/></svg>,
  moon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13 9.5A6.5 6.5 0 015.5 2a6.5 6.5 0 100 11 6.5 6.5 0 007.5-3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  gear: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/></svg>,
  copy: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 4V2.5A1.5 1.5 0 007.5 1h-5A1.5 1.5 0 001 2.5v5A1.5 1.5 0 002.5 9H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  bolt: <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M7.5 1L3 7.5h4.5L5.5 12l7-6.5H9z"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ─── Small components ─────────────────────────────────────────────────────────

function Reveal({ children, className = "reveal", stagger = 0 }) {
  const ref = useScrollReveal(stagger * 40);
  return (
    <div ref={ref} className={`${className} s${Math.min(stagger, 5)}`}>
      {children}
    </div>
  );
}

function Stars({ rating, size = "sm" }) {
  const sz = size === "lg" ? 18 : 13;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? "#F59E0B" : "var(--border)", fontSize: sz, lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function SentimentBadge({ value }) {
  const pct = Math.round(value * 100);
  const color  = pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warn)" : "var(--danger)";
  const bg     = pct >= 70 ? "var(--success-lt)" : pct >= 50 ? "var(--warn-lt)" : "var(--danger-lt)";
  const border = pct >= 70 ? "var(--success-md)" : pct >= 50 ? "var(--warn-md)" : "var(--danger-md)";
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
      {pct}% positive
    </span>
  );
}

function SectionFlag({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-mute)",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function MetricTile({ label, value, format = "number", sub, accent = false, danger = false, warn = false, success = false }) {
  const numVal = typeof value === "number" ? value : parseFloat(value) || 0;
  const counted = useCountUp(format === "decimal" ? Math.round(numVal * 10) : Math.round(numVal));
  const display = format === "pct"     ? `${counted}%`
                : format === "decimal" ? (counted / 10).toFixed(1)
                : counted.toLocaleString();
  const accentColor = danger ? "var(--danger)" : warn ? "var(--warn)" : success ? "var(--success)" : accent ? "var(--accent)" : "var(--text)";
  const leftBorder  = danger ? "var(--danger)" : warn ? "var(--warn)" : success ? "var(--success)" : accent ? "var(--accent)" : "var(--border)";
  const highlighted = accent || danger || warn || success;
  return (
    <div className="iq-card" style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: highlighted ? `3px solid ${leftBorder}` : "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px 22px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 44,
        color: accentColor, lineHeight: 1, letterSpacing: "-0.5px",
      }}>
        {display}
      </div>
      <div style={{
        fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
        color: "var(--text-sub)", marginTop: 7, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewIQ() {
  const [dark, toggleDark] = useDarkMode();

  // State
  const [query, setQuery]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [loadingStage, setLoadingStage]     = useState("");
  const [activeTab, setActiveTab]           = useState("overview");
  const [data, setData]                     = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyPersonality, setReplyPersonality] = useState("professional");
  const [replyText, setReplyText]           = useState("");
  const [replyLoading, setReplyLoading]     = useState(false);
  const [weeklyReport, setWeeklyReport]     = useState("");
  const [reportLoading, setReportLoading]   = useState(false);
  const [expandedIssue, setExpandedIssue]   = useState(null);
  const [error, setError]                   = useState(null);
  const [replyError, setReplyError]         = useState(null);
  const [showKeyPanel, setShowKeyPanel]     = useState(false);
  const [keyStatus, setKeyStatus]           = useState(null);
  const [keyReloading, setKeyReloading]     = useState(false);
  const [copied, setCopied]                 = useState(false);

  // Tab indicator ref system
  const tabBarRef  = useRef(null);
  const tabBtnRefs = useRef({});
  const [tabInd, setTabInd] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const btn = tabBtnRefs.current[activeTab];
    const bar = tabBarRef.current;
    if (btn && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setTabInd({ left: btnRect.left - barRect.left, width: btnRect.width });
    }
  }, [activeTab, data]);

  // Font injection
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // Callbacks
  const runSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    setActiveTab("overview");
    setWeeklyReport("");
    try {
      setLoadingStage("Searching for business…");
      let business, reviews, trends;
      try {
        const bizResult = await fetchWithFallback(`/api/reviews/search?q=${encodeURIComponent(searchQuery)}`);
        business = bizResult?.data ?? { name: searchQuery.trim(), address: "", rating: null, total_reviews: 0, category: "Business", phone: "", website: "" };
        reviews  = bizResult?.data?.reviews || [];
        trends   = bizResult?.data?.monthly_trends || {};
      } catch {
        const d = DEMO_DATA;
        business = d.business; reviews = d.reviews; trends = d.trends;
      }

      setLoadingStage("Running AI analysis…");
      let analysis;
      try {
        const ar = await fetchWithFallback("/api/analysis/analyze", {
          method: "POST",
          body: JSON.stringify({ business_name: business.name, reviews, category: business.category || "Business" }),
        });
        if (!ar?.data) throw new Error("no data");
        analysis = ar.data;
      } catch {
        analysis = DEMO_DATA.analysis;
      }

      setLoadingStage("Loading competitor data…");
      let competitors = [];
      let competitorError = null;
      try {
        const cr = await fetchWithFallback(`/api/competitors/compare?business=${encodeURIComponent(business.name || "")}&address=${encodeURIComponent(business.address || "")}`);
        competitors = cr?.data?.competitors || [];
      } catch (err) {
        competitorError = err.message;
        competitors = DEMO_DATA.competitors;
      }

      setData({ business, reviews, analysis, trends, competitors, competitorError });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }, []);

  const generateReply = async (review, personality) => {
    setReplyLoading(true);
    setReplyText("");
    setReplyError(null);
    try {
      const result = await fetchWithFallback("/api/replies/generate", {
        method: "POST",
        body: JSON.stringify({
          review_text: review.text || "",
          rating: typeof review.rating === "number" ? review.rating : 3,
          business_name: data.business.name || "this business",
          personality,
        }),
      });
      if (result?.data?.reply) setReplyText(result.data.reply);
      else throw new Error("No reply returned.");
    } catch (err) {
      setReplyError(err.message || "Failed to generate reply.");
    }
    setReplyLoading(false);
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const result = await fetchWithFallback("/api/analysis/report", {
        method: "POST",
        body: JSON.stringify({ business_name: data.business.name, analysis: data.analysis, trends: data.trends }),
      });
      setWeeklyReport(result?.data?.report || `Weekly Insight Report — ${data.business.name}\n\nYour sentiment score is ${Math.round(data.analysis.overall_sentiment * 100)}% this week. Your top opportunity remains addressing service consistency.\n\nThis week, prioritise: responding to all negative reviews within 24 hours, conducting a staff briefing on the top complaints, and promoting your strongest dishes on social media.\n\nThe trend is moving in the right direction — keep the momentum going by acting on your #1 priority issue this week.`);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchKeyStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/serp-keys/status`);
      if (res.ok) setKeyStatus(await res.json());
    } catch {}
  }, []);

  const reloadKeys = useCallback(async () => {
    setKeyReloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/serp-keys/reload`, { method: "POST" });
      if (res.ok) setKeyStatus(await res.json());
    } catch {}
    setKeyReloading(false);
  }, []);

  useEffect(() => {
    if (showKeyPanel) fetchKeyStatus();
  }, [showKeyPanel, fetchKeyStatus]);

  // ── Shared nav elements ────────────────────────────────────────────────────
  const NavBar = ({ isLanding = false }) => (
    <nav className="iq-surface" style={{
      position: isLanding ? "static" : "sticky",
      top: 0, zIndex: 50,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56,
      }}>
        {/* Wordmark */}
        <button
          onClick={() => { if (!isLanding) { setData(null); setQuery(""); } }}
          style={{ background: "none", border: "none", padding: 0, cursor: isLanding ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}>
            {Icon.chart}
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20,
            color: "var(--text)", letterSpacing: "-0.3px",
          }}>
            Review<span style={{ color: "var(--accent)" }}>IQ</span>
          </span>
        </button>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isLanding && (
            <>
              {/* Dashboard inline search */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--muted)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "6px 12px",
              }}>
                <span style={{ color: "var(--text-mute)", display: "flex" }}>{Icon.search}</span>
                <input
                  className="dash-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runSearch(query)}
                  placeholder="Search business…"
                  style={{ fontSize: 13, width: 210, color: "var(--text)", fontFamily: "var(--font-body)" }}
                />
              </div>
              <button
                className="iq-btn-primary"
                onClick={() => runSearch(query)}
                style={{
                  background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-sm)",
                  padding: "7px 16px", fontSize: 13, fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                Analyze →
              </button>
            </>
          )}

          {/* Dark mode */}
          <button
            className="theme-btn"
            onClick={toggleDark}
            title={dark ? "Light mode" : "Dark mode"}
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)", background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-sub)",
            }}
          >
            {dark ? Icon.sun : Icon.moon}
          </button>

          {/* Gear */}
          <button
            className="theme-btn"
            onClick={() => setShowKeyPanel(v => !v)}
            title="SerpAPI key pool"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-sm)",
              border: `1px solid ${showKeyPanel ? "var(--accent)" : "var(--border)"}`,
              background: showKeyPanel ? "var(--accent-lt)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: showKeyPanel ? "var(--accent)" : "var(--text-sub)",
            }}
          >
            {Icon.gear}
          </button>

          {!isLanding && (
            <button
              className="iq-btn-ghost"
              onClick={() => { setData(null); setQuery(""); }}
              style={{
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "7px 10px",
                color: "var(--text-sub)", display: "flex", alignItems: "center",
              }}
            >
              {Icon.close}
            </button>
          )}
        </div>
      </div>
    </nav>
  );

  const KeyPanel = () => (
    <div className="iq-surface" style={{
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "20px 28px",
      animation: "alertSlide 0.2s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, color: "var(--text)", letterSpacing: "-0.2px" }}>SerpAPI Key Pool</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
              Add keys in <code>backend/.env</code> — they rotate round-robin with 60 s cooldown on 429
            </div>
          </div>
          <button
            className="iq-btn-ghost"
            onClick={reloadKeys}
            disabled={keyReloading}
            style={{
              background: "var(--accent-lt)", border: "1px solid var(--accent-md)",
              borderRadius: "var(--radius-sm)", padding: "7px 14px",
              fontSize: 12, fontWeight: 700, color: "var(--accent)",
              fontFamily: "var(--font-body)",
              opacity: keyReloading ? 0.6 : 1, cursor: keyReloading ? "not-allowed" : "pointer",
            }}
          >
            {keyReloading ? "Reloading…" : "↺ Reload keys"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { env: "SERPAPI_KEY",   label: "Slot 1" },
            { env: "SERPAPI_KEY_1", label: "Slot 2" },
            { env: "SERPAPI_KEY_2", label: "Slot 3" },
            { env: "SERPAPI_KEY_3", label: "Slot 4" },
            { env: "SERPAPI_KEY_4", label: "Slot 5" },
            { env: "SERPAPI_KEY_5", label: "Slot 6" },
          ].map(({ env, label }, idx) => {
            const k = keyStatus?.keys?.[idx];
            const active  = !!k;
            const blocked = active && !k.available;
            return (
              <div key={env} style={{
                padding: "10px 13px", borderRadius: 10,
                border: `1px solid ${active ? (blocked ? "var(--danger-md)" : "var(--success-md)") : "var(--border)"}`,
                background: active ? (blocked ? "var(--danger-lt)" : "var(--success-lt)") : "var(--muted)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "var(--text-sub)" }}>{label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                    background: active ? (blocked ? "var(--danger-md)" : "var(--success-md)") : "var(--border)",
                    color: active ? (blocked ? "var(--danger)" : "var(--success)") : "var(--text-mute)",
                  }}>
                    {active ? (blocked ? `cooldown ${k.backoff_remaining_s}s` : "active") : "empty"}
                  </span>
                </div>
                <code style={{ fontSize: 10, color: "var(--text-mute)", display: "block" }}>{env}</code>
                {active && <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-sub)", marginTop: 3 }}>…{k.suffix?.slice(-6)}</div>}
              </div>
            );
          })}
        </div>
        <div style={{
          padding: "10px 14px", background: "var(--accent-lt)",
          border: "1px solid var(--accent-md)", borderRadius: 9,
          fontSize: 12, color: "var(--accent)", lineHeight: 1.6,
          fontFamily: "var(--font-body)",
        }}>
          <strong>How to add keys:</strong> Open <code>backend/.env</code>, set any slot above, click ↺ Reload. No restart needed.
        </div>
      </div>
    </div>
  );

  // ── Landing ────────────────────────────────────────────────────────────────
  if (!data && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <style>{GLOBAL_CSS}</style>

        <NavBar isLanding />
        {showKeyPanel && <KeyPanel />}

        {/* Hero */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "72px 28px 56px",
          textAlign: "center",
        }}>
          {/* Eyeline rule */}
          <div style={{
            width: 40, height: 3, background: "var(--accent)",
            borderRadius: 2, marginBottom: 32,
            animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both",
          }} />

          {/* Main headline */}
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "clamp(48px, 7.5vw, 84px)",
            color: "var(--text)", letterSpacing: "-2px", lineHeight: 0.95,
            margin: "0 0 22px", maxWidth: 760,
            animation: "slideUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s both",
          }}>
            Know exactly what your<br />
            <span style={{ color: "var(--accent)" }}>customers really think.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 400,
            color: "var(--text-sub)", maxWidth: 500, lineHeight: 1.7,
            margin: "0 0 48px",
            animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s both",
          }}>
            Enter any business name. Get a full intelligence brief — issues ranked by severity, sentiment trends, competitor gaps, and an AI action plan — in under 30 seconds.
          </p>

          {/* Search bar */}
          <div style={{
            width: "100%", maxWidth: 580,
            animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.26s both",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-lt), var(--shadow-md)";
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
            >
              <span style={{ paddingLeft: 18, color: "var(--text-mute)", display: "flex", flexShrink: 0 }}>
                {Icon.search}
              </span>
              <input
                className="landing-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runSearch(query)}
                placeholder="Business name + location…  e.g. Chipotle Charlotte NC"
              />
              <button
                className="iq-btn-primary"
                onClick={() => runSearch(query)}
                style={{
                  background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: 0,
                  padding: "0 26px", height: 56,
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "var(--font-body)", letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                Analyze →
              </button>
            </div>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-mute)", fontSize: 12, marginTop: 10 }}>
              Try: <em style={{ color: "var(--text-sub)" }}>"Joe's Pizza New York"</em> or <em style={{ color: "var(--text-sub)" }}>"Starbucks Austin TX"</em>
            </p>
          </div>

          {/* Feature flags */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 10, marginTop: 52,
            justifyContent: "center",
            animation: "slideUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.34s both",
          }}>
            {[
              { icon: Icon.alert,  label: "Issue Detection" },
              { icon: Icon.trend,  label: "Trend Analysis" },
              { icon: Icon.users,  label: "Competitor Intel" },
              { icon: Icon.chat,   label: "AI Replies" },
              { icon: Icon.report, label: "Weekly Reports" },
            ].map(({ icon, label }, i) => (
              <span
                key={label}
                className="chip"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20, padding: "7px 16px",
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                  color: "var(--text-sub)",
                  animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${0.38 + i * 0.06}s both`,
                }}
              >
                <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 28px",
          display: "flex", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 11,
            color: "var(--text-mute)", letterSpacing: "0.04em",
          }}>
            POWERED BY SERPAPI · GROQ AI · GOOGLE MAPS
          </span>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-body)",
      }}>
        <style>{GLOBAL_CSS}</style>
        {/* Top progress bar */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "var(--border)", zIndex: 100 }}>
          <div style={{
            height: "100%", background: "var(--accent)",
            animation: "progressBar 2.5s ease-in-out infinite",
          }} />
        </div>
        <style>{`@keyframes progressBar { 0%{width:0%} 50%{width:75%} 100%{width:95%} }`}</style>

        <div className="iq-surface" style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18, padding: "48px 56px",
          textAlign: "center", maxWidth: 360, width: "90%",
          boxShadow: "var(--shadow-lg)",
          animation: "stampIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{
            width: 52, height: 52, margin: "0 auto 28px",
            border: "2.5px solid var(--accent-md)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.85s linear infinite",
          }} />
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22,
            color: "var(--text)", marginBottom: 8, letterSpacing: "-0.3px",
          }}>
            Analysing your business
          </div>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: 14,
            color: "var(--accent)", fontWeight: 600, marginBottom: 28, minHeight: 20,
          }}>
            {loadingStage}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {["Fetching reviews", "Running AI analysis", "Loading competitors"].map((s, i) => {
              const active = loadingStage.includes(i === 0 ? "Searching" : i === 1 ? "Running" : "Loading");
              const done   = (i === 0 && (loadingStage.includes("Running") || loadingStage.includes("Loading")))
                           || (i === 1 && loadingStage.includes("Loading"));
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: active ? "var(--accent)" : done ? "var(--success)" : "var(--border)",
                    animation: active ? "pulse 1.2s ease-in-out infinite" : "none",
                    transition: "background 0.3s",
                  }} />
                  <span style={{ fontSize: 10, color: active ? "var(--accent)" : "var(--text-mute)", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <style>{GLOBAL_CSS}</style>
        <div className="iq-surface" style={{
          background: "var(--surface)", borderRadius: 18, padding: "40px 48px",
          textAlign: "center", maxWidth: 480, width: "100%",
          border: "1px solid var(--danger-md)", boxShadow: "var(--shadow-lg)",
          animation: "stampIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
            background: "var(--danger-lt)", border: "1px solid var(--danger-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--danger)",
          }}>
            {Icon.alert}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.3px" }}>
            Something went wrong
          </h2>
          <div style={{
            background: "var(--danger-lt)", border: "1px solid var(--danger-md)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          }}>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--danger)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="iq-btn-primary"
              onClick={() => { setError(null); runSearch(query); }}
              style={{
                background: "var(--accent)", color: "#fff", border: "none",
                borderRadius: "var(--radius-sm)", padding: "10px 22px",
                fontSize: 14, fontWeight: 700, fontFamily: "var(--font-body)",
              }}
            >
              Try Again
            </button>
            <button
              className="iq-btn-ghost"
              onClick={() => { setError(null); setData(null); setQuery(""); }}
              style={{
                background: "var(--muted)", color: "var(--text-sub)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                padding: "10px 22px", fontSize: 14, fontWeight: 600,
                fontFamily: "var(--font-body)",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }


  // ── Dashboard computations ─────────────────────────────────────────────────
  const { business, reviews, analysis, trends, competitors } = data;
  const currentYear   = String(new Date().getFullYear());
  const cyReviews     = reviews.filter(r => r.month?.startsWith(currentYear));
  const cyMonthKeys   = Object.keys(trends).filter(m => m.startsWith(currentYear)).sort();
  const allMonths     = cyMonthKeys.length > 0
    ? getAllMonthsBetween(cyMonthKeys[0], cyMonthKeys[cyMonthKeys.length - 1]) : [];
  const trendData     = allMonths.map(m => ({
    month: m, label: formatMonthLabel(m),
    rating: trends[m]?.avg_rating ?? null,
    sentiment: trends[m] ? Math.round(trends[m].sentiment * 100) : null,
    reviews: trends[m]?.review_count ?? 0,
  }));
  const ratedMonths   = trendData.filter(d => d.rating !== null);
  const bestMonth     = ratedMonths.length ? ratedMonths.reduce((a, b) => a.rating > b.rating ? a : b) : null;
  const worstMonth    = ratedMonths.length ? ratedMonths.reduce((a, b) => a.rating < b.rating ? a : b) : null;
  const totalReviewsInTrend = trendData.reduce((s, d) => s + (d.reviews || 0), 0);

  const sortedIndividual = [...cyReviews.filter(r => r.month)].sort((a, b) => a.month.localeCompare(b.month));
  const rollWindow    = sortedIndividual.length < 2 ? 1 : sortedIndividual.length < 6 ? 2 : sortedIndividual.length < 16 ? 3 : 5;
  const reviewTimeline = sortedIndividual.map((r, i) => {
    const win = sortedIndividual.slice(Math.max(0, i - rollWindow + 1), i + 1);
    const avg = win.reduce((s, x) => s + x.rating, 0) / win.length;
    return { idx: i + 1, rating: r.rating, rolling: +avg.toFixed(2), author: r.author, month: r.month, isNewMonth: i === 0 || r.month !== sortedIndividual[i - 1].month };
  });
  const monthBoundaryIdxs = reviewTimeline.filter(d => d.isNewMonth).map(d => d.idx);
  const timelineTicks  = reviewTimeline.length <= 20 ? reviewTimeline.map(d => d.idx) : monthBoundaryIdxs;

  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    const count = cyReviews.filter(r => r.rating === star).length;
    return { star, count, pct: cyReviews.length ? Math.round(count / cyReviews.length * 100) : 0,
      color: star >= 4 ? "#22c55e" : star === 3 ? "#eab308" : star === 2 ? "#f97316" : "#ef4444" };
  });
  const positivePct = cyReviews.length ? Math.round(cyReviews.filter(r => r.rating >= 4).length / cyReviews.length * 100) : 0;

  const isCapped = reviews.length > 0 && (business.total_reviews || 0) > reviews.length;
  const cyReviewsByMonth = {};
  for (const r of cyReviews) {
    if (!cyReviewsByMonth[r.month]) cyReviewsByMonth[r.month] = [];
    cyReviewsByMonth[r.month].push(r);
  }
  const currentYearData = trendData.map(d => {
    const group = cyReviewsByMonth[d.month] || [];
    const sample = group.slice(0, 15);
    const rating = sample.length ? +(sample.reduce((s, r) => s + r.rating, 0) / sample.length).toFixed(2) : null;
    return { ...d, rating, reviews: sample.length };
  });
  const currentYearRated = currentYearData.filter(d => d.rating !== null);
  const bestCYMonth  = currentYearRated.length ? currentYearRated.reduce((a, b) => a.rating > b.rating ? a : b) : null;
  const worstCYMonth = currentYearRated.length ? currentYearRated.reduce((a, b) => a.rating < b.rating ? a : b) : null;
  const firstCYRating = currentYearRated[0]?.rating ?? null;
  const lastCYRating  = currentYearRated[currentYearRated.length - 1]?.rating ?? null;
  const cyTrajDiff   = firstCYRating !== null && lastCYRating !== null ? lastCYRating - firstCYRating : 0;
  const cyTrajLabel  = currentYearRated.length < 2 ? "—" : cyTrajDiff > 0.1 ? `↑ +${cyTrajDiff.toFixed(1)}★` : cyTrajDiff < -0.1 ? `↓ ${cyTrajDiff.toFixed(1)}★` : "→ Stable";
  const cyTrajAccent = cyTrajDiff > 0.1 ? "var(--success)" : cyTrajDiff < -0.1 ? "var(--danger)" : "var(--warn)";

  const allBusinesses = [
    { name: business.name, rating: business.rating || 0, total_reviews: business.total_reviews || 0, avg_sentiment: analysis.overall_sentiment || 0, isYou: true },
    ...competitors.map(c => ({ ...c, rating: c.rating || 0, total_reviews: c.total_reviews || 0, avg_sentiment: c.avg_sentiment || 0, isYou: false })),
  ];
  const sortedByRating   = [...allBusinesses].sort((a, b) => b.rating - a.rating);
  const avgCompRating    = competitors.length ? competitors.reduce((s, c) => s + (c.rating || 0), 0) / competitors.length : 0;
  const avgCompReviews   = competitors.length ? Math.round(competitors.reduce((s, c) => s + (c.total_reviews || 0), 0) / competitors.length) : 0;
  const avgCompSentiment = competitors.length ? competitors.reduce((s, c) => s + (c.avg_sentiment || 0), 0) / competitors.length : 0;
  const ratingVsMarket   = (business.rating || 0) - avgCompRating;
  const reviewsVsMarket  = (business.total_reviews || 0) - avgCompReviews;
  const maxReviews       = Math.max(...allBusinesses.map(b => b.total_reviews || 0), 1);
  const marketScore      = b => Math.round(((b.rating || 0) / 5) * 60 + (Math.min((b.total_reviews || 0) / maxReviews, 1)) * 40);
  const yourScore        = marketScore({ rating: business.rating || 0, total_reviews: business.total_reviews || 0 });
  const leaderboard      = [...allBusinesses].map(b => ({ ...b, score: marketScore(b) })).sort((a, b) => b.score - a.score);
  const scoreRank        = leaderboard.findIndex(b => b.isYou) + 1;
  const leader           = leaderboard[0];
  const aboveYou         = competitors.filter(c => (c.rating || 0) > (business.rating || 0));
  const belowYou         = competitors.filter(c => (c.rating || 0) <= (business.rating || 0));
  const compBarData      = sortedByRating.map(b => ({
    name: b.isYou ? `★ ${b.name.length > 18 ? b.name.slice(0, 16) + "…" : b.name}` : (b.name.length > 20 ? b.name.slice(0, 18) + "…" : b.name),
    rating: b.rating, isYou: b.isYou,
  }));

  const chartColor = dark ? "#4D7FFF" : "#0047FF";
  const gridColor  = dark ? "#252528" : "#E4E7EC";
  const textColor  = dark ? "#6B7280" : "#9CA3AF";

  const tabs = [
    { id: "overview",    label: "Overview",      icon: Icon.home   },
    { id: "issues",      label: "Issues",        icon: Icon.alert  },
    { id: "trends",      label: "Trends",        icon: Icon.trend  },
    { id: "competitors", label: "Competitors",   icon: Icon.users  },
    { id: "replies",     label: "AI Replies",    icon: Icon.chat   },
    { id: "report",      label: "Weekly Report", icon: Icon.report },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{GLOBAL_CSS}</style>

      <NavBar />
      {showKeyPanel && <KeyPanel />}

      {/* Business header */}
      <div className="iq-surface" style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: "clamp(26px, 3.5vw, 38px)",
                color: "var(--text)", letterSpacing: "-0.8px", lineHeight: 1,
                marginBottom: 6,
              }}>
                {business.name}
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 13,
                color: "var(--text-mute)", letterSpacing: "0.03em",
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                <span style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", fontSize: 11 }}>
                  {business.category || "Business"}
                </span>
                <span style={{ color: "var(--border)" }}>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#F59E0B" }}>★</span>
                  <strong style={{ color: "var(--text-sub)", fontWeight: 700 }}>{business.rating?.toFixed(1) || "—"}</strong>
                </span>
                <span style={{ color: "var(--border)" }}>·</span>
                <span>{(business.total_reviews || 0).toLocaleString()} reviews</span>
                {business.address && (
                  <>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <span>{business.address}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <SentimentBadge value={analysis.overall_sentiment} />
              {analysis.alert?.triggered && (
                <span style={{
                  background: "var(--danger-lt)", color: "var(--danger)",
                  border: "1px solid var(--danger-md)",
                  borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {Icon.alert} Alert
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div ref={tabBarRef} style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 28px",
          display: "flex", position: "relative",
          borderTop: "1px solid var(--border)",
        }}>
          {/* Sliding indicator */}
          <div style={{
            position: "absolute", bottom: 0, height: 2,
            background: "var(--accent)", borderRadius: "2px 2px 0 0",
            transition: "left 0.25s cubic-bezier(0.16,1,0.3,1), width 0.25s cubic-bezier(0.16,1,0.3,1)",
            left: tabInd.left, width: tabInd.width,
          }} />
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              ref={el => tabBtnRefs.current[id] = el}
              className="tab-btn"
              onClick={() => setActiveTab(id)}
              style={{
                padding: "12px 18px", fontSize: 13, fontWeight: activeTab === id ? 700 : 500,
                color: activeTab === id ? "var(--accent)" : "var(--text-sub)",
                fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ display: "flex", opacity: activeTab === id ? 1 : 0.6 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      {analysis.alert?.triggered && (
        <div style={{
          background: "var(--danger-lt)", borderBottom: "1px solid var(--danger-md)",
          padding: "10px 0",
          animation: "alertSlide 0.3s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--danger)", display: "flex" }}>{Icon.alert}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger)", fontWeight: 600, flex: 1 }}>
              {analysis.alert.reason}
            </span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--danger)", background: "var(--danger-md)",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {analysis.alert.urgency}
            </span>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div key={activeTab} style={{ animation: "tabEnter 0.28s cubic-bezier(0.16,1,0.3,1) both" }}>


          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (() => {
            const sentPct = Math.round(analysis.overall_sentiment * 100);
            return (
              <div>
                {/* Metrics row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                  <Reveal stagger={0}>
                    <MetricTile label="Sentiment Score" value={sentPct} format="pct"
                      accent={sentPct >= 70} success={sentPct >= 70}
                      warn={sentPct >= 50 && sentPct < 70} danger={sentPct < 50}
                      sub={sentPct >= 70 ? "Strong — keep it up" : sentPct >= 50 ? "Room to improve" : "Needs urgent action"}
                    />
                  </Reveal>
                  <Reveal stagger={1}>
                    <MetricTile label="Total Reviews" value={business.total_reviews || 0} format="number"
                      sub={(business.address || "").split(",").slice(-2).join(",").trim() || undefined}
                    />
                  </Reveal>
                  <Reveal stagger={2}>
                    <MetricTile label="Avg Rating" value={(business.rating || 0) * 10} format="decimal"
                      accent danger={(business.rating || 0) < 3} warn={(business.rating || 0) >= 3 && (business.rating || 0) < 4}
                      success={(business.rating || 0) >= 4}
                      sub="out of 5.0"
                    />
                  </Reveal>
                  <Reveal stagger={3}>
                    <MetricTile label="Issues Found" value={analysis.issues?.length || 0} format="number"
                      danger={(analysis.issues?.length || 0) >= 3}
                      warn={(analysis.issues?.length || 0) >= 1 && (analysis.issues?.length || 0) < 3}
                      sub={analysis.issues?.[0] ? `#1: ${analysis.issues[0].title}` : "No issues found"}
                    />
                  </Reveal>
                </div>

                {/* Two-column: summary + quick wins */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 24 }}>
                  {/* Summary + top issues teaser */}
                  <Reveal>
                    <div className="iq-card" style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "24px 26px",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                      <SectionFlag label="Intelligence Summary" />
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-sub)", lineHeight: 1.75, margin: "0 0 20px" }}>
                        {analysis.summary}
                      </p>
                      {analysis.issues?.slice(0, 3).map((issue, i) => (
                        <div key={issue.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 0",
                          borderTop: i === 0 ? "1px solid var(--border)" : "none",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28,
                            color: "var(--border)", lineHeight: 1, minWidth: 32,
                          }}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{issue.title}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4,
                                background: SEV_BG[issue.severity], color: SEV_COLOR[issue.severity],
                                border: `1px solid ${SEV_BORDER[issue.severity]}`,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                              }}>
                                {SEV_LABEL[issue.severity]}
                              </span>
                            </div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)" }}>
                              Mentioned in {issue.frequency} reviews
                            </div>
                          </div>
                          <button
                            className="iq-btn-ghost"
                            onClick={() => setActiveTab("issues")}
                            style={{
                              fontSize: 11, color: "var(--accent)", fontWeight: 600,
                              background: "var(--accent-lt)", border: "1px solid var(--accent-md)",
                              borderRadius: 6, padding: "4px 10px", whiteSpace: "nowrap",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            View →
                          </button>
                        </div>
                      ))}
                    </div>
                  </Reveal>

                  {/* Quick wins + keywords */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Reveal stagger={1}>
                      <div className="iq-card" style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius)", padding: "22px 24px",
                        boxShadow: "var(--shadow-sm)",
                      }}>
                        <SectionFlag label="Quick Wins" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {(analysis.quick_wins || []).map((win, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                background: "var(--success-lt)", border: "1px solid var(--success-md)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--success)", marginTop: 1,
                              }}>
                                {Icon.bolt}
                              </div>
                              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-sub)", lineHeight: 1.6 }}>{win}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>

                    {/* Keywords */}
                    <Reveal stagger={2}>
                      <div className="iq-card" style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius)", padding: "22px 24px",
                        boxShadow: "var(--shadow-sm)",
                      }}>
                        <SectionFlag label="Top Keywords" />
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {(analysis.keywords?.negative || []).slice(0, 5).map(({ word, count }) => (
                            <span key={word} style={{
                              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                              background: "var(--danger-lt)", color: "var(--danger)",
                              border: "1px solid var(--danger-md)",
                              borderRadius: 20, padding: "3px 10px",
                            }}>
                              {word} <span style={{ opacity: 0.7 }}>×{count}</span>
                            </span>
                          ))}
                          {(analysis.keywords?.positive || []).slice(0, 5).map(({ word, count }) => (
                            <span key={word} style={{
                              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                              background: "var(--success-lt)", color: "var(--success)",
                              border: "1px solid var(--success-md)",
                              borderRadius: 20, padding: "3px 10px",
                            }}>
                              {word} <span style={{ opacity: 0.7 }}>×{count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </div>

                {/* Marketing advice */}
                {analysis.marketing_advice && (
                  <Reveal>
                    <div className="iq-card" style={{
                      background: "var(--accent-lt)", border: "1px solid var(--accent-md)",
                      borderLeft: "3px solid var(--accent)",
                      borderRadius: "var(--radius)", padding: "20px 24px",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                      <SectionFlag label="Marketing Intelligence" />
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", lineHeight: 1.75, margin: 0 }}>
                        {analysis.marketing_advice}
                      </p>
                    </div>
                  </Reveal>
                )}
              </div>
            );
          })()}

          {/* ── ISSUES TAB ── */}
          {activeTab === "issues" && (() => {
            const issues = analysis.issues || [];
            if (!issues.length) return (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-mute)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600 }}>No issues found</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, marginTop: 6 }}>Customers are happy — keep it up!</div>
              </div>
            );

            const lead = issues[0];
            const rest = issues.slice(1);

            return (
              <div>
                {/* Lead issue — editorial hierarchy */}
                <Reveal>
                  <div className="iq-card" style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderLeft: `4px solid ${SEV_COLOR[lead.severity]}`,
                    borderRadius: "var(--radius)", padding: "28px 32px",
                    boxShadow: "var(--shadow-sm)", marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 64, color: "var(--border)", lineHeight: 0.9 }}>01</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <h2 style={{
                            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28,
                            color: "var(--text)", margin: 0, letterSpacing: "-0.4px",
                          }}>
                            {lead.title}
                          </h2>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px",
                            borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.08em",
                            background: SEV_BG[lead.severity], color: SEV_COLOR[lead.severity],
                            border: `1px solid ${SEV_BORDER[lead.severity]}`,
                          }}>
                            {SEV_LABEL[lead.severity]}
                          </span>
                          <span style={{
                            fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)",
                          }}>
                            Mentioned in {lead.frequency} reviews
                          </span>
                        </div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-sub)", lineHeight: 1.7, margin: "0 0 16px" }}>
                          {lead.description}
                        </p>
                        {lead.example_quote && (
                          <blockquote style={{
                            fontFamily: "var(--font-body)", fontSize: 14,
                            fontStyle: "italic", color: "var(--text-sub)",
                            borderLeft: "3px solid var(--border)", paddingLeft: 16, margin: "0 0 16px",
                          }}>
                            "{lead.example_quote}"
                          </blockquote>
                        )}
                        <div style={{
                          background: "var(--success-lt)", border: "1px solid var(--success-md)",
                          borderRadius: "var(--radius-sm)", padding: "14px 18px",
                        }}>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)", marginBottom: 6 }}>
                            Recommended Action
                          </div>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", margin: 0, lineHeight: 1.65 }}>
                            {lead.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Remaining issues */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {rest.map((issue, i) => (
                    <Reveal key={issue.id} className="reveal-left" stagger={i}>
                      <div
                        className="iq-card issue-row"
                        onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                        style={{
                          background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius)", padding: "18px 22px",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36, color: "var(--border)", lineHeight: 1, minWidth: 48 }}>
                            {String(i + 2).padStart(2, "0")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{issue.title}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                                background: SEV_BG[issue.severity], color: SEV_COLOR[issue.severity],
                                border: `1px solid ${SEV_BORDER[issue.severity]}`,
                                textTransform: "uppercase", letterSpacing: "0.07em",
                              }}>
                                {SEV_LABEL[issue.severity]}
                              </span>
                            </div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)", marginTop: 3 }}>
                              {issue.frequency} reviews · {issue.category.replace("_", " ")}
                            </div>
                          </div>
                          <div style={{ color: "var(--text-mute)", fontSize: 12, fontFamily: "var(--font-body)", transition: "transform 0.2s", transform: expandedIssue === issue.id ? "rotate(180deg)" : "none" }}>▾</div>
                        </div>

                        {expandedIssue === issue.id && (
                          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)", animation: "tabEnter 0.22s cubic-bezier(0.16,1,0.3,1) both" }}>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", lineHeight: 1.7, margin: "0 0 12px" }}>
                              {issue.description}
                            </p>
                            {issue.example_quote && (
                              <blockquote style={{
                                fontFamily: "var(--font-body)", fontSize: 13, fontStyle: "italic",
                                color: "var(--text-sub)", borderLeft: "3px solid var(--border)",
                                paddingLeft: 14, margin: "0 0 14px",
                              }}>
                                "{issue.example_quote}"
                              </blockquote>
                            )}
                            <div style={{
                              background: "var(--success-lt)", border: "1px solid var(--success-md)",
                              borderRadius: "var(--radius-sm)", padding: "12px 16px",
                            }}>
                              <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)", marginBottom: 5 }}>Action</div>
                              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-sub)", margin: 0, lineHeight: 1.65 }}>{issue.solution}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>

                {/* Positives */}
                {(analysis.positives || []).length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <Reveal>
                      <div className="iq-card" style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius)", padding: "24px 26px",
                        boxShadow: "var(--shadow-sm)",
                      }}>
                        <SectionFlag label="What Customers Love" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                          {analysis.positives.map((pos, i) => (
                            <div key={i} style={{
                              background: "var(--success-lt)", border: "1px solid var(--success-md)",
                              borderRadius: "var(--radius-sm)", padding: "14px 16px",
                            }}>
                              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--success)", marginBottom: 4 }}>
                                {pos.title}
                              </div>
                              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-mute)", marginBottom: 6 }}>
                                {pos.frequency} reviews
                              </div>
                              {pos.example_quote && (
                                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontStyle: "italic", color: "var(--text-sub)", lineHeight: 1.5 }}>
                                  "{pos.example_quote.slice(0, 90)}{pos.example_quote.length > 90 ? "…" : ""}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  </div>
                )}
              </div>
            );
          })()}


          {/* ── TRENDS TAB ── */}
          {activeTab === "trends" && (() => {
            const chartData = isCapped ? currentYearData : trendData;
            const ratedData = chartData.filter(d => d.rating !== null);
            return (
              <div>
                {/* Trend metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  <Reveal stagger={0}><MetricTile label="Best Month" value={bestCYMonth?.rating ? bestCYMonth.rating * 10 : 0} format="decimal" success sub={bestCYMonth ? formatMonthLabel(bestCYMonth.month) : "No data"} /></Reveal>
                  <Reveal stagger={1}><MetricTile label="Worst Month" value={worstCYMonth?.rating ? worstCYMonth.rating * 10 : 0} format="decimal" danger sub={worstCYMonth ? formatMonthLabel(worstCYMonth.month) : "No data"} /></Reveal>
                  <Reveal stagger={2}><MetricTile label="Trajectory" value={Math.abs(cyTrajDiff * 10)} format="decimal" accent sub={cyTrajLabel} /></Reveal>
                  <Reveal stagger={3}><MetricTile label="Reviews This Year" value={currentYearRated.reduce((s, d) => s + (d.reviews || 0), 0)} format="number" sub={`across ${currentYearRated.length} months`} /></Reveal>
                </div>

                {/* Rating chart */}
                <Reveal>
                  <div className="iq-card" style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius)", padding: "24px 26px",
                    boxShadow: "var(--shadow-sm)", marginBottom: 20,
                  }}>
                    <SectionFlag label={isCapped ? "Monthly Avg Rating" : "Sentiment Trend"} />
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor, fontFamily: "var(--font-body)" }} />
                          <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: textColor }} />
                          <Tooltip
                            contentStyle={{
                              background: "var(--surface)", border: "1px solid var(--border)",
                              borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 12, boxShadow: "var(--shadow-md)",
                            }}
                            labelStyle={{ color: "var(--text)", fontWeight: 700 }}
                          />
                          <ReferenceLine y={business.rating || 3.8} stroke={dark ? "#4D7FFF" : "#0047FF"} strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Current avg", fontSize: 10, fill: chartColor }} />
                          <Line type="monotone" dataKey="rating" stroke={chartColor} strokeWidth={2.5} dot={{ r: 4, fill: chartColor, strokeWidth: 0 }} activeDot={{ r: 6 }} name="Avg Rating" connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Reveal>

                {/* Individual reviews timeline (non-capped) */}
                {!isCapped && reviewTimeline.length > 0 && (
                  <Reveal>
                    <div className="iq-card" style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "24px 26px",
                      boxShadow: "var(--shadow-sm)", marginBottom: 20,
                    }}>
                      <SectionFlag label="Individual Review Timeline" />
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reviewTimeline} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="idx" ticks={timelineTicks} tickFormatter={v => { const d = reviewTimeline.find(x => x.idx === v); return d?.isNewMonth ? formatMonthLabel(d.month) : ""; }} tick={{ fontSize: 10, fill: textColor }} />
                            <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: textColor }} />
                            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 12 }}
                              formatter={(v, n, p) => [v, n]}
                              labelFormatter={v => { const d = reviewTimeline.find(x => x.idx === v); return d ? `Review #${v} · ${formatMonthLabel(d.month)}` : `Review #${v}`; }}
                            />
                            <Line type="monotone" dataKey="rating" stroke={dark ? "#34D399" : "#059669"} strokeWidth={1.5} dot={{ r: 3.5 }} name="Rating" />
                            <Line type="monotone" dataKey="rolling" stroke={chartColor} strokeWidth={2.5} dot={false} name={`${rollWindow}-review avg`} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Reveal>
                )}

                {/* Rating distribution */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <Reveal stagger={0}>
                    <div className="iq-card" style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "24px 26px",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                      <SectionFlag label="Rating Distribution" />
                      {ratingDist.map(({ star, count, pct, color }) => (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-sub)", width: 16, textAlign: "right" }}>{star}</span>
                          <span style={{ color: "#F59E0B", fontSize: 11 }}>★</span>
                          <div style={{ flex: 1, height: 8, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                              width: `${pct}%`, height: "100%", background: color,
                              borderRadius: 4, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                            }} />
                          </div>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)", width: 28, textAlign: "right" }}>{count}</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-mute)", width: 32 }}>{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </Reveal>

                  <Reveal stagger={1}>
                    <div className="iq-card" style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "24px 26px",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                      <SectionFlag label="Sentiment Trend" />
                      {ratedData.length > 0 ? (
                        <div style={{ height: 160 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratedData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                              <XAxis dataKey="label" tick={{ fontSize: 10, fill: textColor }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: textColor }} />
                              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 11 }} formatter={v => [`${v}%`, "Sentiment"]} />
                              <Bar dataKey="sentiment" radius={[4,4,0,0]} name="Sentiment">
                                {ratedData.map((d, i) => (
                                  <Cell key={i} fill={(d.sentiment || 0) >= 70 ? (dark ? "#34D399" : "#059669") : (d.sentiment || 0) >= 50 ? (dark ? "#FBBF24" : "#D97706") : (dark ? "#F87171" : "#DC2626")} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-mute)", fontFamily: "var(--font-body)", fontSize: 13 }}>No trend data yet</div>
                      )}
                    </div>
                  </Reveal>
                </div>
              </div>
            );
          })()}

          {/* ── COMPETITORS TAB ── */}
          {activeTab === "competitors" && (() => {
            if (!competitors.length) return (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-mute)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36, marginBottom: 12 }}>—</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600 }}>No competitors found</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, marginTop: 6 }}>Try a business with a physical location and Google Maps presence.</div>
              </div>
            );
            return (
              <div>
                {/* Market position metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  <Reveal stagger={0}><MetricTile label="Market Score" value={yourScore} format="number" accent sub={`Rank #${scoreRank} of ${leaderboard.length}`} /></Reveal>
                  <Reveal stagger={1}><MetricTile label="Rating vs Market" value={Math.abs(Math.round(ratingVsMarket * 10))} format="decimal"
                    success={ratingVsMarket >= 0} danger={ratingVsMarket < 0}
                    sub={ratingVsMarket >= 0 ? `+${ratingVsMarket.toFixed(1)}★ above avg` : `${ratingVsMarket.toFixed(1)}★ below avg`}
                  /></Reveal>
                  <Reveal stagger={2}><MetricTile label="Above You" value={aboveYou.length} format="number" danger={aboveYou.length > 0} success={aboveYou.length === 0} sub={`${aboveYou.length} competitors ahead`} /></Reveal>
                  <Reveal stagger={3}><MetricTile label="Below You" value={belowYou.length} format="number" success={belowYou.length > 0} sub={`${belowYou.length} you outrank`} /></Reveal>
                </div>

                {/* Rating comparison bar chart */}
                <Reveal>
                  <div className="iq-card" style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius)", padding: "24px 26px",
                    boxShadow: "var(--shadow-sm)", marginBottom: 20,
                  }}>
                    <SectionFlag label="Rating Comparison" />
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compBarData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                          <XAxis type="number" domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: textColor }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: textColor, fontFamily: "var(--font-body)" }} width={120} />
                          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 12 }} formatter={v => [`${v}★`, "Rating"]} />
                          <Bar dataKey="rating" radius={[0,4,4,0]}>
                            {compBarData.map((d, i) => <Cell key={i} fill={d.isYou ? chartColor : (dark ? "#374151" : "#E4E7EC")} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Reveal>

                {/* Competitor cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {competitors.map((comp, i) => {
                    const ahead = (comp.rating || 0) > (business.rating || 0);
                    return (
                      <div
                        key={i}
                        className="comp-card"
                        style={{
                          background: "var(--surface)",
                          border: `1px solid ${ahead ? "var(--danger-md)" : "var(--success-md)"}`,
                          borderRadius: "var(--radius)", padding: "22px 24px",
                          boxShadow: "var(--shadow-sm)",
                          animation: `tabEnter 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms both`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{comp.name}</div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)" }}>{(comp.total_reviews || 0).toLocaleString()} reviews</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28, color: ratingColor(comp.rating || 0), lineHeight: 1 }}>
                              {(comp.rating || 0).toFixed(1)}
                            </div>
                            <div style={{
                              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
                              color: ahead ? "var(--danger)" : "var(--success)",
                              marginTop: 2,
                            }}>
                              {ahead ? `+${(comp.rating - (business.rating || 0)).toFixed(1)} vs you` : `${((business.rating || 0) - comp.rating).toFixed(1)} behind`}
                            </div>
                          </div>
                        </div>

                        {comp.top_praise?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)", marginBottom: 5 }}>Praised for</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {comp.top_praise.slice(0, 4).map(w => (
                                <span key={w} style={{ fontFamily: "var(--font-body)", fontSize: 11, background: "var(--success-lt)", color: "var(--success)", border: "1px solid var(--success-md)", borderRadius: 20, padding: "2px 8px" }}>{w}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {comp.top_complaints?.length > 0 && (
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--danger)", marginBottom: 5 }}>Criticised for</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {comp.top_complaints.slice(0, 3).map(w => (
                                <span key={w} style={{ fontFamily: "var(--font-body)", fontSize: 11, background: "var(--danger-lt)", color: "var(--danger)", border: "1px solid var(--danger-md)", borderRadius: 20, padding: "2px 8px" }}>{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}


          {/* ── REPLIES TAB ── */}
          {activeTab === "replies" && (() => {
            const negReviews = reviews.filter(r => r.rating <= 3);
            return (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <SectionFlag label="Negative Reviews" />
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", margin: "0 0 20px", lineHeight: 1.65 }}>
                    Showing 1–3★ reviews that need a response. Select a review, choose a tone, and generate an AI-crafted reply.
                  </p>
                </div>

                {negReviews.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "60px 0",
                    background: "var(--success-lt)", border: "1px solid var(--success-md)",
                    borderRadius: "var(--radius)",
                  }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 40, color: "var(--success)", marginBottom: 10 }}>✓</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--success)" }}>No negative reviews!</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-mute)", marginTop: 6 }}>All reviews are 4★ or above. Keep it up!</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: selectedReview ? "1fr 1fr" : "1fr", gap: 20 }}>
                    {/* Review list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {negReviews.map((rev, i) => (
                        <Reveal key={rev.id} className="reveal-left" stagger={i % 4}>
                          <div
                            className="review-card"
                            onClick={() => {
                              setSelectedReview(rev);
                              setReplyText("");
                              setReplyError(null);
                            }}
                            style={{
                              background: selectedReview?.id === rev.id ? "var(--accent-lt)" : "var(--surface)",
                              border: `1.5px solid ${selectedReview?.id === rev.id ? "var(--accent-md)" : "var(--border)"}`,
                              borderRadius: "var(--radius)", padding: "18px 20px",
                              cursor: "pointer", boxShadow: "var(--shadow-sm)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div>
                                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{rev.author}</div>
                                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{rev.date}</div>
                              </div>
                              <Stars rating={rev.rating} />
                            </div>
                            <p style={{
                              fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)",
                              lineHeight: 1.65, margin: 0,
                              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>
                              {rev.text}
                            </p>
                          </div>
                        </Reveal>
                      ))}
                    </div>

                    {/* Reply generator */}
                    {selectedReview && (
                      <div style={{ animation: "tabEnter 0.28s cubic-bezier(0.16,1,0.3,1) both" }}>
                        <div className="iq-card" style={{
                          background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius)", padding: "24px 26px",
                          boxShadow: "var(--shadow-sm)", position: "sticky", top: 80,
                        }}>
                          <SectionFlag label="Generate Reply" />

                          {/* Selected review */}
                          <div style={{
                            background: "var(--muted)", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)", padding: "14px 16px", marginBottom: 18,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{selectedReview.author}</span>
                              <Stars rating={selectedReview.rating} />
                            </div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", margin: 0, lineHeight: 1.6 }}>{selectedReview.text}</p>
                          </div>

                          {/* Tone selector */}
                          <div style={{ marginBottom: 18 }}>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-mute)", marginBottom: 10 }}>Reply Tone</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {["professional","empathetic","direct"].map(p => (
                                <button
                                  key={p}
                                  onClick={() => setReplyPersonality(p)}
                                  className={replyPersonality === p ? "iq-btn-primary" : "iq-btn-ghost"}
                                  style={{
                                    flex: 1,
                                    background: replyPersonality === p ? "var(--accent)" : "var(--muted)",
                                    color: replyPersonality === p ? "#fff" : "var(--text-sub)",
                                    border: `1px solid ${replyPersonality === p ? "var(--accent)" : "var(--border)"}`,
                                    borderRadius: "var(--radius-sm)", padding: "8px 12px",
                                    fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            className="iq-btn-primary"
                            onClick={() => generateReply(selectedReview, replyPersonality)}
                            disabled={replyLoading}
                            style={{
                              width: "100%", background: "var(--accent)", color: "#fff",
                              border: "none", borderRadius: "var(--radius-sm)", padding: "12px",
                              fontSize: 14, fontWeight: 700, fontFamily: "var(--font-body)",
                              marginBottom: 16, opacity: replyLoading ? 0.7 : 1,
                              cursor: replyLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            {replyLoading ? "Generating…" : "Generate Reply →"}
                          </button>

                          {replyError && (
                            <div style={{
                              background: "var(--danger-lt)", border: "1px solid var(--danger-md)",
                              borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 12,
                              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--danger)",
                            }}>
                              {replyError}
                            </div>
                          )}

                          {replyText && (
                            <div style={{ animation: "tabEnter 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
                              <div style={{
                                background: "var(--accent-lt)", border: "1px solid var(--accent-md)",
                                borderRadius: "var(--radius-sm)", padding: "16px 18px", marginBottom: 10,
                              }}>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", margin: 0, lineHeight: 1.7 }}>
                                  {replyText}
                                </p>
                              </div>
                              <button
                                className="iq-btn-ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(replyText);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                style={{
                                  width: "100%", background: "var(--muted)",
                                  border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                  padding: "9px", fontSize: 13, fontWeight: 600, color: "var(--text-sub)",
                                  fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                              >
                                {copied ? <><span style={{ color: "var(--success)" }}>{Icon.check}</span> Copied!</> : <>{Icon.copy} Copy Reply</>}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── REPORT TAB ── */}
          {activeTab === "report" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <SectionFlag label="Weekly Intelligence Report" />
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-sub)", margin: "0 0 20px", lineHeight: 1.65 }}>
                  An AI-generated weekly narrative based on your current reviews, top issues, and sentiment trends.
                </p>
              </div>

              <Reveal>
                <div className="iq-card" style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "28px 32px",
                  boxShadow: "var(--shadow-sm)", marginBottom: 20,
                }}>
                  {!weeklyReport ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 48, color: "var(--border)", marginBottom: 16 }}>
                        {String(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })).toUpperCase()}
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>
                        Generate your personalised weekly intelligence brief for {data.business.name}
                      </p>
                      <button
                        className="iq-btn-primary"
                        onClick={generateReport}
                        disabled={reportLoading}
                        style={{
                          background: "var(--accent)", color: "#fff", border: "none",
                          borderRadius: "var(--radius-sm)", padding: "12px 32px",
                          fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)",
                          opacity: reportLoading ? 0.7 : 1, cursor: reportLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {reportLoading ? "Generating…" : "Generate Weekly Report →"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ animation: "tabEnter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}>
                      {/* Report header */}
                      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 24 }}>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-mute)", marginBottom: 8 }}>
                          WEEKLY INTELLIGENCE BRIEF
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, color: "var(--text)", letterSpacing: "-0.5px" }}>
                          {data.business.name}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>
                          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          {" · "}Sentiment: {Math.round(analysis.overall_sentiment * 100)}%
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-sub)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                        {weeklyReport}
                      </div>
                      <div style={{ borderTop: "1px solid var(--border)", marginTop: 24, paddingTop: 20, display: "flex", gap: 10 }}>
                        <button
                          className="iq-btn-primary"
                          onClick={generateReport}
                          disabled={reportLoading}
                          style={{
                            background: "var(--accent)", color: "#fff", border: "none",
                            borderRadius: "var(--radius-sm)", padding: "9px 20px",
                            fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
                            opacity: reportLoading ? 0.7 : 1, cursor: reportLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {reportLoading ? "Generating…" : "↺ Regenerate"}
                        </button>
                        <button
                          className="iq-btn-ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(weeklyReport);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            background: "var(--muted)", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)", padding: "9px 20px",
                            fontSize: 13, fontWeight: 600, color: "var(--text-sub)",
                            fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6,
                          }}
                        >
                          {copied ? <><span style={{ color: "var(--success)" }}>{Icon.check}</span> Copied!</> : <>{Icon.copy} Copy</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          )}

        </div>{/* end key=activeTab animation wrapper */}
      </div>{/* end content padding */}
    </div>/* end dashboard root */
  );
}
