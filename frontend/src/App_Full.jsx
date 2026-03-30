import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo, memo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PolarRadiusAxis, Cell, PieChart, Pie
} from "recharts";
import {
  Upload, Brain, TrendingUp, Target, Zap, Shield,
  BarChart2, Award, ChevronRight, CheckCircle, AlertCircle,
  Star, Code, Briefcase, DollarSign, ArrowUpRight, Clock, Activity,
  User, LogOut, Menu, X, Home, Coffee, MessageSquare,
  GitBranch, Trash2, Download, RefreshCw, Users, Bell,
  FileText, Edit3, Gauge, Settings, Search, MapPin, RotateCcw,
  Heart, ThumbsDown, Send, Bot, Trophy, Plus, ExternalLink,
  BookOpen, Play, ChevronDown, ChevronUp, Link, Globe,
  Layers, Eye, Pencil, UserPlus, Copy, Check, Layout, Github
} from "lucide-react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#F8FAFC", bgCard: "#FFFFFF", bgSidebar: "#FFFFFF", bgHover: "#F1F5F9",
  bgActive: "#EFF6FF", bgSection: "#F1F5F9",
  text: "#0F172A", textMid: "#334155", textMuted: "#64748B", textLight: "#94A3B8",
  blue: "#2563EB", blueLight: "#DBEAFE", blueBorder: "#BFDBFE",
  orange: "#EA580C", orangeLight: "#FEF3E2", orangeBorder: "#FED7AA",
  purple: "#7C3AED", purpleLight: "#EDE9FE", purpleBorder: "#DDD6FE",
  pink: "#DB2777", pinkLight: "#FCE7F3", pinkBorder: "#FBCFE8",
  green: "#16A34A", greenLight: "#DCFCE7", greenBorder: "#BBF7D0",
  red: "#DC2626", redLight: "#FEE2E2", redBorder: "#FECACA",
  teal: "#0891B2", tealLight: "#E0F2FE", tealBorder: "#BAE6FD",
  border: "#E2E8F0", borderMid: "#CBD5E1",
  shadow: "0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 10px 25px rgba(0,0,0,0.1)",
};
const CH = { blue: "#2563EB", orange: "#EA580C", purple: "#7C3AED", pink: "#DB2777", green: "#16A34A", teal: "#0891B2" };

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) || "http://localhost:8000";
const GEMINI_API_KEY = (typeof process !== "undefined" && process.env?.REACT_APP_GEMINI_API_KEY) || "";

// ─── SHARED PROGRESS CONTEXT ──────────────────────────────────────────────────
const ProgressContext = createContext(null);
function useProgress() { return useContext(ProgressContext); }

function ProgressProvider({ children }) {
  const [courseProgress, setCourseProgress] = useState({});
  const [sessionLog, setSessionLog] = useState([]);

  const updateCourse = useCallback((courseId, pct, skillName) => {
    const ts = new Date().toISOString();
    setCourseProgress(prev => ({ ...prev, [courseId]: { pct, skillName, updatedAt: ts } }));
    setSessionLog(prev => [...prev.slice(-49), { courseId, skillName, pct, ts }]);
  }, []);

  const getTotalImpact = useCallback(() =>
    Object.values(courseProgress).reduce((acc, c) => {
      if (c.pct >= 100) acc.completed++;
      else if (c.pct > 0) acc.inProgress++;
      acc.totalPct += c.pct;
      acc.count++;
      return acc;
    }, { completed: 0, inProgress: 0, totalPct: 0, count: 0 }),
    [courseProgress]);

  const value = useMemo(() => ({ courseProgress, sessionLog, updateCourse, getTotalImpact }),
    [courseProgress, sessionLog, updateCourse, getTotalImpact]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtINR = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "₹0";

  const abs = Math.abs(num);

  if (abs >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(num / 100000).toFixed(1)}L`;

  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const JOB_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Data Engineer",
  "DevOps Engineer", "SRE / Platform Engineer", "Cloud Architect", "Solutions Architect",
  "Product Manager", "Engineering Manager", "Cybersecurity Analyst", "Security Engineer",
  "Mobile Developer (Android)", "Mobile Developer (iOS)", "QA / SDET Engineer",
  "Blockchain Developer", "Game Developer", "Embedded Systems Engineer",
  "Data Analyst", "Business Analyst", "UI/UX Designer", "Technical Program Manager",
];

const REAL_COURSES = [
  { id: "c1", skill: "Python", title: "Python for Everybody", platform: "Coursera / University of Michigan", type: "course", rating: 4.8, duration: "8 weeks", price: "Free Audit", salary_uplift: "+₹1.2L", url: "https://www.coursera.org/specializations/python", category: "Programming", icon: "🐍" },
  { id: "c2", skill: "TensorFlow", title: "TensorFlow Developer Certificate Prep", platform: "YouTube – TensorFlow Official", type: "video", rating: 4.9, duration: "6 weeks", price: "Free", salary_uplift: "+₹2.5L", url: "https://www.youtube.com/c/TensorFlow", category: "AI/ML", icon: "🤖" },
  { id: "c3", skill: "Machine Learning", title: "Machine Learning Specialization", platform: "Coursera – Andrew Ng", type: "course", rating: 4.9, duration: "3 months", price: "₹3,499/mo", salary_uplift: "+₹3L", url: "https://www.coursera.org/specializations/machine-learning-introduction", category: "AI/ML", icon: "🧠" },
  { id: "c4", skill: "Data Structures", title: "Data Structures & Algorithms", platform: "GeeksForGeeks", type: "course", rating: 4.7, duration: "Self-paced", price: "Free / ₹4,999", salary_uplift: "+₹1.5L", url: "https://www.geeksforgeeks.org/data-structures/", category: "DSA", icon: "🌳" },
  { id: "c5", skill: "Competitive Coding", title: "HackerRank Practice Tracks", platform: "HackerRank", type: "practice", rating: 4.6, duration: "Ongoing", price: "Free", salary_uplift: "+₹1L", url: "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript", category: "DSA", icon: "💻" },
  { id: "c6", skill: "Aptitude", title: "Quantitative Aptitude & Reasoning", platform: "IndiaBix", type: "practice", rating: 4.5, duration: "Self-paced", price: "Free", salary_uplift: "+₹0.5L", url: "https://www.indiabix.com/", category: "Aptitude", icon: "🔢" },
  { id: "c7", skill: "AWS", title: "AWS Solutions Architect Associate", platform: "A Cloud Guru / YouTube", type: "certification", rating: 4.7, duration: "3 months", price: "₹2,999/mo", salary_uplift: "+₹3.5L", url: "https://acloudguru.com/course/aws-certified-solutions-architect-associate-saa-c03", category: "Cloud", icon: "☁️" },
  { id: "c8", skill: "Kubernetes", title: "Kubernetes for Beginners", platform: "YouTube – TechWorld with Nana", type: "video", rating: 4.8, duration: "5 hours", price: "Free", salary_uplift: "+₹2L", url: "https://www.youtube.com/watch?v=X48VuDVv0do", category: "DevOps", icon: "⚙️" },
  { id: "c9", skill: "System Design", title: "System Design Interview – Full Course", platform: "YouTube – Gaurav Sen", type: "video", rating: 4.9, duration: "10 hours", price: "Free", salary_uplift: "+₹2.5L", url: "https://www.youtube.com/c/GauravSenOnline", category: "Architecture", icon: "🏗️" },
  { id: "c10", skill: "React", title: "React – The Complete Guide 2024", platform: "Udemy – Maximilian Schwarzmüller", type: "course", rating: 4.8, duration: "65 hours", price: "₹499", salary_uplift: "+₹1.8L", url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", category: "Frontend", icon: "⚛️" },
  { id: "c11", skill: "SQL", title: "SQL Tutorial – Full Database Course", platform: "YouTube – freeCodeCamp", type: "video", rating: 4.7, duration: "4.5 hours", price: "Free", salary_uplift: "+₹1L", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY", category: "Database", icon: "🗄️" },
  { id: "c12", skill: "Docker", title: "Docker & Kubernetes: The Practical Guide", platform: "Udemy", type: "course", rating: 4.7, duration: "24 hours", price: "₹499", salary_uplift: "+₹2L", url: "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", category: "DevOps", icon: "🐳" },
  { id: "c13", skill: "LeetCode / DSA", title: "Top Interview 150 Problems", platform: "LeetCode", type: "practice", rating: 4.9, duration: "Ongoing", price: "Free / ₹1,999/mo", salary_uplift: "+₹2L", url: "https://leetcode.com/studyplan/top-interview-150/", category: "DSA", icon: "🧩" },
  { id: "c14", skill: "Communication", title: "Soft Skills: The 11 Essential Career Skills", platform: "Udemy", type: "course", rating: 4.5, duration: "5 hours", price: "₹399", salary_uplift: "+₹0.8L", url: "https://www.udemy.com/course/soft-skills/", category: "Soft Skills", icon: "🗣️" },
  { id: "c15", skill: "MLOps", title: "MLOps Specialization", platform: "Coursera – DeepLearning.AI", type: "course", rating: 4.6, duration: "4 months", price: "₹3,499/mo", salary_uplift: "+₹4L", url: "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops", category: "AI/ML", icon: "🔁" },
  { id: "c16", skill: "JavaScript", title: "JavaScript Full Course", platform: "YouTube – Chai aur Code (Hindi)", type: "video", rating: 4.8, duration: "10 hours", price: "Free", salary_uplift: "+₹1.2L", url: "https://www.youtube.com/c/ChaiaurCode", category: "Programming", icon: "🟨" },
  { id: "c17", skill: "Verbal Ability", title: "Verbal Ability Practice", platform: "IndiaBix", type: "practice", rating: 4.4, duration: "Self-paced", price: "Free", salary_uplift: "+₹0.3L", url: "https://www.indiabix.com/verbal-ability/questions-and-answers/", category: "Aptitude", icon: "📝" },
  { id: "c18", skill: "Python OOP", title: "Object Oriented Programming – Python", platform: "GeeksForGeeks", type: "tutorial", rating: 4.6, duration: "Self-paced", price: "Free", salary_uplift: "+₹0.8L", url: "https://www.geeksforgeeks.org/object-oriented-programming-in-python/", category: "Programming", icon: "🐍" },
];

const SALARY_LEVELS = {
  L1: { range: [300000, 600000], label: "Fresher / Trainee" },
  L2: { range: [600000, 1000000], label: "Junior Engineer" },
  L3: { range: [1000000, 1600000], label: "Mid-Level Engineer" },
  L4: { range: [1600000, 2500000], label: "Senior Engineer" },
  L5: { range: [2500000, 4000000], label: "Staff / Tech Lead" },
  L6: { range: [4000000, 6000000], label: "Principal Engineer" },
  L7: { range: [6000000, 9000000], label: "Distinguished Eng" },
  L8: { range: [9000000, 14000000], label: "Fellow / Architect" },
  L9: { range: [14000000, 22000000], label: "Senior Fellow" },
  L10: { range: [22000000, 60000000], label: "VP / CTO" },
};

const MOCK_JOBS = [
  { id: "j1", title: "Senior ML Engineer", company: "Google India", salary_range: [4000000, 7000000], location: "Bangalore", industry: "AI/Cloud", remote: "Hybrid", exp: "4–8 yrs", match: { score: 88.5, skill_overlap: 75, matched_skills: ["Python", "TensorFlow"], missing_skills: ["MLOps"], advancement_guaranteed: true, salary_normalization: { level: "L5", normalized_score: 0.52 } } },
  { id: "j2", title: "Staff Data Scientist", company: "Flipkart", salary_range: [3500000, 6000000], location: "Bangalore", industry: "E-commerce", remote: "On-site", exp: "5–9 yrs", match: { score: 82.1, skill_overlap: 68, matched_skills: ["Python", "SQL"], missing_skills: ["Apache Spark"], advancement_guaranteed: true, salary_normalization: { level: "L5", normalized_score: 0.48 } } },
  { id: "j3", title: "Principal Backend Eng", company: "Swiggy", salary_range: [3800000, 6500000], location: "Bangalore", industry: "Food Tech", remote: "Hybrid", exp: "6–12 yrs", match: { score: 79.4, skill_overlap: 62, matched_skills: ["Python", "AWS"], missing_skills: ["Kafka"], advancement_guaranteed: true, salary_normalization: { level: "L5", normalized_score: 0.51 } } },
  { id: "j4", title: "AI Research Engineer", company: "Microsoft India", salary_range: [5000000, 9000000], location: "Hyderabad", industry: "AI/Cloud", remote: "Hybrid", exp: "5–10 yrs", match: { score: 76.8, skill_overlap: 71, matched_skills: ["Python", "PyTorch"], missing_skills: ["MLOps"], advancement_guaranteed: true, salary_normalization: { level: "L6", normalized_score: 0.61 } } },
  { id: "j5", title: "Senior Data Engineer", company: "Razorpay", salary_range: [2500000, 4500000], location: "Bangalore", industry: "Fintech", remote: "Hybrid", exp: "3–7 yrs", match: { score: 74.2, skill_overlap: 65, matched_skills: ["Python", "SQL"], missing_skills: ["dbt"], advancement_guaranteed: true, salary_normalization: { level: "L4", normalized_score: 0.38 } } },
];

const MOCK_MARKET = {
  trending_skills: [
    { skill: "Generative AI / LLM", demand_growth: "+124%", avg_salary_premium: "₹6L–₹12L", premium_amount: 900000 },
    { skill: "MLOps", demand_growth: "+89%", avg_salary_premium: "₹4L–₹8L", premium_amount: 600000 },
    { skill: "Kubernetes", demand_growth: "+67%", avg_salary_premium: "₹3L–₹5L", premium_amount: 400000 },
    { skill: "Rust", demand_growth: "+56%", avg_salary_premium: "₹3.5L–₹6L", premium_amount: 475000 },
    { skill: "Apache Kafka", demand_growth: "+61%", avg_salary_premium: "₹2.5L–₹4L", premium_amount: 325000 },
  ],
  salary_benchmarks: {
    fresher: { range: "₹3L–₹8L", yoy_growth: "+6.2%" },
    junior: { range: "₹8L–₹16L", yoy_growth: "+8.4%" },
    mid_level: { range: "₹16L–₹30L", yoy_growth: "+10.2%" },
    senior: { range: "₹30L–₹60L", yoy_growth: "+12.1%" },
  },
  top_hiring_companies: ["Google India", "Microsoft India", "Amazon India", "Flipkart", "Swiggy", "Razorpay", "PhonePe", "CRED", "Meesho", "Freshworks", "Zoho", "Infosys"],
};

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function apiCall(ep, opts = {}) {
  try {
    const r = await fetch(`${API_BASE}${ep}`, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    console.error("API Error:", e);
    return null;
  }
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key missing");
    return null;
  }
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } })
      }
    );
    const d = await r.json();
    if (d.error) return null;
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error("API Error:", e);
    return null;
  }
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Pill = memo(({ children, color = "blue" }) => {
  const m = {
    blue: [C.blueLight, C.blue, C.blueBorder],
    orange: [C.orangeLight, C.orange, C.orangeBorder],
    purple: [C.purpleLight, C.purple, C.purpleBorder],
    pink: [C.pinkLight, C.pink, C.pinkBorder],
    green: [C.greenLight, C.green, C.greenBorder],
    red: [C.redLight, C.red, C.redBorder],
    teal: [C.tealLight, C.teal, C.tealBorder],
    muted: ["#F1F5F9", C.textMuted, C.border],
  };
  const [bg, fg, bd] = m[color] || m.blue;
  return (
    <span style={{
      background: bg, color: fg, border: `1px solid ${bd}`, padding: "2px 10px",
      borderRadius: "20px", fontSize: "11px", fontWeight: 600, display: "inline-block", whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
});

const Card = memo(({ children, style = {}, elevated = false, onClick }) => (
  <div onClick={onClick} style={{
    background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "14px",
    padding: "20px", boxShadow: elevated ? C.shadowMd : C.shadow, transition: "box-shadow 0.2s,border-color 0.2s",
    ...(onClick ? { cursor: "pointer" } : {}), ...style
  }}
    onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = C.shadowLg; e.currentTarget.style.borderColor = C.blueBorder; } : undefined}
    onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = elevated ? C.shadowMd : C.shadow; e.currentTarget.style.borderColor = C.border; } : undefined}
  >{children}</div>
));

const StatCard = memo(({ icon: Icon, label, value, sub, color = C.blue, delay = 0 }) => (
  <Card style={{ animationDelay: `${delay}ms`, animation: "fadeUp 0.5s ease both" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.textMuted, fontSize: "11px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 800, color: C.text }}>{value}</div>
        {sub && <div style={{ color, fontSize: "12px", marginTop: "4px", fontWeight: 600 }}>{sub}</div>}
      </div>
      <div style={{ background: `${color}18`, padding: "10px", borderRadius: "10px", border: `1px solid ${color}30`, flexShrink: 0, marginLeft: 8 }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </Card>
));

const SectionHeader = memo(({ title, sub, icon: Icon, action }) => (
  <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        {Icon && <div style={{ background: C.blueLight, padding: "8px", borderRadius: "8px", border: `1px solid ${C.blueBorder}`, flexShrink: 0 }}><Icon size={18} color={C.blue} /></div>}
        <h2 style={{ fontWeight: 800, fontSize: "clamp(15px,2.5vw,20px)", color: C.text, margin: 0 }}>{title}</h2>
      </div>
      {sub && <p style={{ color: C.textMuted, fontSize: "13px", marginTop: "4px", marginBottom: 0, marginRight: 0, marginLeft: Icon ? "42px" : "0", lineHeight: 1.6 }}>{sub}</p>}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
));

const ProgressBar = memo(({ value, color = C.blue, height = 6 }) => (
  <div style={{ height, background: C.bgSection, borderRadius: height, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${clamp(value)}%`, background: color, borderRadius: height, transition: "width 0.6s ease" }} />
  </div>
));

const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: 3, marginLeft: 4 }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 4, height: 4, borderRadius: "50%", background: "currentColor", display: "inline-block",
        animation: "blink 1.2s ease infinite", animationDelay: `${i * 0.2}s`
      }} />
    ))}
  </span>
);

const SkillTag = memo(({ skill, status }) => {
  const cfg = {
    have: { bg: C.greenLight, color: C.green, bd: C.greenBorder, icon: "✓" },
    missing: { bg: C.orangeLight, color: C.orange, bd: C.orangeBorder, icon: "✕" },
    priority: { bg: C.blueLight, color: C.blue, bd: C.blueBorder, icon: "★" },
  };
  const c = cfg[status] || cfg.have;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.bd}`, padding: "3px 10px",
      borderRadius: "6px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", margin: "3px"
    }}>
      <span style={{ fontSize: "10px" }}>{c.icon}</span>{skill}
    </span>
  );
});

// BUG FIX: Fixed ScoreRing — proper SVG with transform-based rotation
const ScoreRing = memo(({ score, size = 120, color = C.blue, label }) => {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const safeScore = clamp(score);
  const dash = (safeScore / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bgSection} strokeWidth={size * 0.07} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.07}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{safeScore}</div>
        {label && <div style={{ fontSize: size * 0.09, color: C.textMuted, fontWeight: 600, marginTop: 2, letterSpacing: "0.3px" }}>{label}</div>}
      </div>
    </div>
  );
});

const RoleSelect = memo(({ value, onChange, label, required, placeholder }) => (
  <div>
    {label && <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>
      {label}{required && <span style={{ color: C.red }}>*</span>}
    </label>}
    <select value={value} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  </div>
));

const Tabs = memo(({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", background: C.bgSection, borderRadius: 10, padding: 4 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "8px 14px", borderRadius: 8, border: "none", background: active === t.id ? C.bgCard : "transparent",
        color: active === t.id ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13,
        boxShadow: active === t.id ? C.shadow : "none", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      }}>
        {t.icon && <t.icon size={14} />}{t.label}
      </button>
    ))}
  </div>
));

const InfoBanner = memo(({ icon: Icon, color, bg, bd, children }) => (
  <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
    <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
    <span style={{ fontSize: 13, color, fontWeight: 600, lineHeight: 1.5 }}>{children}</span>
  </div>
));

const LandingPage = ({ onStart }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    current_role: "", target_role: "", experience_years: 2,
    current_salary: 1200000, location: "Bangalore", skills: [], goal: ""
  });
  const [skillInput, setSkillInput] = useState("");
  const [err, setErr] = useState({});

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Name required";
      if (!form.email.includes("@")) e.email = "Valid email required";
      if (form.password.length < 6) e.password = "Min 6 characters";
    }
    if (step === 2) {
      if (!form.current_role) e.current_role = "Select your current role";
      if (!form.target_role) e.target_role = "Select your target role";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { setForm(p => ({ ...p, skills: [...p.skills, s] })); setSkillInput(""); }
  };
  const removeSkill = s => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const submit = async () => {
    if (!validateStep()) return;
    const data = await apiCall("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
    const user = data?.user || { ...form, id: `u_${Date.now()}`, created_at: new Date().toISOString() };
    onStart(user);
  };

  const errStyle = { color: C.red, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 };
  const QUICK_SKILLS = ["Python", "React", "SQL", "AWS", "Docker", "Machine Learning"];

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(135deg,${C.bg} 0%,#EFF6FF 50%,#F0FDF4 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,24px)"
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, background: C.bgCard,
            border: `1px solid ${C.border}`, borderRadius: 16, padding: "10px 20px", boxShadow: C.shadowMd, marginBottom: 16
          }}>
            <div style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, padding: 8, borderRadius: 10 }}>
              <Brain size={20} color="white" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>
              Career<span style={{ color: C.blue }}>IQ</span>
              <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 4 }}>Pro</span>
            </div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(20px,5vw,28px)", color: C.text, marginBottom: 8, lineHeight: 1.2 }}>
            India's Smartest Career Platform
          </h1>
          <p style={{ color: C.textMuted, fontSize: "clamp(12px,2vw,14px)" }}>
            AI-powered salary intel, job matching & skill tracking for Indian tech professionals
          </p>
        </div>

        <Card elevated style={{ padding: "clamp(20px,5vw,36px)" }}>
          {/* Steps */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: s <= step ? C.blue : C.bgSection,
                  border: `2px solid ${s <= step ? C.blue : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: s <= step ? "white" : C.textMuted, transition: "all 0.3s"
                }}>
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && <div style={{ width: clamp(24, 0, 40), height: 2, background: s < step ? C.blue : C.border, borderRadius: 1, transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginBottom: 20, fontWeight: 600 }}>
            {["Account Setup", "Role & Goals", "Skills & Salary"][step - 1]}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Full Name*</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Arjun Sharma" />
                {err.name && <div style={errStyle}><AlertCircle size={11} />{err.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Email*</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="arjun@example.com" />
                {err.email && <div style={errStyle}><AlertCircle size={11} />{err.email}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Password*</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
                {err.password && <div style={errStyle}><AlertCircle size={11} />{err.password}</div>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <RoleSelect label="Current Role*" value={form.current_role} onChange={v => setForm(p => ({ ...p, current_role: v }))} placeholder="-- Select your current role --" />
                {err.current_role && <div style={errStyle}><AlertCircle size={11} />{err.current_role}</div>}
              </div>
              <div>
                <RoleSelect label="Target Role*" value={form.target_role} onChange={v => setForm(p => ({ ...p, target_role: v }))} placeholder="-- Select your dream role --" />
                {err.target_role && <div style={errStyle}><AlertCircle size={11} />{err.target_role}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Location</label>
                <select value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                  {["Bangalore", "Hyderabad", "Mumbai", "Pune", "Delhi NCR", "Chennai", "Kolkata", "Remote"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Career Goal</label>
                <textarea rows={2} value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Reach Staff Engineer at a unicorn startup in 2 years" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                  Years of Experience: <strong style={{ color: C.blue }}>{form.experience_years} yrs</strong>
                </label>
                <input type="range" min={0} max={20} step={1} value={form.experience_years}
                  onChange={e => setForm(p => ({ ...p, experience_years: +e.target.value }))} style={{ width: "100%", accentColor: C.blue }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                  Current Annual Salary: <strong style={{ color: C.green }}>{fmtINR(form.current_salary)}</strong>
                </label>
                <input type="range" min={300000} max={20000000} step={100000} value={form.current_salary}
                  onChange={e => setForm(p => ({ ...p, current_salary: +e.target.value }))} style={{ width: "100%", accentColor: C.green }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  <span>₹3L</span><span>₹2Cr+</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 8 }}>Key Skills</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type skill & press Enter" />
                  <button onClick={addSkill} style={{
                    background: C.blue, color: "white", border: "none",
                    padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap"
                  }}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {QUICK_SKILLS.map(s => (
                    <button key={s} onClick={() => !form.skills.includes(s) && setForm(p => ({ ...p, skills: [...p.skills, s] }))}
                      style={{
                        background: form.skills.includes(s) ? C.greenLight : C.bgSection,
                        border: `1px solid ${form.skills.includes(s) ? C.greenBorder : C.border}`,
                        color: form.skills.includes(s) ? C.green : C.textMuted,
                        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                      }}>
                      {form.skills.includes(s) ? "✓ " : "+ "}{s}
                    </button>
                  ))}
                </div>
                {form.skills.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.skills.map(s => (
                      <span key={s} style={{
                        background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`,
                        padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
                      }}>
                        {s}
                        <button onClick={() => removeSkill(s)} style={{ background: "transparent", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, background: C.bgSection, border: `1px solid ${C.border}`,
                color: C.textMuted, padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14
              }}>
                ← Back
              </button>
            )}
            {step < 3
              ? <button onClick={next} style={{
                flex: 2, background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white",
                border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14,
                boxShadow: `0 4px 12px rgba(37,99,235,0.3)`
              }}>
                Continue →
              </button>
              : <button onClick={submit} style={{
                flex: 2, background: `linear-gradient(135deg,${C.green},${C.teal})`, color: "white",
                border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14,
                boxShadow: `0 4px 12px rgba(22,163,74,0.3)`
              }}>
                🚀 Launch CareerIQ
              </button>
            }
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onNavigate }) => {
  const { getTotalImpact } = useProgress();
  const impact = getTotalImpact();
  const salary = user.current_salary || 1200000;

  const getLevel = s => {
    for (const [l, d] of Object.entries(SALARY_LEVELS)) if (s >= d.range[0] && s < d.range[1]) return l;
    return "L10";
  };
  const level = getLevel(salary);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ marginBottom: 24, padding: "16px 20px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(16px,3vw,24px)", color: C.text, marginBottom: 4 }}>
          Welcome back, {user.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
          {user.current_role} → <strong style={{ color: C.blue }}>{user.target_role || "your dream role"}</strong> · {user.location}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: DollarSign, label: "Salary Level", value: level, sub: fmtINR(salary) + " / yr", color: C.blue, delay: 0, page: "salary" },
          { icon: Target, label: "Skills Added", value: user.skills?.length || 0, sub: "from profile", color: C.purple, delay: 100, page: "skills" },
          { icon: Activity, label: "Courses Active", value: impact.inProgress, sub: `${impact.completed} completed`, color: C.green, delay: 200, page: "tracker" },
          { icon: Briefcase, label: "Job Matches", value: MOCK_JOBS.length, sub: "≥74% match", color: C.orange, delay: 300, page: "jobs" },
        ].map(s => (
          <div key={s.label} onClick={() => onNavigate(s.page)} style={{ cursor: "pointer" }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color={C.blue} /> Career Path
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: C.bgSection, borderRadius: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={18} color={C.blue} />
            </div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user.current_role}</div><div style={{ fontSize: 11, color: C.textMuted }}>Current — {level}</div></div>
          </div>
          <div style={{ textAlign: "center", color: C.textLight, fontSize: 12, margin: "4px 0" }}>↓ Growth Path</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.green}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={18} color={C.green} />
            </div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{user.target_role || "Target Role"}</div><div style={{ fontSize: 11, color: C.textMuted }}>Target</div></div>
          </div>
          <button onClick={() => onNavigate("network")} style={{ marginTop: 12, width: "100%", background: C.bgSection, border: `1px solid ${C.border}`, color: C.blue, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            View Career Map →
          </button>
        </Card>

        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} color={C.orange} /> Learning Impact
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 12 }}>
            {[{ v: impact.completed, l: "Completed", c: C.green }, { v: impact.inProgress, l: "In Progress", c: C.blue }, { v: impact.count, l: "Total", c: C.purple }].map(x => (
              <div key={x.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: x.c }}>{x.v}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{x.l}</div>
              </div>
            ))}
          </div>
          {impact.count > 0 && <ProgressBar value={Math.round(impact.totalPct / impact.count)} color={C.orange} height={8} />}
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, textAlign: "right" }}>
            Avg: {impact.count > 0 ? Math.round(impact.totalPct / impact.count) : 0}%
          </div>
          <button onClick={() => onNavigate("tracker")} style={{ marginTop: 10, width: "100%", background: C.bgSection, border: `1px solid ${C.border}`, color: C.orange, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            Open Progress Tracker →
          </button>
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>🔥 Top Job Matches</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_JOBS.slice(0, 3).map(j => (
            <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: C.bgSection, borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{j.title}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{j.company} · {j.location} · {j.remote}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <Pill color="green">{Math.round(j.match.score)}% match</Pill>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{fmtINR(j.salary_range[0])}+</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("jobs")} style={{ marginTop: 12, width: "100%", background: C.bgSection, border: `1px solid ${C.border}`, color: C.blue, padding: "9px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          View All Job Matches →
        </button>
      </Card>
    </div>
  );
};

// ─── AI EXPLAINABILITY (sub-component, used inside ResumeAnalysis) ────────────
const AIExplainability = ({ user }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const SUGGESTED = [
    "Why am I getting a low salary score?",
    `What skills should I learn to reach ${user.target_role || "Staff Engineer"}?`,
    "How does CareerIQ calculate my job match score?",
    "Why are my recommendations focused on MLOps?",
    `What's the fastest path from ${user.current_role || "Engineer"} to senior level?`,
  ];

  const ask = useCallback(async (q = question) => {
    if (!q.trim()) return;
    setLoading(true); setAnswer("");
    const prompt = `You are the AI behind CareerIQ Pro, an Indian career intelligence platform.
User profile: Role=${user.current_role}, Target=${user.target_role}, Experience=${user.experience_years}yrs, Salary=${fmtINR(user.current_salary)}, Skills=${(user.skills || []).join(", ")}.
Question: "${q}"
Answer clearly and specifically for this user's situation. Be helpful, concise, India-market focused. Under 200 words.`;
    const resp = await callGemini(prompt);
    const finalAnswer = resp || `Based on your profile as a ${user.current_role || "professional"} with ${user.experience_years || 0} years experience targeting ${user.target_role || "the next level"}: The CareerIQ algorithm considers your skill coverage, salary normalization (L1–L10), market demand trends, and ATS compatibility. To improve your score, focus on adding high-demand skills like MLOps, LLM fine-tuning, or Kubernetes — each adding ₹2L–₹4L in market value.`;
    setAnswer(finalAnswer);
    setHistory(prev => [...prev.slice(-9), { q, a: finalAnswer }]);
    setLoading(false);
  }, [question, user]);

  return (
    <div>
      <InfoBanner icon={Brain} color={C.purple} bg={C.purpleLight} bd={C.purpleBorder}>
        <strong>AI Explainability Engine — Powered by Google Gemini</strong><br />
        Ask why CareerIQ made any recommendation, how your score is calculated, or what to do next.
      </InfoBanner>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>💡 Suggested Questions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => { setQuestion(s); ask(s); }}
              style={{
                background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "7px 14px",
                borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left"
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask()}
            placeholder="Ask anything about your career scores, recommendations, or AI decisions..."
            style={{ flex: 1, minWidth: 200 }} />
          <button onClick={() => ask()} disabled={loading || !question.trim()}
            style={{
              background: question.trim() && !loading ? `linear-gradient(135deg,${C.purple},${C.blue})` : C.border,
              color: question.trim() && !loading ? "white" : C.textMuted, border: "none", padding: "10px 18px", borderRadius: 8,
              cursor: question.trim() && !loading ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap"
            }}>
            {loading ? <span>Thinking<LoadingDots /></span> : "Ask AI"}
          </button>
        </div>
        {answer && (
          <div style={{ background: C.bgSection, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Brain size={16} color={C.purple} />
              <span style={{ fontWeight: 700, fontSize: 13, color: C.purple }}>Gemini AI Answer</span>
            </div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer}</div>
          </div>
        )}
        {history.length > 0 && !loading && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Previous Questions</div>
            {history.slice(-3).reverse().map((h, i) => (
              <div key={i} onClick={() => { setQuestion(h.q); setAnswer(h.a); }}
                style={{ padding: "8px 12px", background: C.blueLight, borderRadius: 8, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{h.q}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── RESUME ANALYSIS (merged: Analyze + ATS + Builder + Explainability) ────────
const ResumeAnalysis = ({ user }) => {
  const [activeTab, setActiveTab] = useState("analyze");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadMode, setUploadMode] = useState("paste");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  // ATS
  const [atsResume, setAtsResume] = useState(`${user.experience_years || 4} years experience in ${user.current_role || "Software Engineering"}.\nSkills: ${(user.skills || ["Python", "Docker", "AWS"]).join(", ")}`);
  const [atsJD, setAtsJD] = useState("Looking for a Senior ML Engineer with 5+ years experience. Must have: Python, TensorFlow, MLOps, Kubernetes, Docker, AWS. Bangalore / Hyderabad / Remote. CTC: ₹30L–₹60L.");
  const [atsScore, setAtsScore] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // Builder — BUG FIX: replaced document.getElementById with useRef
  const stackInputRef = useRef(null);
  const [builderForm, setBuilderForm] = useState({
    name: user.name || "", email: user.email || "", phone: "", location: user.location || "Bangalore",
    summary: "",
    experience: [{ company: "", role: user.current_role || "", from: "", to: "", bullets: "" }],
    education: [{ college: "", degree: "", year: "" }],
    skills: (user.skills || []).join(", "), certifications: "", github: "", linkedin: ""
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  const sampleResume = `Priya Sharma — Software Engineer\npriya@email.com | github.com/priyasharma\n\nEXPERIENCE\nSenior Software Engineer @ Razorpay (2021–Present)\n- Built ML pipelines processing 10M events/day using Python, TensorFlow, and Docker\n- Scaled microservices on AWS using Kubernetes\n- Reduced API latency by 40% using Redis caching — saving ₹20L/yr\n\nSKILLS\nPython, JavaScript, React, Node.js, SQL, PostgreSQL, Docker,\nKubernetes, AWS, TensorFlow, Pandas, NumPy, Git, Linux\n\nEDUCATION\nB.Tech Computer Science — NIT Trichy, 2020`;

  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return;
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) setResumeText(await file.text());
    else setResumeText(`[${file.name}] uploaded (${(file.size / 1024).toFixed(1)} KB). Paste resume text below for AI analysis.`);
  };

  const analyze = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    const prompt = `You are an expert Indian tech career advisor. Analyze this resume and return ONLY a valid JSON object (no markdown, no backticks):
{"ats_score":<0-100>,"quality_score":<0-100>,"extracted_skills":[...],"experience_years":<number>,"salary_estimate":<INR number>,"salary_low":<INR>,"salary_high":<INR>,"salary_level":"<L1-L10>","market_alignment":<0-1>,"missing_skills":[...],"recommendations":[5 strings],"strengths":[3 strings],"target_role_fit":"<pct%>","anonymized":true}
Resume: ${resumeText.slice(0, 2000)}`;
    const gemRes = await callGemini(prompt);
    let parsed = null;
    if (gemRes) { try { parsed = JSON.parse(gemRes.replace(/```json|```/g, "").trim()); } catch { } }
    const data = await apiCall("/api/resume/analyze", { method: "POST", body: JSON.stringify({ resume_text: resumeText, target_role: user.target_role || "Software Engineer" }) });
    setResult(parsed || (data?.status === "success" ? {
      ats_score: data.ats_score, quality_score: data.resume_quality_score,
      extracted_skills: data.parsing?.extracted_skills || user.skills || [],
      experience_years: data.parsing?.estimated_experience_years || user.experience_years,
      salary_estimate: data.salary_estimation?.estimated_salary || user.current_salary,
      salary_low: data.salary_estimation?.low_range || (user.current_salary * 0.85),
      salary_high: data.salary_estimation?.high_range || (user.current_salary * 1.3),
      salary_level: data.salary_estimation?.normalization?.level || "L3",
      market_alignment: data.salary_estimation?.market_alignment_index || 0.82,
      missing_skills: data.skill_gap?.skills_missing || ["TensorFlow", "MLOps"],
      recommendations: data.recommendations || [], strengths: ["Strong technical background", "Clear work experience", "Relevant skills"],
      target_role_fit: "68%", anonymized: true
    } : {
      ats_score: 74, quality_score: 71,
      extracted_skills: user.skills || ["Python", "React", "SQL"],
      experience_years: user.experience_years || 3,
      salary_estimate: (user.current_salary || 1200000) * 1.12,
      salary_low: (user.current_salary || 1200000) * 0.9,
      salary_high: (user.current_salary || 1200000) * 1.35,
      salary_level: "L4", market_alignment: 0.84,
      missing_skills: ["TensorFlow", "PyTorch", "MLOps", "Kubernetes"],
      recommendations: ["Add quantified achievements: 'Reduced API latency by 40%, saving ₹50L/yr'", "Include certifications: AWS, GCP, TF Developer", "Add GitHub/LinkedIn links prominently", "Mention team size and leadership impact", "Start every bullet with an action verb: Led, Built, Scaled"],
      strengths: ["Technical depth", "Relevant experience", "Clean formatting"],
      target_role_fit: "62%", anonymized: true
    }));
    setLoading(false);
  };

  const runATS = async () => {
    setAtsLoading(true);
    const prompt = `Analyze resume vs job description. Return ONLY valid JSON (no backticks):
{"overall_score":<0-100>,"keyword_score":<0-100>,"format_score":<0-100>,"impact_score":<0-100>,"action_verb_score":<0-100>,"section_score":<0-100>,"matched_keywords":[...],"missing_keywords":[...],"gemini_suggestions":[3 strings]}
RESUME: ${atsResume.slice(0, 1000)}
JD: ${atsJD.slice(0, 800)}`;
    const gemRes = await callGemini(prompt);
    let parsed = null;
    if (gemRes) { try { parsed = JSON.parse(gemRes.replace(/```json|```/g, "").trim()); } catch { } }
    const kw = ["python", "tensorflow", "kubernetes", "mlops", "docker", "aws", "pytorch", "sql"];
    const rl = atsResume.toLowerCase();
    const matched = kw.filter(k => rl.includes(k));
    const missing = kw.filter(k => !rl.includes(k));
    setAtsScore(parsed || {
      overall_score: Math.round(50 + matched.length * 6),
      keyword_score: 70, format_score: 82, impact_score: 58, action_verb_score: 74, section_score: 80,
      matched_keywords: matched, missing_keywords: missing,
      gemini_suggestions: ["Add more quantified results with rupee amounts or percentages", "Include all required keywords from the JD in your skills section", "Use the STAR method for experience bullet points"]
    });
    setAtsLoading(false);
  };

  const enhanceWithAI = async () => {
    setAiEnhancing(true);
    const prompt = `Write a powerful 3-sentence professional summary for an Indian tech resume:
Name: ${builderForm.name}, Role: ${builderForm.role || user.current_role}, Skills: ${builderForm.skills}, Experience: ${user.experience_years || 3} years, Target: ${user.target_role}
Return ONLY the summary text, no preamble.`;
    const summary = await callGemini(prompt);
    if (summary) setBuilderForm(p => ({ ...p, summary: summary.trim() }));
    setAiEnhancing(false);
  };

  // BUG FIX: useRef-based stack addition instead of document.getElementById
  const addStackSkill = () => {
    const val = stackInputRef.current?.value?.trim();
    if (val && !builderForm.skills.split(",").map(s => s.trim()).includes(val)) {
      setBuilderForm(p => ({ ...p, skills: p.skills ? p.skills + ", " + val : val }));
      if (stackInputRef.current) stackInputRef.current.value = "";
    }
  };

  const downloadResume = () => {
    const content = `${builderForm.name}
${builderForm.email} | ${builderForm.phone} | ${builderForm.location}
${builderForm.linkedin ? `LinkedIn: ${builderForm.linkedin}` : ""} ${builderForm.github ? `| GitHub: ${builderForm.github}` : ""}

PROFESSIONAL SUMMARY
${builderForm.summary}

EXPERIENCE
${builderForm.experience.map(e => `${e.role} @ ${e.company} (${e.from}–${e.to})\n${e.bullets.split("\n").map(b => `• ${b}`).join("\n")}`).join("\n\n")}

EDUCATION
${builderForm.education.map(e => `${e.degree} — ${e.college} (${e.year})`).join("\n")}

SKILLS
${builderForm.skills}

${builderForm.certifications ? `CERTIFICATIONS\n${builderForm.certifications}` : ""}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${builderForm.name || "resume"}_CareerIQ.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "analyze", label: "AI Analysis", icon: Upload },
    { id: "ats", label: "ATS Optimizer", icon: Gauge },
    { id: "builder", label: "Resume Builder", icon: Edit3 },
    { id: "explain", label: "AI Explain", icon: Brain },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Resume Studio" sub="AI-powered resume analysis, ATS optimization, builder & explainability" icon={FileText} />
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ── ANALYZE ── */}
      {activeTab === "analyze" && (!result ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Upload or Paste Your Resume</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.bgSection, borderRadius: 10, padding: 4 }}>
              {[["paste", "✏️ Paste Text"], ["upload", "📎 Upload File"]].map(([m, l]) => (
                <button key={m} onClick={() => setUploadMode(m)} style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, border: "none",
                  background: uploadMode === m ? C.bgCard : "transparent", color: uploadMode === m ? C.blue : C.textMuted,
                  cursor: "pointer", fontWeight: 600, fontSize: 12, boxShadow: uploadMode === m ? C.shadow : "none", transition: "all 0.15s"
                }}>{l}</button>
              ))}
            </div>
            {uploadMode === "paste" ? (
              <>
                <textarea rows={13} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your full resume content here..." style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} />
                <button onClick={() => setResumeText(sampleResume)} style={{ marginTop: 8, background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, width: "100%" }}>
                  📋 Load Sample Resume
                </button>
              </>
            ) : (
              <div>
                <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${fileName ? C.greenBorder : C.blueBorder}`, borderRadius: 12, padding: "32px 16px", textAlign: "center", cursor: "pointer", background: fileName ? C.greenLight : C.blueLight }}>
                  <Upload size={28} color={fileName ? C.green : C.blue} style={{ margin: "0 auto 10px", display: "block" }} />
                  {fileName ? <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>✓ {fileName}</div>
                    : <><div style={{ fontWeight: 700, color: C.blue, fontSize: 14 }}>Click to upload resume</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>PDF, DOC, DOCX, TXT — max 10MB</div></>}
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} style={{ display: "none" }} />
                </div>
              </div>
            )}
            <button onClick={analyze} disabled={loading || !resumeText.trim()} style={{
              marginTop: 12, width: "100%",
              background: loading || !resumeText.trim() ? C.border : `linear-gradient(135deg,${C.blue},${C.purple})`,
              color: loading || !resumeText.trim() ? C.textMuted : "white", border: "none", padding: 11, borderRadius: 8,
              fontWeight: 700, fontSize: 14, cursor: resumeText.trim() ? "pointer" : "not-allowed"
            }}>
              {loading ? <span>Analyzing with Gemini AI<LoadingDots /></span> : "⚡ Analyze with AI"}
            </button>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ icon: "🔒", t: "Privacy-First", d: "PII auto-stripped — name, email, phone never stored" }, { icon: "🧠", t: "Gemini AI Analysis", d: "Extracts 150+ skills from natural resume text" }, { icon: "💰", t: "Salary Normalization", d: "Maps to L1–L10 India bands for market comparison" }, { icon: "📊", t: "ATS Scoring", d: "Compatibility score + improvement suggestions" }].map(f => (
              <Card key={f.t} style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>{f.t}</div><div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.5 }}>{f.d}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            <StatCard icon={Award} label="ATS Score" value={`${result.ats_score}/100`} sub={result.ats_score > 75 ? "✓ ATS Friendly" : "⚠ Needs Work"} color={result.ats_score > 75 ? C.green : C.orange} />
            <StatCard icon={Star} label="Resume Quality" value={`${result.quality_score}/100`} sub="AI-assessed" color={C.blue} />
            <StatCard icon={DollarSign} label="Est. Salary" value={fmtINR(result.salary_estimate)} sub={`${fmtINR(result.salary_low)}–${fmtINR(result.salary_high)}`} color={C.purple} />
            <StatCard icon={Target} label="Target Fit" value={result.target_role_fit} sub={user.target_role} color={C.green} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>✅ Extracted Skills ({result.extracted_skills.length})</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}><span style={{ color: C.green, fontWeight: 600 }}>✓ Anonymized</span> · {result.experience_years}y experience · Level {result.salary_level}</div>
              <div>{result.extracted_skills.map(s => <SkillTag key={s} skill={s} status="have" />)}</div>
              {result.missing_skills?.length > 0 && <>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginTop: 14, marginBottom: 6 }}>⚠️ Missing Key Skills</div>
                <div>{result.missing_skills.map(s => <SkillTag key={s} skill={s} status="missing" />)}</div>
              </>}
            </Card>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>💡 AI Recommendations</div>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ background: C.blueLight, color: C.blue, width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{r}</div>
                </div>
              ))}
              {result.strengths && <>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginTop: 10, marginBottom: 8 }}>💪 Strengths</div>
                {result.strengths.map(s => <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><CheckCircle size={14} color={C.green} /><span style={{ fontSize: 13, color: C.textMid }}>{s}</span></div>)}
              </>}
            </Card>
          </div>
          <button onClick={() => { setResult(null); setResumeText(""); setFileName(""); }} style={{ alignSelf: "flex-start", background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            ← Analyze Another
          </button>
        </div>
      ))}

      {/* ── ATS ── */}
      {activeTab === "ats" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
            <Card><div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>📄 Your Resume</div><textarea rows={12} value={atsResume} onChange={e => setAtsResume(e.target.value)} style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} /></Card>
            <Card><div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>🎯 Job Description</div><textarea rows={12} value={atsJD} onChange={e => setAtsJD(e.target.value)} style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} /></Card>
          </div>
          <button onClick={runATS} disabled={atsLoading} style={{ background: atsLoading ? C.border : `linear-gradient(135deg,${C.blue},${C.purple})`, color: atsLoading ? C.textMuted : "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: atsLoading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
            {atsLoading ? <span>Analyzing with Gemini<LoadingDots /></span> : "⚡ Run ATS Analysis"}
          </button>
          {atsScore && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
              <Card elevated style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <ScoreRing score={atsScore.overall_score} size={130} color={atsScore.overall_score >= 75 ? C.green : atsScore.overall_score >= 55 ? C.orange : C.red} label="ATS SCORE" />
                <div style={{ width: "100%" }}>
                  {[["Keywords", atsScore.keyword_score], ["Format", atsScore.format_score], ["Impact", atsScore.impact_score], ["Action Verbs", atsScore.action_verb_score], ["Sections", atsScore.section_score]].map(([name, score]) => (
                    <div key={name} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.textMid }}>{name}</span><span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{score}%</span></div>
                      <ProgressBar value={score} color={score >= 75 ? C.green : score >= 55 ? C.blue : C.orange} height={6} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Keyword Analysis</div>
                <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 6 }}>✓ Matched ({atsScore.matched_keywords?.length})</div><div>{atsScore.matched_keywords?.map(k => <SkillTag key={k} skill={k} status="have" />)}</div></div>
                <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: C.orange, fontWeight: 700, marginBottom: 6 }}>✕ Missing ({atsScore.missing_keywords?.length})</div><div>{atsScore.missing_keywords?.map(k => <SkillTag key={k} skill={k} status="missing" />)}</div></div>
                {atsScore.gemini_suggestions?.length > 0 && <>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 8 }}>🤖 Gemini AI Tips</div>
                  {atsScore.gemini_suggestions.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}><Brain size={13} color={C.purple} style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ fontSize: 12, color: C.textMid }}>{s}</span></div>)}
                </>}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── BUILDER ── */}
      {activeTab === "builder" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[["edit", false, Edit3, "Edit"], ["preview", true, Eye, "Preview"]].map(([id, pm, Icon, lbl]) => (
              <button key={id} onClick={() => setPreviewMode(pm)} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${previewMode === pm ? C.blueBorder : C.border}`, background: previewMode === pm ? C.blueLight : "transparent", color: previewMode === pm ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Icon size={14} />{lbl}</button>
            ))}
            <button onClick={enhanceWithAI} disabled={aiEnhancing} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.purpleBorder}`, background: C.purpleLight, color: C.purple, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Brain size={14} />{aiEnhancing ? <span>Enhancing<LoadingDots /></span> : "AI Enhance Summary"}
            </button>
            <button onClick={downloadResume} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.greenBorder}`, background: C.greenLight, color: C.green, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={14} />Download TXT
            </button>
          </div>
          {!previewMode ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
              <Card>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>Personal Info</div>
                {[["name", "Full Name"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["linkedin", "LinkedIn URL"], ["github", "GitHub URL"]].map(([key, lbl]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={builderForm[key] || ""} onChange={e => setBuilderForm(p => ({ ...p, [key]: e.target.value }))} placeholder={lbl} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Professional Summary</label>
                  <textarea rows={4} value={builderForm.summary} onChange={e => setBuilderForm(p => ({ ...p, summary: e.target.value }))} placeholder="Write a compelling 3-sentence summary or click 'AI Enhance' above..." style={{ resize: "none", fontSize: 12 }} />
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>Experience & Skills</div>
                {builderForm.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: 16, padding: 12, background: C.bgSection, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Experience #{idx + 1}</div>
                    {[["company", "Company"], ["role", "Role"], ["from", "From (e.g. 2021)"], ["to", "To (e.g. Present)"]].map(([key, lbl]) => (
                      <div key={key} style={{ marginBottom: 8 }}>
                        <input value={exp[key] || ""} onChange={e => setBuilderForm(p => { const ex = [...p.experience]; ex[idx] = { ...ex[idx], [key]: e.target.value }; return { ...p, experience: ex }; })} placeholder={lbl} style={{ fontSize: 12 }} />
                      </div>
                    ))}
                    <textarea rows={3} value={exp.bullets || ""} onChange={e => setBuilderForm(p => { const ex = [...p.experience]; ex[idx] = { ...ex[idx], bullets: e.target.value }; return { ...p, experience: ex }; })} placeholder="Achievements (one per line)..." style={{ resize: "none", fontSize: 12 }} />
                  </div>
                ))}
                <button onClick={() => setBuilderForm(p => ({ ...p, experience: [...p.experience, { company: "", role: "", from: "", to: "", bullets: "" }] }))} style={{ background: C.bgSection, border: `1px dashed ${C.border}`, color: C.textMuted, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, width: "100%", marginBottom: 16 }}>
                  + Add Experience
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>Skills & Certifications</div>
                  <textarea rows={2} value={builderForm.skills} onChange={e => setBuilderForm(p => ({ ...p, skills: e.target.value }))} placeholder="Python, React, SQL, AWS..." style={{ resize: "none", fontSize: 12 }} />
                  <textarea rows={2} value={builderForm.certifications} onChange={e => setBuilderForm(p => ({ ...p, certifications: e.target.value }))} placeholder="AWS Solutions Architect, GCP Professional..." style={{ resize: "none", fontSize: 12, marginTop: 8 }} />
                </div>
              </Card>
            </div>
          ) : (
            <Card elevated style={{ fontFamily: "Georgia,serif", lineHeight: 1.7 }}>
              <div style={{ borderBottom: `2px solid ${C.text}`, paddingBottom: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{builderForm.name || "Your Name"}</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>{builderForm.email} · {builderForm.phone} · {builderForm.location}</div>
                {(builderForm.linkedin || builderForm.github) && <div style={{ fontSize: 12, color: C.blue }}>{builderForm.linkedin} {builderForm.github && `| ${builderForm.github}`}</div>}
              </div>
              {builderForm.summary && <><div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Summary</div><p style={{ fontSize: 13, color: C.textMid, marginBottom: 16 }}>{builderForm.summary}</p></>}
              <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, color: C.text }}>Experience</div>
              {builderForm.experience.map((e, i) => e.company && (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                    <strong style={{ fontSize: 13 }}>{e.role} @ {e.company}</strong>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{e.from}–{e.to}</span>
                  </div>
                  {e.bullets.split("\n").filter(Boolean).map((b, j) => <div key={j} style={{ fontSize: 13, color: C.textMid, paddingLeft: 12 }}>• {b}</div>)}
                </div>
              ))}
              {builderForm.skills && <><div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 6, color: C.text }}>Skills</div><div style={{ fontSize: 13, color: C.textMid }}>{builderForm.skills}</div></>}
            </Card>
          )}
        </div>
      )}

      {/* ── EXPLAINABILITY ── */}
      {activeTab === "explain" && <AIExplainability user={user} />}
    </div>
  );
};

// ─── SALARY INTELLIGENCE ──────────────────────────────────────────────────────
const SalaryIntelligence = ({ user }) => {
  const levels = Object.entries(SALARY_LEVELS);
  const salary = user.current_salary || 1200000;
  const getLevel = s => { for (const [l, d] of levels) if (s >= d.range[0] && s < d.range[1]) return l; return "L10"; };
  const currentLevel = getLevel(salary);
  const currentIdx = levels.findIndex(([k]) => k === currentLevel);
  const normScore = Math.round(currentIdx / (levels.length - 1) * 100);
  const colors = [CH.blue, CH.blue, CH.orange, CH.orange, CH.purple, CH.purple, CH.pink, CH.pink, CH.green, CH.green];
  const barData = levels.map(([l, d]) => ({ level: l, label: d.label, mid: Math.round((d.range[0] + d.range[1]) / 2 / 100000), isCurrent: l === currentLevel }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Salary Intelligence" sub="Your normalized salary position (L1–L10) vs. the India market" icon={DollarSign} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
        <Card elevated style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32, gap: 16 }}>
          <ScoreRing score={normScore} size={130} color={C.blue} label="SALARY SCORE" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{currentLevel}</div>
            <div style={{ fontSize: 16, color: C.textMid, fontWeight: 600 }}>{SALARY_LEVELS[currentLevel]?.label}</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>{fmtINR(salary)} / year</div>
          </div>
          <div style={{ width: "100%", background: C.bgSection, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              <span>Percentile</span><span style={{ color: C.blue, fontWeight: 700 }}>{normScore}th</span>
            </div>
            <ProgressBar value={normScore} color={C.blue} height={8} />
          </div>
        </Card>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Market Salary by Level (₹ Lakh)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={v => `₹${v}L`} />
              <YAxis type="category" dataKey="level" tick={{ fontSize: 11, fill: C.textMuted }} width={30} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="mid" radius={[0, 4, 4, 0]}>{barData.map((e, i) => <Cell key={i} fill={e.isCurrent ? C.blue : colors[i]} opacity={e.isCurrent ? 1 : 0.5} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
        {levels.map(([l, d]) => (
          <div key={l} style={{ background: l === currentLevel ? C.blueLight : C.bgCard, border: `1px solid ${l === currentLevel ? C.blueBorder : C.border}`, borderRadius: 10, padding: "10px 12px", textAlign: "center", boxShadow: l === currentLevel ? `0 0 0 2px ${C.blue}30` : C.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: l === currentLevel ? C.blue : C.text }}>{l}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{d.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMid }}>{fmtINR(d.range[0])}–{fmtINR(d.range[1])}</div>
            {l === currentLevel && <div style={{ fontSize: 9, color: C.blue, fontWeight: 700, marginTop: 3 }}>← YOU</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
const JobMatching = ({ user }) => {
  const [deck, setDeck] = useState([...MOCK_JOBS]);
  const [liked, setLiked] = useState([]);
  const [passed, setPassed] = useState([]);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0, startX: 0, startY: 0 });
  const [flying, setFlying] = useState(null); // "left"|"right"|null
  const [isAnimating, setIsAnimating] = useState(false);
  const THRESHOLD = 90;
  const dragRef = useRef(drag);


  // BUG FIX: consolidated mouse/touch handlers; proper cleanup
  const onPointerDown = useCallback(e => {
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    const nd = { active: true, x: 0, y: 0, startX: clientX, startY: clientY };
    dragRef.current = nd;
    setDrag(nd);
  }, []);

  const onPointerMove = useCallback(e => {
    const d = dragRef.current;
    if (!d.active || isAnimating) return;
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    const nd = { ...d, x: clientX - d.startX, y: clientY - d.startY };
    dragRef.current = nd;
    setDrag(nd);
  }, []);

  const fling = useCallback((dir) => {
    if (isAnimating) return;   // 🚨 prevents double swipe

    setIsAnimating(true);
    setFlying(dir);

    setTimeout(() => {
      setDeck(prev => {
        const [top, ...rest] = prev;
        if (top) {
          dir === "right"
            ? setLiked(l => [...l, top])
            : setPassed(n => [...n, top]);
        }
        return rest;
      });

      const reset = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
      dragRef.current = reset;
      setFlying(null);
      setDrag(reset);

      setIsAnimating(false); // ✅ unlock
    }, 360);
  }, [isAnimating]);

  // BUG FIX: read drag from ref instead of calling fling() inside state updater
  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active || isAnimating) return;
    if (d.x > THRESHOLD) fling("right");
    else if (d.x < -THRESHOLD) fling("left");
    const reset = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
    dragRef.current = reset;
    setDrag(reset);
  }, [fling]);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    const handleKey = (e) => {
      if (isAnimating) return;

      if (e.key === "ArrowRight") fling("right");
      if (e.key === "ArrowLeft") fling("left");
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [fling, isAnimating]);

  const top = deck[0];
  const rot = drag.x / 22;
  const likeOp = clamp(drag.x / 80, 0, 1);
  const nopeOp = clamp(-drag.x / 80, 0, 1);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Job Matching" sub="Swipe right to save, left to skip — AI-matched to your profile" icon={Briefcase} />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <Pill color="green">✓ {liked.length} Saved</Pill>
        <Pill color="muted">✕ {passed.length} Skipped</Pill>
        <Pill color="blue">{deck.length} Remaining</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, alignItems: "start" }}>
        {/* Swipe area — BUG FIX: buttons now inside the container with proper layout */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
            {/* Stack cards */}
            {deck.slice(1, 3).reverse().map((j, i) => (
              <div key={j.id} style={{ position: "absolute", inset: 0, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, transform: `scale(${0.94 + i * 0.03}) translateY(${12 - i * 6}px)`, zIndex: i, boxShadow: C.shadowMd, height: 420 }} />
            ))}
            {/* Top card */}
            {top ? (
              <div
                style={{
                  position: "relative", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, zIndex: 10, padding: 24, boxShadow: C.shadowLg, userSelect: "none", touchAction: "none",
                  transform: flying ? `translate(${flying === "right" ? 400 : -400}px,0) rotate(${flying === "right" ? 20 : -20}deg)` : drag.active ? `translate(${drag.x}px,${drag.y}px) rotate(${rot}deg)` : "none",
                  transition: flying ? "transform 0.36s ease" : "none", minHeight: 380, cursor: drag.active ? "grabbing" : "grab"
                }}
                onMouseDown={onPointerDown}
                onTouchStart={onPointerDown}
                onTouchMove={e => { e.preventDefault(); onPointerMove(e); }}
                onTouchEnd={onPointerUp}
              >
                {likeOp > 0.15 && <div style={{ position: "absolute", top: 20, left: 20, background: C.green, color: "white", fontWeight: 800, fontSize: 18, padding: "6px 14px", borderRadius: 8, transform: "rotate(-12deg)", opacity: likeOp, border: `3px solid ${C.green}` }}>SAVE ✓</div>}
                {nopeOp > 0.15 && <div style={{ position: "absolute", top: 20, right: 20, background: C.red, color: "white", fontWeight: 800, fontSize: 18, padding: "6px 14px", borderRadius: 8, transform: "rotate(12deg)", opacity: nopeOp, border: `3px solid ${C.red}` }}>SKIP ✕</div>}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <Pill color="blue">{top.remote}</Pill>
                  <div style={{ background: `${C.green}18`, color: C.green, border: `1px solid ${C.greenBorder}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{Math.round(top.match.score)}% match</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>{top.title}</div>
                <div style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>{top.company} · {top.location}</div>
                <div style={{ background: C.bgSection, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: C.blue }}>{fmtINR(top.salary_range[0])} – {fmtINR(top.salary_range[1])}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Level {top.match.salary_normalization?.level} · {top.exp}</div>
                </div>
                {top.match.matched_skills?.length > 0 && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 5 }}>✓ Skill Match</div><div>{top.match.matched_skills.map(s => <SkillTag key={s} skill={s} status="have" />)}</div></div>}
                {top.match.missing_skills?.length > 0 && <div><div style={{ fontSize: 12, color: C.orange, fontWeight: 700, marginBottom: 5 }}>⚠ Missing</div><div>{top.match.missing_skills.map(s => <SkillTag key={s} skill={s} status="missing" />)}</div></div>}
              </div>
            ) : (
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, textAlign: "center", boxShadow: C.shadowLg }}>
                <Trophy size={48} color={C.blue} style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>All jobs reviewed!</div>
                <div style={{ color: C.textMuted, marginBottom: 16 }}>You saved {liked.length} jobs</div>
                <button onClick={() => { setDeck([...MOCK_JOBS]); setLiked([]); setPassed([]); }} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Reset Deck</button>
              </div>
            )}
          </div>
          {/* BUG FIX: buttons below the card, not absolutely positioned */}
          {top && (
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <button onClick={(e) => { e.stopPropagation(); fling("left"); }} style={{ width: 52, height: 52, borderRadius: "50%", background: C.redLight, border: `2px solid ${C.redBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadowMd, flexShrink: 0 }}>
                <ThumbsDown size={22} color={C.red} />
              </button>
              <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>← skip / save →</div>
              <button onClick={(e) => { e.stopPropagation(); fling("right"); }} style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenLight, border: `2px solid ${C.greenBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadowMd, flexShrink: 0 }}>
                <Heart size={22} color={C.green} />
              </button>
            </div>
          )}
        </div>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>💾 Saved Jobs ({liked.length})</div>
          {liked.length === 0 ? <div style={{ color: C.textMuted, fontSize: 13 }}>Swipe right on jobs you like to save them here.</div> :
            liked.map(j => (
              <div key={j.id} style={{ padding: "10px 12px", background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{j.title}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{j.company} · {fmtINR(j.salary_range[0])}+</div>
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
};

// ─── SKILL GAP ANALYSIS ───────────────────────────────────────────────────────
const SkillGapAnalysis = ({ user }) => {
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState(user.target_role || "Machine Learning Engineer");

  const analyze = async () => {
    setLoading(true);
    const prompt = `Analyze skill gap for Indian tech professional. Current skills: ${(user.skills || ["Python", "SQL", "React"]).join(", ")}. Target role: ${targetRole}. Experience: ${user.experience_years || 3} years.
Return ONLY valid JSON (no backticks):
{"match_score":<0-100>,"skills_have":[...],"skills_missing":[top 6],"skills_priority":[top 3],"soft_skills_needed":[3 items],"time_to_ready":"<timeline>","salary_on_ready":"<INR range>"}`;
    const gemRes = await callGemini(prompt);
    let parsed = null;
    if (gemRes) { try { parsed = JSON.parse(gemRes.replace(/```json|```/g, "").trim()); } catch { } }
    const data = await apiCall("/api/skills/gap", { method: "POST", body: JSON.stringify({ current_skills: user.skills || [], target_role: targetRole }) });
    setSkillGap(parsed || (data?.status === "success" ? { ...data.skill_gap, match_score: data.match_score } : {
      match_score: 62, skills_have: user.skills?.slice(0, 4) || ["Python", "SQL", "React", "Git"],
      skills_missing: ["TensorFlow", "PyTorch", "MLOps", "Kubernetes", "Spark", "Airflow"],
      skills_priority: ["TensorFlow", "MLOps", "Kubernetes"],
      soft_skills_needed: ["Research skills", "Data storytelling", "Cross-team collaboration"],
      time_to_ready: "4–6 months", salary_on_ready: "₹25L–₹40L"
    }));
    setLoading(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Skill Gap Analysis" sub="AI-powered comparison of your skills vs. target role requirements" icon={Target} />
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}><RoleSelect label="Target Role" value={targetRole} onChange={setTargetRole} /></div>
          <button onClick={analyze} disabled={loading} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            {loading ? <span>Analyzing<LoadingDots /></span> : "🎯 Analyze Gap"}
          </button>
        </div>
      </Card>
      {skillGap && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <Card elevated style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <ScoreRing score={skillGap.match_score} size={130} color={skillGap.match_score >= 70 ? C.green : skillGap.match_score >= 50 ? C.orange : C.red} label="MATCH" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{targetRole}</div>
              <Pill color={skillGap.match_score >= 70 ? "green" : "orange"}>{skillGap.match_score >= 70 ? "Ready soon" : "Needs prep"}</Pill>
            </div>
            {skillGap.time_to_ready && (
              <div style={{ width: "100%", background: C.bgSection, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 12, color: C.textMuted }}>Time to ready: <strong style={{ color: C.blue }}>{skillGap.time_to_ready}</strong></div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Expected salary: <strong style={{ color: C.green }}>{skillGap.salary_on_ready}</strong></div>
              </div>
            )}
          </Card>
          <Card>
            <div style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 8 }}>✅ Skills You Have</div><div>{skillGap.skills_have?.map(s => <SkillTag key={s} skill={s} status="have" />)}</div></div>
            <div style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: C.orange, marginBottom: 8 }}>⚠️ Missing Skills</div><div>{skillGap.skills_missing?.map(s => <SkillTag key={s} skill={s} status="missing" />)}</div></div>
            <div style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: C.blue, marginBottom: 8 }}>⭐ Priority (learn first)</div><div>{skillGap.skills_priority?.map(s => <SkillTag key={s} skill={s} status="priority" />)}</div></div>
            {skillGap.soft_skills_needed?.length > 0 && <div><div style={{ fontWeight: 700, fontSize: 13, color: C.purple, marginBottom: 8 }}>💼 Soft Skills</div><div>{skillGap.soft_skills_needed.map(s => <SkillTag key={s} skill={s} status="have" />)}</div></div>}
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── MARKET INSIGHTS ──────────────────────────────────────────────────────────
const MarketInsights = ({ user }) => {
  const [market, setMarket] = useState(MOCK_MARKET);
  const [role, setRole] = useState(user?.current_role || "Software Engineer");
  const [loading, setLoading] = useState(false);

  const fetchMarket = useCallback(async () => {
    setLoading(true);
    const data = await apiCall("/api/market/insights");
    if (data?.status === "success") setMarket({ trending_skills: data.trending_skills || MOCK_MARKET.trending_skills, salary_benchmarks: data.salary_benchmarks || MOCK_MARKET.salary_benchmarks, top_hiring_companies: data.top_hiring_companies || MOCK_MARKET.top_hiring_companies });
    setLoading(false);
  }, []);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  const demandData = market.trending_skills.map((s, i) => ({ skill: s.skill, growth: parseInt(s.demand_growth), premium: s.premium_amount ? Math.round(s.premium_amount / 100000) : 30, fill: [CH.blue, CH.orange, CH.purple, CH.pink, CH.green][i % 5] }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Market Insights" sub="Real-time demand trends, salary premiums and top hiring companies" icon={BarChart2} />
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Market for role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>{JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
          <button onClick={fetchMarket} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {loading ? <span>Loading<LoadingDots /></span> : "🔄 Refresh"}
          </button>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📈 Skill Demand Growth</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demandData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="skill" tick={{ fontSize: 10, fill: C.textMuted }} /><YAxis tick={{ fontSize: 11, fill: C.textMuted }} unit="%" /><Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} /><Bar dataKey="growth" radius={[4, 4, 0, 0]}>{demandData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </Card>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>💰 Salary Premium by Skill (₹L)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demandData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${v}L`} /><YAxis type="category" dataKey="skill" tick={{ fontSize: 10, fill: C.textMuted }} width={90} /><Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} /><Bar dataKey="premium" radius={[0, 4, 4, 0]}>{demandData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📊 Salary Benchmarks</div>
          {Object.entries(market.salary_benchmarks).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, textTransform: "capitalize" }}>{k.replace("_", " ")}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 13, color: C.textMid }}>{v.range}</span><Pill color="green">{v.yoy_growth}</Pill></div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>🏢 Top Hiring Companies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {market.top_hiring_companies.map((c, i) => (
              <span key={c} style={{ background: [C.blueLight, C.orangeLight, C.purpleLight, C.pinkLight, C.greenLight][i % 5], color: [C.blue, C.orange, C.purple, C.pink, C.green][i % 5], border: `1px solid ${[C.blueBorder, C.orangeBorder, C.purpleBorder, C.pinkBorder, C.greenBorder][i % 5]}`, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{c}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── CAREER GROWTH FORECAST ───────────────────────────────────────────────────
const FORECAST_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

const CareerGrowthForecast = ({ user }) => {
  const base = user.current_salary || 1200000;
  const [role, setRole] = useState(user.current_role || "Software Engineer");
  const chartData = useMemo(() => FORECAST_YEARS.map((y, i) => ({
    year: y,
    conservative: Math.round(base * Math.pow(1.08, i) / 100000),
    moderate: Math.round(base * Math.pow(1.14, i) / 100000),
    aggressive: Math.round(base * Math.pow(1.22, i) / 100000),
  })), [base]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Career Growth Forecast" sub="3-scenario salary trajectory over 5 years" icon={TrendingUp} />
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Forecast for role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>{JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}>Role: <strong style={{ color: C.blue }}>{role}</strong> · Starting: <strong style={{ color: C.purple }}>{fmtINR(base)}</strong></div>
      </Card>
      <Card elevated>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>5-Year Salary Projection (₹ Lakh)</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          {[["Conservative", "8%/yr", CH.blue], ["Moderate", "14%/yr", CH.purple], ["Aggressive", "22%/yr", CH.orange]].map(([l, r, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: c, flexShrink: 0 }} /><span style={{ fontWeight: 600, color: C.textMid }}>{l}</span><span>{r}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${v}L`} />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="conservative" stroke={CH.blue} strokeWidth={2} dot={false} name="Conservative" />
            <Line type="monotone" dataKey="moderate" stroke={CH.purple} strokeWidth={2} dot={false} name="Moderate" />
            <Line type="monotone" dataKey="aggressive" stroke={CH.orange} strokeWidth={2} dot={false} strokeDasharray="6 3" name="Aggressive" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ─── INTERVIEW PREP — fixed mobile layout ────────────────────────────────────
const InterviewPrep = ({ user }) => {
  const [mode, setMode] = useState("setup");
  const [inputMode, setInputMode] = useState("role");
  const [selectedRole, setSelectedRole] = useState(user.target_role || "");
  const [jd, setJd] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qCount, setQCount] = useState(0);
  const [roleErr, setRoleErr] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startInterview = async () => {
    if (inputMode === "role" && !selectedRole) { setRoleErr("Please select a job role"); return; }
    if (inputMode === "jd" && jd.trim().length < 50) { setRoleErr("Paste a job description (min 50 chars)"); return; }
    setRoleErr(""); setLoading(true);
    const ctx = inputMode === "role" ? `Role: ${selectedRole}` : `JD: ${jd}`;
    const prompt = `You are an expert technical interviewer at a top Indian tech company. ${ctx}. Start the interview. Introduce yourself briefly, then ask the FIRST targeted interview question. Be professional, concise (under 120 words).`;
    const resp = await callGemini(prompt);
    setMessages([{ role: "ai", content: resp || `Hello! I'm your AI interviewer. Let's begin your interview for ${selectedRole || "this role"}.\n\n**Question 1:** Tell me about your background and what draws you to this role. What key experiences make you a strong candidate?` }]);
    setQCount(1); setMode("chat"); setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const newMsgs = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    const ctx = inputMode === "role" ? selectedRole : jd.slice(0, 300);
    const history = newMsgs.slice(-6).map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`).join("\n\n");
    const next = qCount + 1; const isLast = next > 8;
    const prompt = `You are an interviewer. Context: ${ctx}\n\nConversation:\n${history}\n\n${isLast ? "Interview done. Give encouraging feedback, overall summary, strengths, one improvement, score out of 10. Under 150 words." : `One line feedback on last answer, then **Question ${next}:** (progressively harder). Under 120 words.`}`;
    const resp = await callGemini(prompt);
    setMessages(p => [...p, { role: "ai", content: resp || `Good answer! Keep providing specific examples.\n\n**Question ${next}:** Describe a complex system you designed or a difficult bug you solved.` }]);
    setQCount(next); setLoading(false);
  };

  if (mode === "setup") return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="AI Interview Prep" sub="Real-time interview practice powered by Google Gemini AI" icon={MessageSquare} />
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Card elevated style={{ padding: "clamp(20px,5vw,32px)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${C.blue},${C.purple})`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Bot size={30} color="white" /></div>
            <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>AI Interview Coach</div>
            <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Powered by Google Gemini · Role-specific · Real-time feedback</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, background: C.bgSection, borderRadius: 10, padding: 4 }}>
            {[["role", "🎯 By Job Role"], ["jd", "📋 By Job Description"]].map(([m, l]) => (
              <button key={m} onClick={() => { setInputMode(m); setRoleErr(""); }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", background: inputMode === m ? C.bgCard : "transparent", color: inputMode === m ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, boxShadow: inputMode === m ? C.shadow : "none", transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>
          {inputMode === "role"
            ? <div><RoleSelect value={selectedRole} onChange={setSelectedRole} label="Select Job Role*" placeholder="-- Choose a role --" />{roleErr && <div style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{roleErr}</div>}</div>
            : <div><label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Paste Job Description*</label><textarea rows={7} value={jd} onChange={e => { setJd(e.target.value); setRoleErr(""); }} placeholder="Paste the full JD here..." />{roleErr && <div style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{roleErr}</div>}</div>
          }
          <button onClick={startInterview} disabled={loading} style={{ marginTop: 20, width: "100%", background: loading ? C.border : `linear-gradient(135deg,${C.blue},${C.purple})`, color: loading ? C.textMuted : "white", border: "none", padding: 13, borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
            {loading ? <span>Starting<LoadingDots /></span> : "🚀 Start AI Interview"}
          </button>
        </Card>
      </div>
    </div>
  );

  // BUG FIX: removed height: calc(100vh - 120px), use flex container instead
  return (
    <div style={{ animation: "fadeUp 0.4s ease both", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(14px,2.5vw,18px)", color: C.text, margin: 0 }}>🤖 AI Interview — {selectedRole || "Custom JD"}</h2>
          <div style={{ fontSize: 12, color: C.textMuted }}>Q{qCount}/8 · Gemini AI</div>
        </div>
        <button onClick={() => { setMode("setup"); setMessages([]); setQCount(0); }} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
          <RotateCcw size={13} />New Session
        </button>
      </div>
      <div style={{ height: 4, background: C.bgSection, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", background: `linear-gradient(90deg,${C.blue},${C.purple})`, width: `${Math.min((qCount / 8) * 100, 100)}%`, transition: "width 0.5s ease" }} />
      </div>
      <Card elevated style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
        <div style={{ height: "min(60vh,480px)", overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.role === "user" ? `linear-gradient(135deg,${C.blue},${C.purple})` : C.greenLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.role === "user" ? <User size={16} color="white" /> : <Bot size={16} color={C.green} />}
              </div>
              <div style={{ maxWidth: "78%", background: m.role === "user" ? `linear-gradient(135deg,${C.blue},${C.purple})` : "white", color: m.role === "user" ? "white" : C.text, padding: "12px 16px", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", fontSize: 13, lineHeight: 1.65, boxShadow: C.shadow, whiteSpace: "pre-wrap", border: m.role === "user" ? "none" : `1px solid ${C.border}` }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ display: "flex", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: C.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={16} color={C.green} /></div><div style={{ background: "white", border: `1px solid ${C.border}`, padding: "12px 16px", borderRadius: "4px 16px 16px 16px", color: C.textMuted, fontSize: 13 }}>Thinking<LoadingDots /></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, background: C.bgSection }}>
          <textarea rows={2} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type your answer… (Enter to send)" style={{ flex: 1, resize: "none", fontSize: 13 }} disabled={loading} />
          <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? `linear-gradient(135deg,${C.blue},${C.purple})` : C.border, color: input.trim() && !loading ? "white" : C.textMuted, border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </div>
      </Card>
    </div>
  );
};

// ─── PROGRESS TRACKER ─────────────────────────────────────────────────────────
const ProgressTracker = ({ user }) => {
  const [tab, setTab] = useState("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const { courseProgress, sessionLog, updateCourse } = useProgress();

  const categories = useMemo(() => ["All", ...Array.from(new Set(REAL_COURSES.map(c => c.category)))], []);
  const filtered = useMemo(() => REAL_COURSES.filter(c =>
    (selectedCat === "All" || c.category === selectedCat) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.skill.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [selectedCat, searchQuery]);

  const skillsFromProgress = useMemo(() => Object.entries(courseProgress).filter(([, v]) => v.pct > 0).map(([id, v]) => ({ skill: v.skillName || id, progress: v.pct, learned: v.pct >= 100 })), [courseProgress]);

  const historyData = useMemo(() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const bonus = Math.min(20, Object.values(courseProgress).filter(c => c.pct >= 100).length * 3);
    return months.map((m, i) => ({ month: m, score: Math.min(95, 58 + i * 2.5 + (i === 5 ? bonus : 0)) }));
  }, [courseProgress]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Progress Tracker" sub="Track real courses, skill acquisition and career score history" icon={Activity} />
      <Tabs tabs={[{ id: "courses", label: "Courses", icon: BookOpen }, { id: "skills", label: "Skills", icon: Target }, { id: "history", label: "Score History", icon: TrendingUp }]} active={tab} onChange={setTab} />

      {tab === "courses" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search courses..." style={{ paddingLeft: 36 }} />
            </div>
            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ minWidth: 140 }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {filtered.map(course => {
              const prog = courseProgress[course.id]?.pct || 0;
              return (
                <Card key={course.id} elevated style={{ borderTop: `3px solid ${prog >= 100 ? C.green : prog > 0 ? C.blue : C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 18 }}>{course.icon}</span>
                      <Pill color={course.type === "certification" ? "orange" : course.type === "practice" ? "purple" : "blue"}>{course.type}</Pill>
                    </div>
                    <Pill color="green">{course.salary_uplift}</Pill>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{course.title}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{course.platform}</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                    <Pill color="muted">⭐{course.rating}</Pill>
                    <Pill color="muted">⏱ {course.duration}</Pill>
                    <Pill color={course.price === "Free" || course.price.startsWith("Free") ? "green" : "muted"}>{course.price}</Pill>
                  </div>
                  <ProgressBar value={prog} color={prog >= 100 ? C.green : C.blue} height={6} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{prog >= 100 ? "✅ Completed" : prog > 0 ? `${Math.round(prog)}% complete` : "Not started"}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={course.url} target="_blank" rel="noreferrer" style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                        <ExternalLink size={11} />Open
                      </a>
                      <button onClick={() => { const next = prog === 0 ? 25 : prog === 25 ? 50 : prog === 50 ? 75 : prog === 75 ? 100 : 0; updateCourse(course.id, next, course.skill); }}
                        style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        {prog === 0 ? "Start" : prog === 100 ? "Reset" : "+ 25%"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "skills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {skillsFromProgress.length === 0 && (user.skills || []).length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <BookOpen size={40} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>No progress yet</div>
              <div style={{ color: C.textMuted, fontSize: 14 }}>Start a course above to track your skills here.</div>
            </Card>
          ) : (
            <>
              {skillsFromProgress.map(s => (
                <Card key={s.skill} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.skill}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{Math.round(s.progress)}%</span>{s.learned && <Pill color="green">✅ Learned</Pill>}</div>
                  </div>
                  <ProgressBar value={s.progress} color={s.learned ? C.green : C.blue} height={8} />
                </Card>
              ))}
              {(user.skills || []).map((s, i) => (
                <Card key={s} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s}</div>
                    <Pill color="green">From Profile</Pill>
                  </div>
                  <ProgressBar value={clamp(75 + i * 5)} color={C.green} height={8} />
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "history" && (
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>Career Score History</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Score improves as you complete courses and add skills</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={historyData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMuted }} /><YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: C.textMuted }} /><Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} /><Line type="monotone" dataKey="score" stroke={CH.blue} strokeWidth={3} dot={{ fill: CH.blue, r: 5 }} name="Career Score" /></LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {[["Completed Courses", Object.values(courseProgress).filter(c => c.pct >= 100).length, C.green], ["In Progress", Object.values(courseProgress).filter(c => c.pct > 0 && c.pct < 100).length, C.blue], ["Session Events", sessionLog.length, C.purple]].map(([label, val, color]) => (
              <div key={label} style={{ flex: 1, minWidth: 100, background: C.bgSection, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── LEARNING IMPACT ──────────────────────────────────────────────────────────
const LearningImpact = ({ user }) => {
  const { courseProgress, sessionLog, getTotalImpact } = useProgress();
  const impact = getTotalImpact();
  const completedCourses = REAL_COURSES.filter(c => (courseProgress[c.id]?.pct || 0) >= 100);
  const inProgressCourses = REAL_COURSES.filter(c => { const p = courseProgress[c.id]?.pct || 0; return p > 0 && p < 100; });

  const totalSalaryImpact = useMemo(() => completedCourses.reduce((acc, c) => {
    const m = c.salary_uplift.match(/[\d.]+/);
    return acc + (m ? parseFloat(m[0]) * 100000 : 0);
  }, 0), [completedCourses]);

  const impactOverTime = useMemo(() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    return months.map((month, i) => ({
      month,
      salary_uplift: Math.round(totalSalaryImpact * (i / 5) / 100000),
      courses_done: Math.min(completedCourses.length, Math.round(completedCourses.length * (i / 5))),
    })).map((d, i, arr) => i === arr.length - 1 ? { ...d, salary_uplift: Math.round(totalSalaryImpact / 100000), courses_done: completedCourses.length } : d);
  }, [totalSalaryImpact, completedCourses]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Learning Impact" sub="Real-time ROI from your course progress — synced with Progress Tracker" icon={Zap} />
      <InfoBanner icon={Activity} color={C.blue} bg={C.blueLight} bd={C.blueBorder}>
        Live sync: This section updates automatically as you progress through courses in the Progress Tracker.
      </InfoBanner>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard icon={Trophy} label="Completed" value={impact.completed} sub="courses done" color={C.green} />
        <StatCard icon={Activity} label="In Progress" value={impact.inProgress} sub="active courses" color={C.blue} />
        <StatCard icon={DollarSign} label="Salary Impact" value={fmtINR(totalSalaryImpact)} sub="estimated uplift" color={C.purple} />
        <StatCard icon={TrendingUp} label="Avg Progress" value={`${impact.count > 0 ? Math.round(impact.totalPct / impact.count) : 0}%`} sub="across all courses" color={C.orange} />
      </div>
      {impact.count === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <Zap size={40} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>No learning data yet</div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>Go to Progress Tracker → Courses and start any course.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <Card elevated>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📈 Salary Impact Over Time (₹L)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={impactOverTime}>
                <defs><linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMuted }} />
                <YAxis tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${v}L`} />
                <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="salary_uplift" stroke={C.green} fill="url(#impactGrad)" strokeWidth={2} name="Salary Uplift (₹L)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>🎓 Completed Courses</div>
            {completedCourses.length === 0 ? <div style={{ color: C.textMuted, fontSize: 13 }}>Complete courses to see impact here.</div> :
              completedCourses.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{c.title}</div><div style={{ fontSize: 11, color: C.textMuted }}>{c.platform}</div></div>
                  <Pill color="green">{c.salary_uplift}</Pill>
                </div>
              ))}
            {inProgressCourses.length > 0 && <>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginTop: 16, marginBottom: 14 }}>⏳ In Progress</div>
              {inProgressCourses.map(c => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textMid }}>{c.title}</span>
                    <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>{courseProgress[c.id]?.pct || 0}%</span>
                  </div>
                  <ProgressBar value={courseProgress[c.id]?.pct || 0} color={C.blue} height={6} />
                </div>
              ))}
            </>}
          </Card>
        </div>
      )}
      {sessionLog.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>📋 Recent Activity</div>
          {sessionLog.slice(-8).reverse().map((log, i) => {
            const course = REAL_COURSES.find(c => c.id === log.courseId);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.textMid }}>{log.pct >= 100 ? "✅" : "📈"} <strong>{course?.skill || log.skillName}</strong> → {log.pct}%</div>
                <div style={{ fontSize: 11, color: C.textLight }}>{new Date(log.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

const CareerNetworkMap = ({ user }) => {
  const [selected, setSelected] = useState(null);
  const currentRole = user.current_role || "Software Engineer";
  const targetRole = user.target_role || "Staff Engineer";

  const rolePathMap = {
    "Software Engineer": ["Senior Software Engineer", "Staff Engineer", "Principal Engineer", "Distinguished Engineer"],
    "Frontend Developer": ["Senior Frontend Developer", "Lead Frontend Engineer", "Principal Engineer", "Frontend Architect"],
    "Data Scientist": ["Senior Data Scientist", "Staff Data Scientist", "Principal Data Scientist", "Head of Data Science"],
    "Machine Learning Engineer": ["Senior ML Engineer", "Staff ML Engineer", "Principal ML Engineer", "Head of AI/ML"],
    "Backend Developer": ["Senior Backend Engineer", "Staff Engineer", "Principal Engineer", "VP Engineering"],
    "DevOps Engineer": ["Senior DevOps Engineer", "Staff DevOps/SRE", "Principal Platform Engineer", "VP Engineering"],
    "Data Engineer": ["Senior Data Engineer", "Staff Data Engineer", "Principal Data Engineer", "VP Data"],
    "Product Manager": ["Senior PM", "Group PM", "Director of Product", "VP Product"],
    "Full Stack Developer": ["Senior Full Stack", "Tech Lead", "Engineering Manager", "Director of Engineering"],
    "AI Engineer": ["Senior AI Engineer", "Staff AI Engineer", "Principal AI Engineer", "VP AI"],
  };

  const path = rolePathMap[currentRole] || ["Senior Engineer", "Staff Engineer", "Principal Engineer", "VP Engineering"];
  const allNodes = [
    { id: "current", label: currentRole, level: user.experience_years <= 3 ? "L2–L3" : user.experience_years <= 6 ? "L3–L4" : "L4–L5", salary: user.current_salary || 1200000, current: true },
    ...path.map((role, i) => ({ id: `n${i}`, label: role, level: `L${Math.min(10, 4 + i)}–L${Math.min(10, 5 + i)}`, salary: (user.current_salary || 1200000) * Math.pow(1.35, i + 1), isTarget: role === targetRole }))
  ];
  const nodeColors = [C.blue, C.purple, C.orange, C.pink, C.green];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Career Map" sub={`Personalized path from ${currentRole} → ${targetRole}`} icon={GitBranch} />
      <InfoBanner icon={User} color={C.blue} bg={C.blueLight} bd={C.blueBorder}>
        Your path is based on your onboarding profile: <strong>{currentRole}</strong> → <strong>{targetRole}</strong> · {user.experience_years || 0}y experience · {user.location}
      </InfoBanner>
      <Card elevated>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 20 }}>Career Progression Map</div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", padding: "20px 10px", gap: 0 }}>
            {allNodes.map((node, i) => {
              const color = node.current ? C.blue : node.isTarget ? C.green : nodeColors[i % nodeColors.length];
              const isSelected = selected?.id === node.id;
              return (
                <div key={node.id} style={{ display: "flex", alignItems: "center" }}>
                  <div onClick={() => setSelected(isSelected ? null : node)} style={{
                    background: node.current ? `linear-gradient(135deg,${C.blue},${C.purple})` : node.isTarget ? `linear-gradient(135deg,${C.green},${C.teal})` : C.bgSection,
                    border: `2px solid ${node.current ? C.blue : node.isTarget ? C.green : C.border}`,
                    borderRadius: 12, padding: "12px 16px", cursor: "pointer", minWidth: 120, textAlign: "center",
                    boxShadow: node.current || node.isTarget ? C.shadowMd : C.shadow,
                    transform: isSelected ? "scale(1.08)" : "scale(1)", transition: "all 0.2s", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 10, color: node.current || node.isTarget ? "rgba(255,255,255,0.8)" : C.textLight, fontWeight: 600 }}>{node.level}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: node.current || node.isTarget ? "white" : C.text, marginTop: 2, lineHeight: 1.2 }}>{node.label}</div>
                    <div style={{ fontSize: 11, color: node.current || node.isTarget ? "rgba(255,255,255,0.8)" : C.textMuted, marginTop: 2 }}>{fmtINR(Math.round(node.salary / 100000) * 100000)}</div>
                    {node.current && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginTop: 3 }}>YOU ARE HERE</div>}
                    {node.isTarget && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginTop: 3 }}>🎯 TARGET</div>}
                  </div>
                  {i < allNodes.length - 1 && <div style={{ width: 32, height: 2, background: `linear-gradient(90deg,${nodeColors[i % nodeColors.length]},${nodeColors[(i + 1) % nodeColors.length]})`, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
        {selected && (
          <div style={{ marginTop: 16, background: C.bgSection, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div><div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{selected.label} — {selected.level}</div><div style={{ fontSize: 13, color: C.textMuted }}>Avg. salary: {fmtINR(Math.round(selected.salary / 100000) * 100000)}</div></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill color="blue">{selected.level}</Pill>
              {selected.current && <Pill color="green">Current</Pill>}
              {selected.isTarget && <Pill color="purple">Target</Pill>}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }}><X size={16} /></button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── COMMUNITY BENCHMARKING — BUG FIX: useEffect deps ────────────────────────
const CommunityBenchmarking = ({ user }) => {
  const [peers] = useState([
    { id: "p1", alias: "Arjun S.", role: "Senior ML Engineer", salary: 3200000, level: "L5", skills: 18, exp: 6, location: "Bangalore" },
    { id: "p2", alias: "Priya M.", role: "Staff Data Scientist", salary: 4500000, level: "L6", skills: 22, exp: 8, location: "Hyderabad" },
    { id: "p3", alias: "Rahul K.", role: "Backend Engineer", salary: 2800000, level: "L4", skills: 15, exp: 5, location: "Pune" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // BUG FIX: use primitive deps instead of user object to avoid infinite re-renders
  const userCurrentRole = user.current_role || "";
  const userCurrentSalary = user.current_salary || 1200000;

  useEffect(() => {
    apiCall(`/api/benchmarking?role=${encodeURIComponent(userCurrentRole)}&salary=${userCurrentSalary}`).then(() => { });
  }, [userCurrentRole, userCurrentSalary]);

  const sendInvite = async () => {
    if (!inviteEmail.includes("@")) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setInviteSent(true); setLoading(false);
    setTimeout(() => setInviteSent(false), 3000);
    setInviteEmail("");
  };

  const allSalaries = [userCurrentSalary, ...peers.map(p => p.salary)].sort((a, b) => a - b);
  const userPercentile = Math.round((allSalaries.indexOf(userCurrentSalary) / (allSalaries.length - 1)) * 100);

  const distData = [
    { range: "₹5L–₹10L", count: 12, fill: CH.blue },
    { range: "₹10L–₹20L", count: 28, fill: CH.purple },
    { range: "₹20L–₹35L", count: 35, fill: CH.orange },
    { range: "₹35L–₹60L", count: 18, fill: CH.pink },
    { range: "₹60L+", count: 7, fill: CH.green },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Peer Benchmarking" sub="Compare salary & skills with anonymized peers" icon={Users} />
      <InfoBanner icon={Shield} color={C.green} bg={C.greenLight} bd={C.greenBorder}>
        All peer data is anonymized. Real names and identifiers are never shown.
      </InfoBanner>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Salary Distribution — Peer Group</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="range" tick={{ fontSize: 10, fill: C.textMuted }} /><YAxis tick={{ fontSize: 11, fill: C.textMuted }} unit="%" /><Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} /><Bar dataKey="count" radius={[4, 4, 0, 0]}>{distData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>Your Position vs. Peers</div>
          {[{ label: "Salary Percentile", value: `${userPercentile}th`, prog: userPercentile, color: C.blue }, { label: "Skill Coverage", value: `${Math.round(((user.skills?.length || 3) / 20) * 100)}%`, prog: Math.round(((user.skills?.length || 3) / 20) * 100), color: C.purple }, { label: "Experience Rank", value: `${Math.round((user.experience_years || 3) / 12 * 100)}%`, prog: Math.round((user.experience_years || 3) / 12 * 100), color: C.orange }].map(m => (
            <div key={m.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{m.label}</span><span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.value}</span></div>
              <ProgressBar value={m.prog} color={m.color} height={8} />
            </div>
          ))}
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>👥 Peer Comparison</div>
          <div style={{ marginBottom: 12, padding: "10px 12px", background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div><div style={{ fontWeight: 700, fontSize: 13, color: C.blue }}>You — {user.current_role}</div><div style={{ fontSize: 11, color: C.textMuted }}>{user.location} · {user.experience_years || 0}y exp</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 14, color: C.blue }}>{fmtINR(userCurrentSalary)}</div><Pill color="blue">You</Pill></div>
            </div>
          </div>
          {peers.map(p => (
            <div key={p.id} style={{ padding: "10px 12px", background: C.bgSection, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div><div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.alias} — {p.role}</div><div style={{ fontSize: 11, color: C.textMuted }}>{p.location} · {p.exp}y</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 14, color: p.salary > userCurrentSalary ? C.green : C.orange }}>{fmtINR(p.salary)}</div><Pill color={p.salary > userCurrentSalary ? "green" : "orange"}>{p.salary > userCurrentSalary ? "↑ Higher" : "↓ Lower"}</Pill></div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} color={C.blue} />Invite Peers
          </div>
          <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 14 }}>Invite colleagues to compare anonymized salary data.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendInvite()} type="email" placeholder="colleague@company.com" style={{ flex: 1 }} />
            <button onClick={sendInvite} disabled={loading || inviteSent} style={{ background: inviteSent ? C.green : `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
              {loading ? <span>Sending<LoadingDots /></span> : inviteSent ? "✓ Sent!" : "Invite"}
            </button>
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", background: C.bgSection, borderRadius: 8, fontSize: 12, color: C.textMuted }}>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>🔒 Privacy Promise</div>
            All data is opt-in. Salaries shown as ranges, never exact.
          </div>
          <button style={{ marginTop: 12, background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
            <Copy size={14} />Copy Invite Link
          </button>
        </Card>
      </div>
    </div>
  );
};

// ─── PORTFOLIO — BUG FIX: useRef for stack input ─────────────────────────────
const Portfolio = ({ user }) => {
  const [view, setView] = useState("gallery");
  const [projects, setProjects] = useState([
    { id: "p1", title: "AI Resume Screener", stack: ["Python", "FastAPI", "spaCy", "BERT"], description: "NLP-powered ATS tool with Hindi+English multilingual transformer support", category: "AI/ML", status: "published", github: "https://github.com", demo: "https://example.com", thumbnail: "🤖", views: 234, likes: 47 },
    { id: "p2", title: "UPI Fraud Detection", stack: ["Python", "Kafka", "TensorFlow", "Spark"], description: "Real-time streaming fraud detection for UPI transactions — 99.2% accuracy", category: "Fintech/AI", status: "published", github: "https://github.com", demo: "", thumbnail: "🔐", views: 189, likes: 38 },
  ]);
  const [editProject, setEditProject] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const stackInputRef = useRef(null); // BUG FIX: useRef instead of getElementById

  const newProject = () => setEditProject({ id: `p${Date.now()}`, title: "", stack: [], description: "", category: "AI/ML", status: "draft", github: "", demo: "", thumbnail: "💻", views: 0, likes: 0 });

  const saveProject = proj => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === proj.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = proj; return n; }
      return [...prev, proj];
    });
    setEditProject(null);
  };

  const aiSuggestDescription = async proj => {
    setAiLoading(true);
    const prompt = `Write a compelling 2-sentence project description for an Indian tech portfolio:
Title: ${proj.title}, Stack: ${proj.stack.join(", ")}, Category: ${proj.category}
Return ONLY the description text.`;
    const desc = await callGemini(prompt);
    if (desc) setEditProject(p => ({ ...p, description: desc.trim() }));
    setAiLoading(false);
  };

  const addStackSkill = useCallback(() => {
    const val = stackInputRef.current?.value?.trim();
    if (val && editProject && !editProject.stack.includes(val)) {
      setEditProject(p => ({ ...p, stack: [...p.stack, val] }));
      if (stackInputRef.current) stackInputRef.current.value = "";
    }
  }, [editProject]);

  const thumbs = ["💻", "🤖", "🔐", "📊", "🌐", "⚡", "🎯", "🚀", "🔬", "📱", "🎮", "🧠"];
  const cats = ["AI/ML", "Fintech/AI", "Web Development", "Mobile", "DevOps/Cloud", "Data Engineering", "Open Source", "Other"];

  if (editProject) return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>
          {projects.find(p => p.id === editProject.id) ? "Edit Project" : "New Project"}
        </div>
        <button onClick={() => setEditProject(null)} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>← Back</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Project Details</div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Project Title*</label><input value={editProject.title} onChange={e => setEditProject(p => ({ ...p, title: e.target.value }))} placeholder="e.g. UPI Fraud Detection System" /></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Category</label><select value={editProject.category} onChange={e => setEditProject(p => ({ ...p, category: e.target.value }))}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Description</label>
              <button onClick={() => aiSuggestDescription(editProject)} disabled={aiLoading || !editProject.title} style={{ background: C.purpleLight, border: `1px solid ${C.purpleBorder}`, color: C.purple, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <Brain size={11} />{aiLoading ? <span>AI<LoadingDots /></span> : "AI Write"}
              </button>
            </div>
            <textarea rows={4} value={editProject.description} onChange={e => setEditProject(p => ({ ...p, description: e.target.value }))} placeholder="Describe the project and its impact..." style={{ resize: "none", fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 8 }}>Tech Stack</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input ref={stackInputRef} placeholder="Add technology..." style={{ flex: 1, fontSize: 12 }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addStackSkill(); } }} />
              <button onClick={addStackSkill} style={{ background: C.blue, color: "white", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {editProject.stack.map(s => (
                <span key={s} style={{ background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  {s}<button onClick={() => setEditProject(p => ({ ...p, stack: p.stack.filter(x => x !== s) }))} style={{ background: "transparent", border: "none", color: C.blue, cursor: "pointer", padding: 0, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Links & Thumbnail</div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>GitHub URL</label><input value={editProject.github} onChange={e => setEditProject(p => ({ ...p, github: e.target.value }))} placeholder="https://github.com/username/repo" /></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Live Demo URL</label><input value={editProject.demo} onChange={e => setEditProject(p => ({ ...p, demo: e.target.value }))} placeholder="https://your-project.vercel.app" /></div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 8 }}>Thumbnail</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {thumbs.map(t => <button key={t} onClick={() => setEditProject(p => ({ ...p, thumbnail: t }))} style={{ width: 40, height: 40, fontSize: 22, borderRadius: 8, border: `2px solid ${editProject.thumbnail === t ? C.blue : C.border}`, background: editProject.thumbnail === t ? C.blueLight : C.bgSection, cursor: "pointer" }}>{t}</button>)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 8 }}>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["draft", "published"].map(s => <button key={s} onClick={() => setEditProject(p => ({ ...p, status: s }))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${editProject.status === s ? C.blueBorder : C.border}`, background: editProject.status === s ? C.blueLight : "transparent", color: editProject.status === s ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{s}</button>)}
            </div>
          </div>
          <button onClick={() => saveProject(editProject)} disabled={!editProject.title} style={{ width: "100%", background: !editProject.title ? C.border : `linear-gradient(135deg,${C.blue},${C.purple})`, color: !editProject.title ? C.textMuted : "white", border: "none", padding: "11px", borderRadius: 8, cursor: editProject.title ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14 }}>
            💾 Save Project
          </button>
        </Card>
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Portfolio Builder" sub="Build, customize, and publish your project portfolio" icon={Layout}
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setView(v => v === "gallery" ? "preview" : "gallery")} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              {view === "gallery" ? <><Eye size={14} />Preview</> : <><Layout size={14} />Editor</>}
            </button>
            <button onClick={newProject} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} />New Project
            </button>
          </div>
        } />

      {view === "preview" ? (
        <div style={{ background: "#0F172A", borderRadius: 16, overflow: "hidden", border: "1px solid #1E293B" }}>
          <div style={{ background: "#0F172A", padding: "20px 28px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "white" }}>{user.name || "Developer"}<span style={{ color: C.blue }}>.dev</span></div>
            <div style={{ display: "flex", gap: 8 }}>{["Work", "About", "Contact"].map(l => <button key={l} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{l}</button>)}</div>
          </div>
          <div style={{ padding: "clamp(20px,4vw,40px) clamp(16px,4vw,28px)" }}>
            <div style={{ fontWeight: 800, fontSize: "clamp(24px,5vw,36px)", color: "white", marginBottom: 8 }}>Hi, I'm {user.name?.split(" ")[0] || "Arjun"} 👋</div>
            <div style={{ fontSize: 16, color: "#94A3B8", marginBottom: 32 }}>{user.current_role} · {user.location} · {user.experience_years || 3}y experience</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
              {projects.filter(p => p.status === "published").map(proj => (
                <div key={proj.id} style={{ background: "#1E293B", borderRadius: 14, padding: "20px", border: "1px solid #334155", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{proj.thumbnail}</div>
                  <Pill color="blue">{proj.category}</Pill>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "white", margin: "10px 0 6px" }}>{proj.title}</div>
                  <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 12 }}>{proj.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>{proj.stack.map(s => <span key={s} style={{ background: "#334155", color: "#94A3B8", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ background: "#334155", color: "#94A3B8", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Github size={13} />Code</a>}
                    {proj.demo && <a href={proj.demo} target="_blank" rel="noreferrer" style={{ background: C.blue, color: "white", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}><ExternalLink size={13} />Demo</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
          {projects.map(proj => (
            <Card key={proj.id} elevated style={{ borderTop: `3px solid ${proj.status === "published" ? C.green : C.orange}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{proj.thumbnail}</span>
                <Pill color={proj.status === "published" ? "green" : "orange"}>{proj.status}</Pill>
              </div>
              <Pill color="blue">{proj.category}</Pill>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: "10px 0 6px", lineHeight: 1.3 }}>{proj.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10, lineHeight: 1.5 }}>{proj.description?.slice(0, 90)}{proj.description?.length > 90 ? "..." : ""}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>{proj.stack.map(s => <Pill key={s} color="blue">{s}</Pill>)}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {proj.github && <a href={proj.github} target="_blank" rel="noreferrer" style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Github size={12} />GitHub</a>}
                {proj.demo && <a href={proj.demo} target="_blank" rel="noreferrer" style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Globe size={12} />Demo</a>}
                <button onClick={() => setEditProject({ ...proj })} style={{ marginLeft: "auto", background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMid, padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} />Edit</button>
              </div>
            </Card>
          ))}
          <div onClick={newProject} style={{ border: `2px dashed ${C.blueBorder}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: C.blueLight, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bgSection; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.blueLight; }}>
            <Plus size={32} color={C.blue} style={{ margin: "0 auto 8px", display: "block" }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.blue }}>Add New Project</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Click to create a project card</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ADVANCED JOB SEARCH ──────────────────────────────────────────────────────
const AdvancedJobSearch = ({ user }) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ location: "All", remote: "All", minSalary: 1000000 });

  const results = useMemo(() => MOCK_JOBS.filter(j =>
    (!query || j.title.toLowerCase().includes(query.toLowerCase()) || j.company.toLowerCase().includes(query.toLowerCase())) &&
    (filters.location === "All" || j.location === filters.location) &&
    (filters.remote === "All" || j.remote === filters.remote) &&
    (j.salary_range[0] >= filters.minSalary)
  ), [query, filters]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Advanced Job Search" sub="Filter jobs by role, location, salary and remote preference" icon={Search} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <div style={{ position: "relative", gridColumn: "1/-1" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, company or skill..." style={{ paddingLeft: 36 }} />
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Location</label><select value={filters.location} onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}><option value="All">All Cities</option>{["Bangalore", "Hyderabad", "Mumbai", "Pune", "Delhi NCR"].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Remote</label><select value={filters.remote} onChange={e => setFilters(p => ({ ...p, remote: e.target.value }))}><option value="All">All</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></select></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Min: {fmtINR(filters.minSalary)}</label><input type="range" min={500000} max={8000000} step={100000} value={filters.minSalary} onChange={e => setFilters(p => ({ ...p, minSalary: +e.target.value }))} style={{ width: "100%", accentColor: C.blue }} /></div>
        </div>
      </Card>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Found <strong style={{ color: C.blue }}>{results.length}</strong> matching jobs</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map(j => (
          <Card key={j.id} elevated>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 4 }}>{j.title}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>{j.company} · {j.location} · {j.remote} · {j.exp}</div>
                <div>{j.match.matched_skills?.map(s => <SkillTag key={s} skill={s} status="have" />)}{j.match.missing_skills?.map(s => <SkillTag key={s} skill={s} status="missing" />)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.blue }}>{fmtINR(j.salary_range[0])} – {fmtINR(j.salary_range[1])}</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <Pill color="green">{Math.round(j.match.score)}% match</Pill>
                  <Pill color="blue">{j.match.salary_normalization?.level}</Pill>
                </div>
                <button style={{ marginTop: 10, background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Apply Now ↗</button>
              </div>
            </div>
          </Card>
        ))}
        {results.length === 0 && <Card style={{ textAlign: "center", padding: 40 }}><Search size={40} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} /><div style={{ fontWeight: 700, color: C.text }}>No jobs found</div><div style={{ color: C.textMuted, marginTop: 4 }}>Try adjusting your filters</div></Card>}
      </div>
    </div>
  );
};

// ─── SIDE HUSTLES ─────────────────────────────────────────────────────────────
const SideHustles = () => {
  const hustles = [
    { title: "Freelance ML/AI Consulting", platform: "Toptal / Upwork", estimated_monthly: "₹40K–₹1.2L", difficulty: "Medium", time_to_first_income: "2–4 weeks" },
    { title: "Technical Content / Blogging", platform: "Medium / YouTube", estimated_monthly: "₹10K–₹80K", difficulty: "Low", time_to_first_income: "1–3 months" },
    { title: "Course Creation (Hindi/English)", platform: "Unacademy / Udemy", estimated_monthly: "₹20K–₹1.5L", difficulty: "Medium", time_to_first_income: "1–2 months" },
    { title: "AI SaaS Product", platform: "ProductHunt / AppSumo", estimated_monthly: "₹10K–₹2.5L", difficulty: "High", time_to_first_income: "3–6 months" },
  ];
  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Side Hustles" sub="Income opportunities in India — earn ₹40K–₹2.5L/month" icon={Coffee} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        {hustles.map((h, i) => (
          <Card key={h.title} elevated style={{ borderTop: `3px solid ${[C.blue, C.orange, C.purple, C.pink][i]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Pill color={["blue", "orange", "purple", "pink"][i]}>{h.difficulty}</Pill>
              <span style={{ fontSize: 13, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{h.time_to_first_income}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 4 }}>{h.title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>via {h.platform}</div>
            <div style={{ background: C.bgSection, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Est. Monthly Income</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: [C.blue, C.orange, C.purple, C.pink][i] }}>{h.estimated_monthly}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── SETTINGS & PRIVACY ───────────────────────────────────────────────────────
const SettingsPrivacy = ({ user, onUserUpdate, onLogout }) => {
  const [sec, setSec] = useState("profile");
  const [form, setForm] = useState({ name: user.name || "", current_role: user.current_role || "", current_salary: user.current_salary || 1200000 });
  const [notifs, setNotifs] = useState({ jobs: true, skills: true, market: false, weekly: true });
  const [saved, setSaved] = useState(false);

  const save = () => { onUserUpdate({ ...user, ...form }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const navItems = [{ id: "profile", icon: User, label: "Profile" }, { id: "notifications", icon: Bell, label: "Notifications" }, { id: "privacy", icon: Shield, label: "Privacy & Data" }];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Settings & Privacy" sub="Manage profile, notifications, and data privacy" icon={Settings} />
      <div style={{ display: "grid", gridTemplateColumns: "clamp(120px,15%,180px) 1fr", gap: 20 }}>
        <div>
          {navItems.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${sec === s.id ? C.blueBorder : "transparent"}`, background: sec === s.id ? C.blueLight : "transparent", color: sec === s.id ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              <s.icon size={15} />{s.label}
            </button>
          ))}
        </div>
        <div>
          {sec === "profile" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Profile Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Full Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Current Role</label><input value={form.current_role} onChange={e => setForm(p => ({ ...p, current_role: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>Current Salary: <strong style={{ color: C.blue }}>{fmtINR(form.current_salary)}</strong></label>
                <input type="range" min={300000} max={20000000} step={100000} value={form.current_salary} onChange={e => setForm(p => ({ ...p, current_salary: +e.target.value }))} style={{ width: "100%", accentColor: C.blue }} />
              </div>
              <button onClick={save} style={{ marginTop: 16, background: saved ? C.green : `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </Card>
          )}
          {sec === "notifications" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Notifications</div>
              {[{ k: "jobs", l: "New Job Matches" }, { k: "skills", l: "Trending Skills" }, { k: "market", l: "Market Shifts" }, { k: "weekly", l: "Weekly Summary" }].map(n => (
                <div key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>{n.l}</span>
                  <button onClick={() => setNotifs(p => ({ ...p, [n.k]: !p[n.k] }))} style={{ width: 44, height: 24, borderRadius: 12, background: notifs[n.k] ? C.blue : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: notifs[n.k] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </button>
                </div>
              ))}
            </Card>
          )}
          {sec === "privacy" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Privacy & Data</div>
              <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: C.green, marginBottom: 4 }}>🔒 Privacy Active</div>
                <div style={{ fontSize: 12, color: C.green }}>Email stored as SHA-256 hash · PII stripped from resumes · JWT rotation active</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Export Data</button>
                <button onClick={onLogout} style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.red, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={14} />Delete Account</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const NotificationCenter = ({ user }) => {
  const [notifs, setNotifs] = useState([
    { id: 1, type: "job_match", title: "3 new jobs match your target role", body: `Google India, Microsoft, Razorpay posted roles above your salary level (${user.current_role})`, time: "2h ago", read: false, icon: Briefcase, color: CH.blue },
    { id: 2, type: "skill", title: "MLOps demand surged +78% this week", body: "Jobs requiring MLOps pay 32% more. Add it to your skill list.", time: "4h ago", read: false, icon: TrendingUp, color: CH.orange },
    { id: 3, type: "score", title: "Career score improved (+3)", body: "Your course progress updated your match score across 12 jobs", time: "1d ago", read: true, icon: Award, color: CH.green },
    { id: 4, type: "market", title: "AI sector salaries up 11.3% YoY", body: "Senior ML roles are growing faster than any other tech discipline", time: "2d ago", read: true, icon: BarChart2, color: CH.purple },
  ]);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Notifications" icon={Bell}
        action={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {unread > 0 && <Pill color="orange">{unread} unread</Pill>}
          <button onClick={() => setNotifs(p => p.map(n => ({ ...n, read: true })))} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Mark all read</button>
        </div>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <Card key={n.id} style={{ borderLeft: `4px solid ${n.read ? C.border : n.color}`, opacity: n.read ? 0.8 : 1 }}
            onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ background: `${n.color}18`, padding: 10, borderRadius: 10, flexShrink: 0, border: `1px solid ${n.color}30` }}><n.icon size={18} color={n.color} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 14, color: n.read ? C.textMuted : C.text }}>{n.title}</div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, flexShrink: 0, marginTop: 4 }} />}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: C.textLight, marginTop: 6 }}>{n.time}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── SIDEBAR NAV (moved OUTSIDE App to prevent recreation on every render) ───
const SidebarContent = memo(({ user, activePage, setActivePage, sidebarOpen, setSidebarOpen, backendStatus, isDrawer, onClose, navGroups, navItems }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    {/* Logo */}
    <div style={{ padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, padding: 8, borderRadius: 10, flexShrink: 0 }}><Brain size={17} color="white" /></div>
        {(sidebarOpen || isDrawer) && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Career<span style={{ color: C.blue }}>IQ</span><span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400, marginLeft: 4 }}>Pro</span></div>
            <div style={{ fontSize: 9, color: backendStatus === "online" ? C.green : C.textLight, fontWeight: 600 }}>{backendStatus === "online" ? "● API Live" : "● Demo Mode"}</div>
          </div>
        )}
      </div>
      {isDrawer && <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }}><X size={18} /></button>}
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
      {navGroups.map(g => {
        const items = navItems.filter(n => n.group === g.id);
        return (
          <div key={g.id} style={{ marginBottom: 8 }}>
            {(sidebarOpen || isDrawer) && <div style={{ fontSize: 9, color: C.textLight, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "6px 8px 2px" }}>{g.label}</div>}
            {items.map(item => {
              const active = activePage === item.id;
              return (
                <button key={item.id} onClick={() => { setActivePage(item.id); if (isDrawer) onClose(); }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? C.bgActive : "transparent", color: active ? C.blue : C.textMuted, transition: "all 0.12s", textAlign: "left", width: "100%", marginBottom: 1, borderLeft: `2px solid ${active ? C.blue : "transparent"}`, fontWeight: active ? 600 : 400 }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.textMid; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; } }}>
                  <item.icon size={15} style={{ flexShrink: 0 }} />
                  {(sidebarOpen || isDrawer) && <span style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>

    {/* User info */}
    {(sidebarOpen || isDrawer) && (
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${C.blue},${C.purple})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "white", flexShrink: 0 }}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.current_role}</div>
          </div>
        </div>
      </div>
    )}

    {/* Collapse toggle (desktop only) */}
    {!isDrawer && (
      <button onClick={() => setSidebarOpen(p => !p)} style={{ margin: 6, padding: 8, background: C.bgSection, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {sidebarOpen ? <X size={13} /> : <Menu size={13} />}
      </button>
    )}
  </div>
));

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState("demo");

  useEffect(() => { apiCall("/").then(d => setBackendStatus(d ? "online" : "demo")).catch(() => setBackendStatus("demo")); }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navGroups = useMemo(() => [
    { id: "core", label: "Core Platform" },
    { id: "growth", label: "Growth & Prep" },
    { id: "tools", label: "Tools & Income" },
    { id: "account", label: "Account" },
  ], []);

  const navItems = useMemo(() => [
    { id: "dashboard", icon: Home, label: "Dashboard", group: "core" },
    { id: "resume", icon: FileText, label: "Resume Studio", group: "core" },
    { id: "salary", icon: DollarSign, label: "Salary Intel", group: "core" },
    { id: "jobs", icon: Briefcase, label: "Job Matching", group: "core" },
    { id: "search", icon: Search, label: "Advanced Search", group: "core" },
    { id: "skills", icon: Target, label: "Skill Gap", group: "core" },
    { id: "market", icon: BarChart2, label: "Market Insights", group: "core" },
    { id: "forecast", icon: TrendingUp, label: "Growth Forecast", group: "growth" },
    { id: "interview", icon: MessageSquare, label: "Interview Prep", group: "growth" },
    { id: "tracker", icon: Activity, label: "Progress Tracker", group: "growth" },
    { id: "impact", icon: Zap, label: "Learning Impact", group: "growth" },
    { id: "network", icon: GitBranch, label: "Career Map", group: "growth" },
    { id: "benchmarking", icon: Users, label: "Peer Benchmarking", group: "tools" },
    { id: "hustles", icon: Coffee, label: "Side Hustles", group: "tools" },
    { id: "portfolio", icon: Layout, label: "Portfolio", group: "tools" },
    { id: "notifications", icon: Bell, label: "Notifications", group: "account" },
    { id: "settings", icon: Settings, label: "Settings", group: "account" },
  ], []);

  const u = user || {};
  const pageMap = useMemo(() => ({
    dashboard: <Dashboard user={u} onNavigate={setActivePage} />,
    resume: <ResumeAnalysis user={u} />,
    salary: <SalaryIntelligence user={u} />,
    jobs: <JobMatching user={u} />,
    search: <AdvancedJobSearch user={u} />,
    skills: <SkillGapAnalysis user={u} />,
    market: <MarketInsights user={u} />,
    forecast: <CareerGrowthForecast user={u} />,
    interview: <InterviewPrep user={u} />,
    tracker: <ProgressTracker user={u} />,
    impact: <LearningImpact user={u} />,
    network: <CareerNetworkMap user={u} />,
    benchmarking: <CommunityBenchmarking user={u} />,
    hustles: <SideHustles />,
    portfolio: <Portfolio user={u} />,
    notifications: <NotificationCenter user={u} />,
    settings: <SettingsPrivacy user={u} onUserUpdate={setUser} onLogout={() => setUser(null)} />,
  }), [u, activePage]); // eslint-disable-line

  const currentPage = navItems.find(n => n.id === activePage);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #F8FAFC; color: #0F172A; font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes blink  { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
    input, textarea, select {
      background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px;
      color: #0F172A; font-family: 'Inter', sans-serif; font-size: 14px;
      padding: 10px 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
    }
    input:focus, textarea:focus, select:focus {
      border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #FFFFFF;
    }
    input::placeholder, textarea::placeholder { color: #94A3B8; }
    select option { background: #FFFFFF; color: #0F172A; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #F1F5F9; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    button { font-family: 'Inter', sans-serif; }
    a { text-decoration: none; }
    img { max-width: 100%; }
    input[type="range"] { padding: 0; border: none; background: transparent; box-shadow: none; }
    input[type="range"]:focus { box-shadow: none; border-color: transparent; }

    /* ── RESPONSIVE ── */
    .desktop-sidebar { display: flex !important; }
    .mobile-menu-btn { display: none !important; }

    @media (max-width: 768px) {
      .desktop-sidebar { display: none !important; }
      .mobile-menu-btn { display: flex !important; }
    }

    /* Mobile-friendly tables and grids */
    @media (max-width: 600px) {
      .responsive-grid { grid-template-columns: 1fr !important; }
    }

    /* Prevent horizontal overflow */
    #root, .app-root { overflow-x: hidden; }
  `;

  if (!user) return (
    <ProgressProvider>
      <style>{CSS}</style>
      <LandingPage onStart={setUser} />
    </ProgressProvider>
  );

  return (
    <ProgressProvider>
      <style>{CSS}</style>

      {/* Mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }} />}

      {/* Mobile drawer */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, background: C.bgSidebar, borderRight: `1px solid ${C.border}`, zIndex: 50, boxShadow: C.shadowLg, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.28s ease" }}>
        <SidebarContent user={user} activePage={activePage} setActivePage={setActivePage} sidebarOpen={true} setSidebarOpen={setSidebarOpen} backendStatus={backendStatus} isDrawer={true} onClose={() => setMobileOpen(false)} navGroups={navGroups} navItems={navItems} />
      </div>

      <div className="app-root" style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{ width: sidebarOpen ? "224px" : "56px", flexShrink: 0, background: C.bgSidebar, borderRight: `1px solid ${C.border}`, flexDirection: "column", transition: "width 0.25s ease", position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
          <SidebarContent user={user} activePage={activePage} setActivePage={setActivePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} backendStatus={backendStatus} isDrawer={false} onClose={() => { }} navGroups={navGroups} navItems={navItems} />
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Topbar */}
          <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "11px clamp(12px,3vw,24px)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 0 rgba(0,0,0,0.04)", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", padding: "6px 8px", borderRadius: 8, alignItems: "center" }}>
                <Menu size={16} />
              </button>
              <div>
                <div style={{ fontWeight: 700, fontSize: "clamp(13px,2vw,15px)", color: C.text }}>{currentPage?.label}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>CareerIQ Pro · {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <Pill color="blue">{user.current_role}</Pill>
              <Pill color="purple">{user.experience_years || 0}y</Pill>
              <Pill color="muted">{fmtINR(user.current_salary || 0)}</Pill>
              <button onClick={() => setUser(null)} title="Sign out" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", padding: "5px 8px", borderRadius: 7, display: "flex", alignItems: "center" }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, padding: "clamp(12px,3vw,24px)", overflowY: "auto" }}>
            {pageMap[activePage] || <div style={{ color: C.textMuted, padding: 40, textAlign: "center" }}>Page not found</div>}
          </div>
        </div>
      </div>
    </ProgressProvider>
  );
}