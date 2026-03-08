import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PolarRadiusAxis, Cell, PieChart, Pie, ReferenceLine
} from "recharts";
import {
  Upload, Brain, TrendingUp, Target, BookOpen, Zap, Shield,
  BarChart2, Award, ChevronRight, CheckCircle, XCircle, AlertCircle,
  Star, Code, Briefcase, DollarSign, ArrowUpRight, Clock, Activity,
  User, LogOut, Menu, X, Home, Coffee, MessageSquare, Play,
  Layers, GitBranch, Cpu, Globe, Lightbulb, Lock, Trash2, Download,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp, Plus, Minus, Check,
  Users, TrendingDown, Calendar, Flag, Rocket, Bell, FileText, Edit3,
  Save, Gauge, Trophy, Hash, Sliders, Settings, Search, Sparkles,
  MapPin, Network, Info, Filter, RotateCcw
} from "lucide-react";

// ─── LIGHT THEME DESIGN TOKENS ───────────────────────────────────────────────
const C = {
  // Backgrounds
  bg: "#F8FAFC",
  bgCard: "#FFFFFF",
  bgSidebar: "#FFFFFF",
  bgHover: "#F1F5F9",
  bgActive: "#EFF6FF",
  bgInput: "#F8FAFC",
  bgSection: "#F1F5F9",

  // Text
  text: "#0F172A",
  textMid: "#334155",
  textMuted: "#64748B",
  textLight: "#94A3B8",

  // Brand / Accent
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  blueBorder: "#BFDBFE",

  orange: "#EA580C",
  orangeLight: "#FEF3E2",
  orangeBorder: "#FED7AA",

  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  purpleBorder: "#DDD6FE",

  pink: "#DB2777",
  pinkLight: "#FCE7F3",
  pinkBorder: "#FBCFE8",

  green: "#16A34A",
  greenLight: "#DCFCE7",
  greenBorder: "#BBF7D0",

  // Structural
  border: "#E2E8F0",
  borderMid: "#CBD5E1",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 10px 25px rgba(0,0,0,0.08)",

  // Chart palette
  chart: ["#2563EB", "#EA580C", "#7C3AED", "#DB2777", "#16A34A", "#0891B2"],
};

// Chart colors shorthand
const CH = { blue: "#2563EB", orange: "#EA580C", purple: "#7C3AED", pink: "#DB2777", green: "#16A34A", teal: "#0891B2" };

const API_BASE = "http://localhost:8000";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  salaryLevels: {
    L1: { range: [30000, 50000], label: "Entry Level" }, L2: { range: [50000, 70000], label: "Junior" },
    L3: { range: [70000, 90000], label: "Mid-Level" }, L4: { range: [90000, 120000], label: "Senior" },
    L5: { range: [120000, 160000], label: "Staff / Lead" }, L6: { range: [160000, 200000], label: "Principal" },
    L7: { range: [200000, 260000], label: "Distinguished" }, L8: { range: [260000, 340000], label: "Fellow" },
    L9: { range: [340000, 450000], label: "Senior Fellow" }, L10: { range: [450000, 1000000], label: "Executive" }
  },
  jobs: [
    { id: "j1", title: "Senior ML Engineer", company: "DeepMind", salary_range: [180000, 240000], location: "London / Remote", industry: "AI Research", match: { score: 88.5, skill_overlap: 75, matched_skills: ["Python", "TensorFlow"], missing_skills: ["MLOps"], advancement_guaranteed: true, salary_normalization: { level: "L6", normalized_score: 0.61 } } },
    { id: "j2", title: "Staff Data Scientist", company: "Stripe", salary_range: [200000, 280000], location: "San Francisco", industry: "Fintech", match: { score: 82.1, skill_overlap: 68, matched_skills: ["Python", "SQL"], missing_skills: ["A/B Testing"], advancement_guaranteed: true, salary_normalization: { level: "L7", normalized_score: 0.71 } } },
    { id: "j3", title: "Principal SWE", company: "Anthropic", salary_range: [220000, 300000], location: "Remote", industry: "AI Safety", match: { score: 79.4, skill_overlap: 62, matched_skills: ["Python", "AWS"], missing_skills: ["Distributed Systems"], advancement_guaranteed: true, salary_normalization: { level: "L7", normalized_score: 0.75 } } },
    { id: "j4", title: "ML Platform Engineer", company: "Uber", salary_range: [160000, 210000], location: "NYC", industry: "Mobility", match: { score: 76.8, skill_overlap: 71, matched_skills: ["Python", "Kubernetes"], missing_skills: ["Scala"], advancement_guaranteed: true, salary_normalization: { level: "L6", normalized_score: 0.55 } } },
  ],
  skillGap: {
    target_role: "Machine Learning Engineer", match_score: 62.5, completeness_level: "Moderate",
    skills_have: ["Python", "NumPy", "Pandas", "Scikit-learn"],
    skills_missing: ["TensorFlow", "PyTorch", "MLOps", "Kubernetes", "Docker", "Apache Spark"],
    skills_priority: ["TensorFlow", "PyTorch", "MLOps"],
    soft_skills_needed: ["Research skills", "Data storytelling", "Cross-team collaboration"]
  },
  market: {
    trending_skills: [
      { skill: "LLM Fine-Tuning", demand_growth: "+89%", avg_salary_premium: "$35K" },
      { skill: "Kubernetes", demand_growth: "+67%", avg_salary_premium: "$28K" },
      { skill: "MLOps", demand_growth: "+78%", avg_salary_premium: "$32K" },
      { skill: "Rust", demand_growth: "+45%", avg_salary_premium: "$22K" },
      { skill: "Apache Kafka", demand_growth: "+56%", avg_salary_premium: "$18K" },
    ],
    salary_benchmarks: {
      entry_level: { range: "$55K-$80K", yoy_growth: "+4.2%" },
      mid_level: { range: "$90K-$130K", yoy_growth: "+6.8%" },
      senior: { range: "$130K-$200K", yoy_growth: "+8.1%" },
      staff_plus: { range: "$200K-$400K", yoy_growth: "+11.3%" },
    },
    top_hiring_companies: ["Google", "Meta", "Apple", "Anthropic", "OpenAI", "Stripe", "Databricks", "Snowflake"],
  },
  sideHustles: [
    { title: "Freelance ML Consulting", platform: "Toptal", estimated_monthly: "$3K-$8K", difficulty: "Medium", time_to_first_income: "2-4 weeks" },
    { title: "Technical Content Creation", platform: "YouTube/Substack", estimated_monthly: "$500-$5K", difficulty: "Low", time_to_first_income: "1-3 months" },
    { title: "AI App Development", platform: "ProductHunt", estimated_monthly: "$500-$15K", difficulty: "High", time_to_first_income: "3-6 months" },
    { title: "Course Creation", platform: "Udemy", estimated_monthly: "$1K-$10K", difficulty: "Medium", time_to_first_income: "1-2 months" },
  ],
  resources: [
    { skill: "TensorFlow", title: "TensorFlow Developer Certificate", platform: "Google", type: "certification", rating: 4.7, duration: "4 months", salary_uplift: "+$18K" },
    { skill: "PyTorch", title: "PyTorch for Deep Learning", platform: "fast.ai", type: "course", rating: 4.9, duration: "8 weeks", salary_uplift: "+$20K" },
    { skill: "MLOps", title: "MLOps Specialization", platform: "Coursera", type: "course", rating: 4.6, duration: "4 months", salary_uplift: "+$28K" },
    { skill: "AWS", title: "AWS Solutions Architect", platform: "AWS", type: "certification", rating: 4.7, duration: "3 months", salary_uplift: "+$25K" },
  ],
  growthTrajectory: [
    { year: 2024, level: "L3", label: "Mid-Level", projected_salary: 82000 },
    { year: 2025, level: "L4", label: "Senior", projected_salary: 105000 },
    { year: 2026, level: "L4", label: "Senior", projected_salary: 115000 },
    { year: 2027, level: "L5", label: "Staff/Lead", projected_salary: 138000 },
  ]
};

async function apiCall(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: { "Content-Type": "application/json" }, ...options });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch { return null; }
}

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────

const Pill = ({ children, color = "blue" }) => {
  const map = {
    blue: [C.blueLight, C.blue, C.blueBorder],
    orange: [C.orangeLight, C.orange, C.orangeBorder],
    purple: [C.purpleLight, C.purple, C.purpleBorder],
    pink: [C.pinkLight, C.pink, C.pinkBorder],
    green: [C.greenLight, C.green, C.greenBorder],
    muted: ["#F1F5F9", C.textMuted, C.border],
  };
  const [bg, fg, bd] = map[color] || map.blue;
  return (
    <span style={{
      background: bg, color: fg, border: `1px solid ${bd}`,
      padding: "2px 10px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 600, letterSpacing: "0.3px", display: "inline-block", whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
};

const Card = ({ children, style = {}, elevated = false, onClick }) => (
  <div onClick={onClick} style={{
    background: C.bgCard, border: `1px solid ${C.border}`,
    borderRadius: "14px", padding: "20px",
    boxShadow: elevated ? C.shadowMd : C.shadow,
    transition: "box-shadow 0.2s, border-color 0.2s",
    ...(onClick ? { cursor: "pointer" } : {}), ...style
  }}
    onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = C.shadowLg; e.currentTarget.style.borderColor = C.blueBorder; } : undefined}
    onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = elevated ? C.shadowMd : C.shadow; e.currentTarget.style.borderColor = C.border; } : undefined}
  >{children}</div>
);

const StatCard = ({ icon: Icon, label, value, sub, color = C.blue, delay = 0 }) => (
  <Card style={{ animationDelay: `${delay}ms`, animation: "fadeUp 0.5s ease both" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ color: C.textMuted, fontSize: "12px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: C.text }}>{value}</div>
        {sub && <div style={{ color, fontSize: "12px", marginTop: "4px", fontWeight: 600 }}>{sub}</div>}
      </div>
      <div style={{ background: `${color}18`, padding: "10px", borderRadius: "10px", border: `1px solid ${color}30` }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </Card>
);

const SectionHeader = ({ title, sub, icon: Icon, action }) => (
  <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        {Icon && <div style={{ background: C.blueLight, padding: "8px", borderRadius: "8px", border: `1px solid ${C.blueBorder}` }}><Icon size={18} color={C.blue} /></div>}
        <h2 style={{ fontWeight: 800, fontSize: "20px", color: C.text }}>{title}</h2>
      </div>
      {sub && <p style={{ color: C.textMuted, fontSize: "13px", marginLeft: Icon ? "42px" : "0", lineHeight: 1.6 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

const SkillTag = ({ skill, status }) => {
  const cfg = {
    have: { bg: C.greenLight, color: C.green, bd: C.greenBorder, icon: "✓" },
    missing: { bg: C.orangeLight, color: C.orange, bd: C.orangeBorder, icon: "✕" },
    priority: { bg: C.blueLight, color: C.blue, bd: C.blueBorder, icon: "★" },
  };
  const c = cfg[status] || cfg.have;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.bd}`,
      padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: "4px", margin: "3px"
    }}>
      <span style={{ fontSize: "10px" }}>{c.icon}</span> {skill}
    </span>
  );
};

const ScoreRing = ({ score, size = 120, color = C.blue, label }) => {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}20`} strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s ease" }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
          style={{
            fill: C.text, fontSize: "18px", fontWeight: 800,
            transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`
          }}>
          {score}
        </text>
      </svg>
      {label && <div style={{ color: C.textMuted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px" }}>{label}</div>}
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = C.blue, height = 6 }) => (
  <div style={{ height, background: C.bgSection, borderRadius: height / 2, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`, height: "100%",
      background: color, borderRadius: height / 2, transition: "width 1.2s ease"
    }} />
  </div>
);

const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: "4px", marginLeft: "6px" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: "50%", background: C.blue,
        animation: "blink 1.2s ease infinite", animationDelay: `${i * 0.2}s`, display: "inline-block"
      }} />
    ))}
  </span>
);

const Divider = () => <div style={{ height: 1, background: C.border, margin: "16px 0" }} />;

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = ({ onStart }) => {
  const [form, setForm] = useState({
    name: "", email: "", current_role: "Software Engineer", experience_years: 3,
    current_salary: 85000, target_role: "Machine Learning Engineer", skills: "", location: "US"
  });
  const [step, setStep] = useState(1);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleContinue = () => {
    if (step < 2) { setStep(2); return; }
    onStart({ ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) });
  };

  const roles = ["Software Engineer", "Data Scientist", "ML Engineer", "Frontend Developer", "Backend Developer", "DevOps Engineer", "Product Manager", "Data Engineer"];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", background: `linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F5F3FF 100%)`,
      position: "relative", overflow: "hidden"
    }}>

      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%", width: 500, height: 500,
        background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-5%", width: 400, height: 400,
        background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 520, animation: "fadeUp 0.5s ease both", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              padding: 12, borderRadius: 14, boxShadow: `0 8px 20px rgba(37,99,235,0.25)`
            }}>
              <Brain size={28} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 26, color: C.text }}>Career<span style={{ color: C.blue }}>IQ</span></div>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Pro Platform</div>
            </div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(22px,4vw,32px)", color: C.text, lineHeight: 1.2, marginBottom: 10 }}>
            AI-Driven Career<br />
            <span style={{
              background: `linear-gradient(135deg,${C.blue},${C.purple})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>Growth Intelligence</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>
            Salary normalization · Skill gap analysis · Upward-only job matching
          </p>
        </div>

        {/* Card */}
        <Card elevated style={{ padding: 28 }}>
          {/* Steps */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", background: s <= step ? C.blue : "#E2E8F0",
                  color: s <= step ? "white" : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>{s}</div>
                {s < 2 && <div style={{ flex: 1, height: 2, background: step > 1 ? "#2563EB" : "#E2E8F0", borderRadius: 1 }} />}
                <div style={{ fontSize: 12, color: s <= step ? C.blue : C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {s === 1 ? "Basic Info" : "Skills & Goals"}
                </div>
              </div>
            ))}
          </div>

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>👋 Tell us about yourself</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Full Name</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Alex Chen" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Email</label>
                  <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="alex@email.com" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Current Role</label>
                <select value={form.current_role} onChange={e => set("current_role", e.target.value)}>
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>
                    Years of Experience: <strong style={{ color: C.blue }}>{form.experience_years}</strong>
                  </label>
                  <input type="range" min={0} max={20} value={form.experience_years} onChange={e => set("experience_years", +e.target.value)}
                    style={{ width: "100%", accentColor: C.blue }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>
                    Current Salary: <strong style={{ color: C.blue }}>${Math.round(form.current_salary / 1000)}K</strong>
                  </label>
                  <input type="range" min={30000} max={500000} step={5000} value={form.current_salary}
                    onChange={e => set("current_salary", +e.target.value)} style={{ width: "100%", accentColor: C.blue }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>🎯 Your goals & skills</div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Target Role</label>
                <select value={form.target_role} onChange={e => set("target_role", e.target.value)}>
                  {["Machine Learning Engineer", "Senior Software Engineer", "Staff Engineer", "Data Engineer", "AI Research Scientist", "Engineering Manager", "Principal Engineer"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>Location</label>
                <select value={form.location} onChange={e => set("location", e.target.value)}>
                  {["US", "UK", "Canada", "Germany", "India", "Singapore", "Remote"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, display: "block", fontWeight: 600 }}>
                  Current Skills <span style={{ fontWeight: 400 }}>(comma-separated)</span>
                </label>
                <textarea rows={3} value={form.skills} onChange={e => set("skills", e.target.value)}
                  placeholder="Python, Docker, Kubernetes, AWS, SQL, React..." />
              </div>
              {/* Trust badges */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                {[["🔒", "Privacy First"], ["⚡", "Instant Analysis"], ["📊", "L1–L10 Scale"]].map(([i, t]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
                    <span>{i}</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {step === 2 && (
              <button onClick={() => setStep(1)} style={{
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.textMuted, padding: "11px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>
                ← Back
              </button>
            )}
            <button onClick={handleContinue} style={{
              flex: 1,
              background: `linear-gradient(135deg,${C.blue},${C.purple})`,
              color: "white", border: "none", padding: "12px 20px", borderRadius: 8, cursor: "pointer",
              fontSize: 14, fontWeight: 700, boxShadow: `0 4px 12px rgba(37,99,235,0.3)`
            }}>
              {step === 1 ? "Continue →" : "🚀 Analyze My Career"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onNavigate }) => {
  const salary = user.current_salary || 85000;
  const salaryData = [
    { month: "Sep", salary: Math.round(salary * 0.88 / 1000) }, { month: "Oct", salary: Math.round(salary * 0.91 / 1000) },
    { month: "Nov", salary: Math.round(salary * 0.94 / 1000) }, { month: "Dec", salary: Math.round(salary * 0.96 / 1000) },
    { month: "Jan", salary: Math.round(salary * 0.99 / 1000) }, { month: "Feb", salary: Math.round(salary / 1000) },
  ];
  const radarData = [
    { dim: "Technical", score: 78 }, { dim: "Leadership", score: 55 }, { dim: "Communication", score: 70 },
    { dim: "Domain", score: 65 }, { dim: "Learning", score: 82 },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      {/* Welcome */}
      <div style={{
        marginBottom: 24, padding: "20px 24px",
        background: `linear-gradient(135deg,${C.blue}08,${C.purple}06)`,
        border: `1px solid ${C.blueBorder}`, borderRadius: 16
      }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>
          Welcome back, {user.name || "there"} 👋
        </div>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6 }}>
          {user.current_role} · {user.experience_years}y exp · ${Math.round(salary / 1000)}K current salary
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon={Gauge} label="Career Score" value="74/100" sub="↑ +3 this month" color={C.blue} delay={0} />
        <StatCard icon={DollarSign} label="Salary Level" value="L4 Senior" sub={`$${Math.round(salary / 1000)}K/yr`} color={C.purple} delay={80} />
        <StatCard icon={Target} label="Skill Match" value="62%" sub="vs. target role" color={C.orange} delay={160} />
        <StatCard icon={TrendingUp} label="Market Demand" value="High" sub="Your skills trending ↑" color={C.green} delay={240} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>💰 Salary Progression (6 Months)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salaryData}>
              <defs>
                <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CH.blue} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CH.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} />
              <Area type="monotone" dataKey="salary" stroke={CH.blue} fill="url(#salGrad)" strokeWidth={2} name="$K" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📡 Career Dimensions</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: C.textMuted }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="score" stroke={CH.purple} fill={CH.purple} fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>⚡ Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          {[
            { label: "Analyze Resume", icon: Upload, color: C.blue, page: "resume" },
            { label: "Skill Gap Check", icon: Target, color: C.purple, page: "skills" },
            { label: "Browse Jobs", icon: Briefcase, color: C.orange, page: "jobs" },
            { label: "Market Insights", icon: BarChart2, color: C.pink, page: "market" },
            { label: "Career Forecast", icon: TrendingUp, color: C.green, page: "forecast" },
            { label: "Interview Prep", icon: MessageSquare, color: C.blue, page: "interview" },
          ].map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: `${a.color}08`, border: `1px solid ${a.color}25`, borderRadius: 10,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%"
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}15`; e.currentTarget.style.borderColor = `${a.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; e.currentTarget.style.borderColor = `${a.color}25`; }}>
              <a.icon size={16} color={a.color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── RESUME ANALYSIS ──────────────────────────────────────────────────────────
const ResumeAnalysis = ({ user }) => {
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleResume = `John Smith — Software Engineer
john@email.com | github.com/johnsmith

EXPERIENCE
Senior Software Engineer @ Tech Corp (2021-Present)
- Built ML pipelines using Python, TensorFlow, and Docker
- Scaled microservices on AWS using Kubernetes
- Reduced API latency by 40% using Redis caching

SKILLS
Python, JavaScript, React, Node.js, SQL, PostgreSQL, Docker, 
Kubernetes, AWS, TensorFlow, Pandas, NumPy, Git, Linux

EDUCATION
B.S. Computer Science — State University, 2020`;

  const analyze = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    const data = await apiCall("/api/resume/analyze", { method: "POST", body: JSON.stringify({ resume_text: resumeText, user_id: "demo" }) });
    if (data) { setResult(data); }
    else {
      setResult({
        parsing: { extracted_skills: user.skills || ["Python", "React", "SQL"], estimated_experience_years: user.experience_years, anonymized: true },
        salary_estimation: { estimated_salary: user.current_salary * 1.12, low_range: user.current_salary * 0.9, high_range: user.current_salary * 1.3, normalization: { level: "L4", label: "Senior", normalized_score: 0.42, percentile: 42 }, market_alignment_index: 0.84 },
        skill_gap: MOCK.skillGap, ats_score: 74, resume_quality_score: 71,
        recommendations: ["Add quantified achievements (%, $, x)", "Include relevant certifications", "Expand on leadership experience", "Add GitHub / portfolio links", "Use action verbs at bullet starts"]
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Resume Analysis" sub="AI-powered parsing, salary estimation and ATS optimization" icon={Upload} />
      {!result ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Paste your resume text</div>
            <textarea rows={16} value={resumeText} onChange={e => setResumeText(e.target.value)}
              placeholder="Paste resume content here..." style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setResumeText(sampleResume)} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Use Sample
              </button>
              <button onClick={analyze} disabled={loading || !resumeText.trim()} style={{ flex: 1, background: loading || !resumeText.trim() ? C.border : `linear-gradient(135deg,${C.blue},${C.purple})`, color: loading || !resumeText.trim() ? C.textMuted : "white", border: "none", padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: resumeText.trim() ? "pointer" : "not-allowed" }}>
                {loading ? <span>Analyzing <LoadingDots /></span> : "⚡ Analyze Resume"}
              </button>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ icon: "🔒", t: "Privacy-First", d: "PII auto-stripped — name, email, phone never stored" }, { icon: "🧠", t: "NLP Skill Extraction", d: "Identifies 150+ skills from natural resume text" }, { icon: "💰", t: "Salary Normalization", d: "Maps to L1–L10 bands for accurate market comparison" }, { icon: "📊", t: "ATS Scoring", d: "Compatibility score + improvement suggestions" }].map(f => (
              <Card key={f.t} style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{f.t}</div>
                    <div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>{f.d}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <StatCard icon={Award} label="ATS Score" value={`${result.ats_score}/100`} sub={result.ats_score > 75 ? "✓ ATS Friendly" : "⚠ Needs Work"} color={result.ats_score > 75 ? C.green : C.orange} />
            <StatCard icon={Star} label="Resume Quality" value={`${result.resume_quality_score}/100`} sub="Structure & impact" color={C.blue} />
            <StatCard icon={DollarSign} label="Est. Salary" value={`$${Math.round(result.salary_estimation.estimated_salary / 1000)}K`} sub={`Range: $${Math.round(result.salary_estimation.low_range / 1000)}K-$${Math.round(result.salary_estimation.high_range / 1000)}K`} color={C.purple} />
            <StatCard icon={BarChart2} label="Market Alignment" value={`${Math.round(result.salary_estimation.market_alignment_index * 100)}%`} sub={`Level ${result.salary_estimation.normalization.level}`} color={C.green} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>🔍 Extracted Skills</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}><span style={{ color: C.green, fontWeight: 600 }}>✓ Anonymized</span> · {result.parsing.estimated_experience_years}y experience</div>
              <div>{result.parsing.extracted_skills.map(s => <SkillTag key={s} skill={s} status="have" />)}</div>
            </Card>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>🎯 ATS Optimization Tips</div>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ background: C.blueLight, color: C.blue, width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{r}</div>
                </div>
              ))}
            </Card>
          </div>
          <button onClick={() => setResult(null)} style={{ alignSelf: "flex-start", background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            ← Analyze another
          </button>
        </div>
      )}
    </div>
  );
};

// ─── SALARY INTELLIGENCE ──────────────────────────────────────────────────────
const SalaryIntelligence = ({ user }) => {
  const levels = Object.entries(MOCK.salaryLevels);
  const salary = user.current_salary || 85000;
  const getLevel = s => { for (const [l, d] of levels) if (s >= d.range[0] && s < d.range[1]) return l; return "L10"; };
  const currentLevel = getLevel(salary);
  const currentIdx = levels.findIndex(([k]) => k === currentLevel);
  const normScore = currentIdx / (levels.length - 1);

  const barData = levels.map(([l, d]) => ({ level: l, label: d.label, mid: Math.round((d.range[0] + d.range[1]) / 2 / 1000), isCurrent: l === currentLevel }));
  const colors = [CH.blue, CH.blue, CH.orange, CH.orange, CH.purple, CH.purple, CH.pink, CH.pink, CH.green, CH.green];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Salary Intelligence" sub="Your normalized salary position (L1–L10) vs. the market" icon={DollarSign} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card elevated style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32, gap: 16 }}>
          <ScoreRing score={Math.round(normScore * 100)} size={140} color={C.blue} label="SALARY SCORE" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{currentLevel}</div>
            <div style={{ fontSize: 16, color: C.textMid, fontWeight: 600 }}>{MOCK.salaryLevels[currentLevel]?.label}</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>${Math.round(salary / 1000)}K / year</div>
          </div>
          <div style={{ width: "100%", background: C.bgSection, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              <span>Percentile</span><span style={{ color: C.blue, fontWeight: 700 }}>{Math.round(normScore * 100)}th</span>
            </div>
            <ProgressBar value={normScore * 100} color={C.blue} height={8} />
          </div>
        </Card>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Market Salary by Level</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.textMuted }} unit="K" />
              <YAxis type="category" dataKey="level" tick={{ fontSize: 11, fill: C.textMuted }} width={30} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="mid" radius={[0, 4, 4, 0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.isCurrent ? C.blue : colors[i]} opacity={e.isCurrent ? 1 : 0.5} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {levels.map(([l, d], i) => (
          <div key={l} style={{
            background: l === currentLevel ? C.blueLight : C.bgCard,
            border: `1px solid ${l === currentLevel ? C.blueBorder : C.border}`,
            borderRadius: 10, padding: "12px 14px", textAlign: "center",
            boxShadow: l === currentLevel ? `0 0 0 2px ${C.blue}30` : C.shadow
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: l === currentLevel ? C.blue : C.text }}>{l}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{d.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMid }}>${Math.round(d.range[0] / 1000)}K–${Math.round(d.range[1] / 1000)}K</div>
            {l === currentLevel && <div style={{ fontSize: 9, color: C.blue, fontWeight: 700, marginTop: 3 }}>← YOU ARE HERE</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── JOB MATCHING ─────────────────────────────────────────────────────────────
const JobMatching = ({ user }) => {
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    const data = await apiCall("/api/jobs/match", { method: "POST", body: JSON.stringify({ user_id: "demo", current_salary: user.current_salary || 85000, skills: user.skills || [] }) });
    setJobs(data?.matches || MOCK.jobs);
    setLoading(false);
  };

  useEffect(() => { loadJobs(); }, []);

  const scoreColor = s => s >= 85 ? C.green : s >= 70 ? C.blue : C.orange;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Job Matching" sub="Advancement-only jobs — every result pays more than your current level" icon={Briefcase}
        action={<button onClick={loadJobs} style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><RefreshCw size={13} /> Refresh</button>} />

      <div style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <ArrowUpRight size={16} color={C.blue} />
        <span style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>Advancement Guaranteed — all jobs shown pay above your current salary level (L{Math.ceil((user.current_salary || 85000) / 40000)})</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Loading jobs <LoadingDots /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(jobs || MOCK.jobs).map(job => (
            <Card key={job.id} onClick={() => { }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{job.title}</div>
                    <Pill color="blue">{job.salary_normalization?.level || job.match?.salary_normalization?.level}</Pill>
                    {(job.match?.advancement_guaranteed) && <Pill color="green">↑ Advancement</Pill>}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: C.textMuted, marginBottom: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={12} />{job.company}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{job.location}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={12} />
                      ${Math.round(job.salary_range[0] / 1000)}K–${Math.round(job.salary_range[1] / 1000)}K</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(job.match?.matched_skills || []).map(s => <SkillTag key={s} skill={s} status="have" />)}
                    {(job.match?.missing_skills || []).map(s => <SkillTag key={s} skill={s} status="missing" />)}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <ScoreRing score={Math.round(job.match?.score || 75)} size={80} color={scoreColor(job.match?.score || 75)} label="MATCH" />
                  <button style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Apply →
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SKILL GAP ANALYSIS ───────────────────────────────────────────────────────
const SkillGapAnalysis = ({ user }) => {
  const [gap, setGap] = useState(MOCK.skillGap);
  const [target, setTarget] = useState(user.target_role || "Machine Learning Engineer");

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Skill Gap Analysis" sub="See exactly what skills stand between you and your target role" icon={Target} />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <select value={target} onChange={e => setTarget(e.target.value)} style={{ maxWidth: 280 }}>
          {["Machine Learning Engineer", "Senior Software Engineer", "Data Engineer", "DevOps Engineer", "Staff Engineer"].map(r => <option key={r}>{r}</option>)}
        </select>
        <button onClick={() => setGap(MOCK.skillGap)} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          Analyze Gap
        </button>
      </div>

      {/* Score rings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "MATCH SCORE", score: Math.round(gap.match_score), color: C.blue },
          { label: "SKILLS OWNED", score: Math.round(gap.skills_have.length / (gap.skills_have.length + gap.skills_missing.length) * 100), color: C.green },
          { label: "GAP SCORE", score: Math.round(gap.skills_missing.length / (gap.skills_have.length + gap.skills_missing.length) * 100), color: C.orange },
        ].map(r => (
          <Card key={r.label} style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <ScoreRing score={r.score} size={100} color={r.color} label={r.label} />
          </Card>
        ))}
      </div>

      {/* Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>✅ Skills You Have</div>
          <div>{gap.skills_have.map(s => <SkillTag key={s} skill={s} status="have" />)}</div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>❌ Skills to Learn</div>
          <div>{gap.skills_missing.map(s => <SkillTag key={s} skill={s} status={gap.skills_priority.includes(s) ? "priority" : "missing"} />)}</div>
        </Card>
      </div>

      {/* Learning resources */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📚 Recommended Learning Path</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
          {MOCK.resources.map(r => (
            <div key={r.title} style={{ background: C.bgSection, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Pill color="blue">{r.type}</Pill>
                <Pill color="green">{r.salary_uplift}</Pill>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{r.platform} · {r.duration} · ⭐ {r.rating}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── MARKET INSIGHTS ──────────────────────────────────────────────────────────
const MarketInsights = () => {
  const demandData = MOCK.market.trending_skills.map((s, i) => ({ skill: s.skill, growth: parseInt(s.demand_growth), premium: parseInt(s.avg_salary_premium.replace(/[$K]/g, "")), fill: [CH.blue, CH.orange, CH.purple, CH.pink, CH.green][i] }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Market Insights" sub="Real-time demand trends, salary premiums and top hiring companies" icon={BarChart2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📈 Skill Demand Growth</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="skill" tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} unit="%" />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                {demandData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>💰 Salary Premium by Skill</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demandData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.textMuted }} unit="K" />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 10, fill: C.textMuted }} width={90} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="premium" radius={[0, 4, 4, 0]}>
                {demandData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📊 Salary Benchmarks</div>
          {Object.entries(MOCK.market.salary_benchmarks).map(([k, v], i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, textTransform: "capitalize" }}>{k.replace("_", " ")}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.textMid }}>{v.range}</span>
                <Pill color="green">{v.yoy_growth}</Pill>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>🏢 Top Hiring Companies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOCK.market.top_hiring_companies.map((c, i) => (
              <span key={c} style={{
                background: [C.blueLight, C.orangeLight, C.purpleLight, C.pinkLight, C.greenLight][i % 5],
                color: [C.blue, C.orange, C.purple, C.pink, C.green][i % 5],
                border: `1px solid ${[C.blueBorder, C.orangeBorder, C.purpleBorder, C.pinkBorder, C.greenBorder][i % 5]}`,
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700
              }}>
                {c}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── CAREER GROWTH FORECAST ───────────────────────────────────────────────────
const CareerGrowthForecast = ({ user }) => {
  const base = user.current_salary || 85000;
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  const scenarios = {
    conservative: years.map((y, i) => ({ year: y, salary: Math.round(base * Math.pow(1.06, i) / 1000) })),
    moderate: years.map((y, i) => ({ year: y, salary: Math.round(base * Math.pow(1.12, i) / 1000) })),
    aggressive: years.map((y, i) => ({ year: y, salary: Math.round(base * Math.pow(1.20, i) / 1000) })),
  };
  const chartData = years.map((y, i) => ({ year: y, conservative: scenarios.conservative[i].salary, moderate: scenarios.moderate[i].salary, aggressive: scenarios.aggressive[i].salary }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Career Growth Forecast" sub="3-scenario salary trajectory over 5 years based on your growth rate" icon={TrendingUp} />
      <Card elevated style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>5-Year Salary Projection ($K)</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          {[["Conservative", "6%/yr", CH.blue], ["Moderate", "12%/yr", CH.purple], ["Aggressive", "20%/yr", CH.orange]].map(([l, r, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: c }} />
              <span style={{ fontWeight: 600, color: C.textMid }}>{l}</span> <span>{r}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis tick={{ fontSize: 11, fill: C.textMuted }} unit="K" />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="conservative" stroke={CH.blue} strokeWidth={2} dot={false} name="Conservative" />
            <Line type="monotone" dataKey="moderate" stroke={CH.purple} strokeWidth={2} dot={false} name="Moderate" />
            <Line type="monotone" dataKey="aggressive" stroke={CH.orange} strokeWidth={2} dot={false} name="Aggressive" strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        {MOCK.growthTrajectory.map((g, i) => (
          <Card key={g.year}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Pill color={["blue", "purple", "orange", "green"][i % 4]}>{g.level}</Pill>
              <span style={{ fontSize: 12, color: C.textMuted }}>{g.year}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 2 }}>{g.label}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>${Math.round(g.projected_salary / 1000)}K / yr</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── INTERVIEW PREP ───────────────────────────────────────────────────────────
const InterviewPrep = ({ user }) => {
  const [cat, setCat] = useState("technical");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [selectedQ, setSelectedQ] = useState(null);

  const questions = {
    technical: [
      { q: "Explain the difference between supervised and unsupervised learning", hint: "Cover labeling, examples, use cases" },
      { q: "How would you design a recommendation system at scale?", hint: "Data pipeline, ML model, serving" },
      { q: "What is gradient descent and how does it work?", hint: "Optimization, learning rate, convergence" },
    ],
    behavioral: [
      { q: "Tell me about a time you led a cross-functional project", hint: "STAR method: Situation, Task, Action, Result" },
      { q: "How do you handle disagreements with your tech lead?", hint: "Collaboration, data-driven, respectful" },
    ],
    salary: [
      { q: "What are your salary expectations?", hint: "Research market, give range, anchor high" },
      { q: "How do you justify a 30% salary increase?", hint: "Value delivered, market data, ROI" },
    ],
    role: [
      { q: `Why do you want to move into ${user.target_role || "this role"}?`, hint: "Alignment with skills, growth, passion" },
      { q: "Where do you see yourself in 3 years?", hint: "Concrete goals, leadership, impact" },
    ]
  };

  const cats = [{ id: "technical", label: "💻 Technical" }, { id: "behavioral", label: "🤝 Behavioral" }, { id: "salary", label: "💰 Salary Nego" }, { id: "role", label: "🎯 Role-Specific" }];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Interview Prep" sub="Practice real questions with AI feedback — guidance only, no employer communication" icon={MessageSquare} />
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => { setCat(c.id); setSelectedQ(null); setAnswer(""); setFeedback(null); }} style={{
            padding: "9px 16px", borderRadius: 8, border: `1px solid ${cat === c.id ? C.blueBorder : C.border}`,
            background: cat === c.id ? C.blueLight : "transparent", color: cat === c.id ? C.blue : C.textMuted,
            cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s"
          }}>{c.label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          {(questions[cat] || []).map((q, i) => (
            <Card key={i} onClick={() => { setSelectedQ(q); setAnswer(""); setFeedback(null); }}
              style={{ marginBottom: 10, borderColor: selectedQ?.q === q.q ? C.blueBorder : C.border, background: selectedQ?.q === q.q ? C.blueLight : C.bgCard }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: selectedQ?.q === q.q ? C.blue : C.text, marginBottom: 4 }}>{q.q}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>💡 {q.hint}</div>
            </Card>
          ))}
        </div>
        <div>
          {selectedQ ? (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>Your Answer</div>
              <textarea rows={6} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer..." style={{ resize: "none" }} />
              <button onClick={() => setFeedback({ score: 82, tips: ["Good structure", "Add specific metrics", "Mention team impact", "Stronger closing"] })}
                style={{ marginTop: 10, background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, width: "100%" }}>
                Get AI Feedback
              </button>
              {feedback && (
                <div style={{ marginTop: 12, background: C.blueLight, borderRadius: 10, padding: 14, border: `1px solid ${C.blueBorder}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: C.text }}>Feedback</span>
                    <Pill color="blue">Score: {feedback.score}/100</Pill>
                  </div>
                  {feedback.tips.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ color: C.blue, fontWeight: 700, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 13, color: C.textMid }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <MessageSquare size={32} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} />
              <div style={{ color: C.textMuted, fontSize: 13 }}>Select a question to start practicing</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── PROGRESS TRACKER ─────────────────────────────────────────────────────────
const ProgressTracker = ({ user }) => {
  const [tab, setTab] = useState("skills");
  const skillsData = (MOCK.skillGap.skills_have || []).map((s, i) => ({ skill: s, progress: 60 + i * 8, learned: i < 3 }));
  const historyData = [{ month: "Oct", score: 58 }, { month: "Nov", score: 63 }, { month: "Dec", score: 67 }, { month: "Jan", score: 70 }, { month: "Feb", score: 74 }];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Progress Tracker" sub="Track skill acquisition, score history, and learning activity" icon={Activity} />
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["skills", "history", "courses"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${tab === t ? C.blueBorder : C.border}`, background: tab === t ? C.blueLight : "transparent", color: tab === t ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "skills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {skillsData.map(s => (
            <Card key={s.skill} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.skill}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{s.progress}%</span>
                  {s.learned && <Pill color="green">Learned</Pill>}
                </div>
              </div>
              <ProgressBar value={s.progress} color={s.learned ? C.green : C.blue} height={8} />
            </Card>
          ))}
        </div>
      )}
      {tab === "history" && (
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Career Score History</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke={CH.blue} strokeWidth={3} dot={{ fill: CH.blue, r: 5 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      {tab === "courses" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {MOCK.resources.map((r, i) => (
            <Card key={r.title}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Pill color={["blue", "purple", "orange", "pink"][i % 4]}>{r.type}</Pill>
                <Pill color="green">{r.salary_uplift}</Pill>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>{r.platform} · {r.duration} · ⭐ {r.rating}</div>
              <ProgressBar value={i === 0 ? 80 : i === 1 ? 35 : 0} color={C.blue} height={6} />
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{i === 0 ? "80%" : i === 1 ? "35%" : "Not started"} complete</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ATS OPTIMIZER ────────────────────────────────────────────────────────────
const ATSOptimizer = ({ user }) => {
  const [resume, setResume] = useState(`${user.experience_years || 4} years experience in ${user.current_role || "Software Engineering"}.\nSkills: ${(user.skills || ["Python", "Docker", "AWS"]).join(", ")}`);
  const [jd, setJd] = useState("Looking for a Senior ML Engineer with Python, TensorFlow, MLOps, Kubernetes experience...");
  const [score, setScore] = useState(null);

  const analyze = () => {
    const keywords = ["python", "tensorflow", "kubernetes", "mlops", "docker", "aws", "pytorch", "sql"];
    const resumeLow = resume.toLowerCase();
    const matched = keywords.filter(k => resumeLow.includes(k));
    const missing = keywords.filter(k => !resumeLow.includes(k));
    setScore({
      overall: Math.round(50 + matched.length * 6), matched, missing,
      dimensions: [{ name: "Keywords", score: 75 }, { name: "Format", score: 85 }, { name: "Clarity", score: 70 }, { name: "Skills Match", score: 65 }, { name: "Experience Fit", score: 80 }]
    });
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="ATS Optimizer" sub="Side-by-side editor — match your resume to any job description" icon={FileText}
        action={<button onClick={analyze} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>⚡ Analyze</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>📄 Your Resume</div>
          <textarea rows={12} value={resume} onChange={e => setResume(e.target.value)} style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} />
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>🎯 Job Description</div>
          <textarea rows={12} value={jd} onChange={e => setJd(e.target.value)} style={{ resize: "none", fontSize: 12, lineHeight: 1.7 }} />
        </Card>
      </div>
      {score && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Score Breakdown</div>
            {score.dimensions.map(d => (
              <div key={d.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{d.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{d.score}%</span>
                </div>
                <ProgressBar value={d.score} color={d.score >= 75 ? C.green : d.score >= 60 ? C.blue : C.orange} height={6} />
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Keyword Analysis</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>✓ Matched Keywords</div>
              <div>{score.matched.map(k => <SkillTag key={k} skill={k} status="have" />)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, marginBottom: 8 }}>✕ Missing Keywords</div>
              <div>{score.missing.map(k => <SkillTag key={k} skill={k} status="missing" />)}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── COMMUNITY BENCHMARKING ───────────────────────────────────────────────────
const CommunityBenchmarking = ({ user }) => {
  const salary = user.current_salary || 85000;
  const distData = [
    { range: "$60-80K", count: 12, fill: CH.blue }, { range: "$80-100K", count: 28, fill: CH.purple },
    { range: "$100-130K", count: 35, fill: CH.orange }, { range: "$130-160K", count: 20, fill: CH.pink }, { range: "$160K+", count: 8, fill: CH.green }
  ];
  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Community Benchmarking" sub="Compare anonymized salary & skills vs. peers — all data privacy-preserving" icon={Users} />
      <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Shield size={16} color={C.green} />
        <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>All peer data is anonymized. No real names or identifiers are ever shown.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card elevated>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Salary Distribution — Peers</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} unit="%" />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>Your Position vs. Peers</div>
          {[{ label: "Salary Percentile", value: "64th", color: C.blue, prog: 64 }, { label: "Skill Coverage", value: "58%", color: C.purple, prog: 58 }, { label: "Experience Rank", value: "Top 40%", color: C.orange, prog: 60 }].map(m => (
            <div key={m.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.value}</span>
              </div>
              <ProgressBar value={m.prog} color={m.color} height={8} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── SIDE HUSTLES ─────────────────────────────────────────────────────────────
const SideHustles = () => (
  <div style={{ animation: "fadeUp 0.4s ease both" }}>
    <SectionHeader title="Side Hustles" sub="Income opportunities matched to your existing skills" icon={Coffee} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
      {MOCK.sideHustles.map((h, i) => (
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

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
const Portfolio = () => {
  const projects = [
    { title: "ML Pipeline Dashboard", stack: ["Python", "Streamlit", "MLflow"], github_score: 87, salary_impact: "+$18K", desc: "End-to-end ML experiment tracker with real-time metrics" },
    { title: "Real-time Anomaly Detector", stack: ["Python", "Kafka", "TensorFlow"], github_score: 92, salary_impact: "+$22K", desc: "Streaming anomaly detection system for IoT sensor data" },
    { title: "NLP Resume Parser API", stack: ["Python", "FastAPI", "spaCy"], github_score: 79, salary_impact: "+$15K", desc: "REST API that extracts structured data from unstructured resumes" },
    { title: "K8s Auto-Scaler", stack: ["Go", "Kubernetes", "Prometheus"], github_score: 84, salary_impact: "+$20K", desc: "Custom HPA operator based on custom business metrics" },
  ];
  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Portfolio Projects" sub="AI-recommended projects to build for maximum career impact" icon={Code} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {projects.map((p, i) => (
          <Card key={p.title} elevated style={{ borderLeft: `4px solid ${[C.blue, C.orange, C.purple, C.pink][i]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Pill color="green">{p.salary_impact}</Pill>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>GitHub Score</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.blue }}>{p.github_score}</span>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10, lineHeight: 1.5 }}>{p.desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {p.stack.map(s => <Pill key={s} color={["blue", "purple", "orange"][p.stack.indexOf(s) % 3]}>{s}</Pill>)}
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
  const [form, setForm] = useState({ name: user.name || "", current_role: user.current_role || "", current_salary: user.current_salary || 85000 });
  const [notifs, setNotifs] = useState({ jobs: true, skills: true, market: false, weekly: true });
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Settings & Privacy" sub="Manage your profile, notifications, and data privacy" icon={Settings} />
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
        <div>
          {[{ id: "profile", icon: User, label: "Profile" }, { id: "notifications", icon: Bell, label: "Notifications" }, { id: "privacy", icon: Shield, label: "Privacy & Data" }, { id: "appearance", icon: Sliders, label: "Preferences" }].map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${sec === s.id ? C.blueBorder : "transparent"}`, background: sec === s.id ? C.blueLight : "transparent", color: sec === s.id ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              <s.icon size={15} />{s.label}
            </button>
          ))}
        </div>
        <div>
          {sec === "profile" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Profile Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5, display: "block" }}>Full Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5, display: "block" }}>Current Role</label><input value={form.current_role} onChange={e => setForm(p => ({ ...p, current_role: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 14 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5, display: "block" }}>Current Salary: <strong style={{ color: C.blue }}>${Math.round(form.current_salary / 1000)}K</strong></label>
                <input type="range" min={30000} max={500000} step={5000} value={form.current_salary} onChange={e => setForm(p => ({ ...p, current_salary: +e.target.value }))} style={{ width: "100%", accentColor: C.blue }} /></div>
              <button onClick={() => onUserUpdate({ ...user, ...form })} style={{ marginTop: 16, background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                Save Changes
              </button>
            </Card>
          )}
          {sec === "notifications" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Notification Settings</div>
              {[{ k: "jobs", l: "New Job Matches" }, { k: "skills", l: "Trending Skills" }, { k: "market", l: "Market Shifts" }, { k: "weekly", l: "Weekly Summary" }].map(n => (
                <div key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>{n.l}</span>
                  <button onClick={() => setNotifs(p => ({ ...p, [n.k]: !p[n.k] }))} style={{ width: 44, height: 24, borderRadius: 12, background: notifs[n.k] ? C.blue : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: notifs[n.k] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </button>
                </div>
              ))}
            </Card>
          )}
          {sec === "privacy" && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Privacy & Data Control</div>
              <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: C.green, marginBottom: 4 }}>🔒 Privacy Protections Active</div>
                <div style={{ fontSize: 12, color: C.green }}>Email stored as SHA-256 hash · PII auto-stripped from resumes · JWT token rotation active</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Export My Data</button>
                {!confirmDel ? (
                  <button onClick={() => setConfirmDel(true)} style={{ background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, color: C.orange, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={14} />Delete Account</button>
                ) : (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: C.orange, fontWeight: 600, fontSize: 13 }}>Are you sure?</span>
                    <button onClick={onLogout} style={{ background: C.orange, color: "white", border: "none", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Yes, Delete</button>
                    <button onClick={() => setConfirmDel(false)} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Cancel</button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ML EXPLAINABILITY ───────────────────────────────────────────────────────
const MLExplainability = ({ user = {} }) => {
  const [view, setView] = useState("salary");

  const salaryFeatures = [
    { feature: "Base Role Salary", value: 105000, contribution: 38.2, direction: "positive" },
    { feature: "Years of Experience", value: 18900, contribution: 15.8, direction: "positive" },
    { feature: "Skill: AWS", value: 12000, contribution: 10.1, direction: "positive" },
    { feature: "Skill: Kubernetes", value: 11000, contribution: 9.2, direction: "positive" },
    { feature: "Skill: Docker", value: 7000, contribution: 5.9, direction: "positive" },
    { feature: "Missing: TensorFlow", value: -8000, contribution: -6.7, direction: "negative" },
    { feature: "Missing: MLOps", value: -12000, contribution: -10.1, direction: "negative" },
    { feature: "Missing: PyTorch", value: -10000, contribution: -8.4, direction: "negative" },
  ];

  const matchFactors = [
    { factor: "Skill Overlap", weight: 0.40, score: 0.72, color: CH.blue },
    { factor: "Experience Relevance", weight: 0.25, score: 0.90, color: CH.purple },
    { factor: "Industry Alignment", weight: 0.15, score: 0.75, color: CH.orange },
    { factor: "Salary Compatibility", weight: 0.20, score: 0.95, color: CH.pink },
  ];

  const cnnLayers = [
    { name: "Input", nodes: 8, desc: "Skills, exp, role, location, edu", color: C.blue },
    { name: "Conv 1", nodes: 16, desc: "Feature pattern extraction", color: C.purple },
    { name: "Conv 2", nodes: 12, desc: "Higher-order combinations", color: C.purple },
    { name: "Dense", nodes: 8, desc: "Salary regression layer", color: C.orange },
    { name: "Output", nodes: 1, desc: "Predicted salary + confidence", color: C.green },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="AI Model Explainability" sub="Full transparency — exactly how the CNN/NLP models predict your salary and match scores" icon={Brain} />
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "salary", l: "💰 Salary Prediction" }, { id: "match", l: "🎯 Match Score" }, { id: "cnn", l: "🧠 CNN Architecture" }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${view === v.id ? C.blueBorder : C.border}`, background: view === v.id ? C.blueLight : "transparent", color: view === v.id ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}>{v.l}</button>
        ))}
      </div>

      {view === "salary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📊 SHAP-Style Feature Contributions</div>
            {salaryFeatures.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 180, fontSize: 11, color: f.direction === "negative" ? C.orange : C.textMid, flexShrink: 0 }}>{f.feature}</div>
                <div style={{ flex: 1, height: 8, background: C.bgSection, borderRadius: 4, position: "relative" }}>
                  <div style={{ position: "absolute", [f.direction === "negative" ? "right" : "left"]: 0, width: `${Math.abs(f.contribution) * 2.5}%`, height: "100%", background: f.direction === "negative" ? C.orange : C.blue, borderRadius: 4 }} />
                </div>
                <div style={{ width: 48, fontSize: 11, textAlign: "right", color: f.direction === "negative" ? C.orange : C.green, fontWeight: 700 }}>
                  {f.direction === "negative" ? "-" : "+"}${Math.abs(f.value / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 2 }}>Estimated Salary</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>${Math.round((user.current_salary || 88000) / 1000)}K <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400 }}>± $8K</span></div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📈 Salary Uplift Opportunities</div>
            {[{ a: "Complete MLOps certification", u: 28000, t: "3 months", p: 92 }, { a: "Add TensorFlow to resume", u: 18000, t: "4 months", p: 87 }, { a: "Switch to a larger company", u: 25000, t: "Job change", p: 71 }, { a: "Add PyTorch project to GitHub", u: 12000, t: "6 weeks", p: 78 }].map((op, i) => (
              <div key={i} style={{ background: C.bgSection, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{op.a}</div>
                  <Pill color="green">+${Math.round(op.u / 1000)}K</Pill>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <ProgressBar value={op.p} color={C.blue} height={4} />
                  <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{op.p}%</span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>⏱ {op.t}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view === "match" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>🔢 Weighted Similarity Formula</div>
            <div style={{ background: C.bgSection, borderRadius: 10, padding: 16, marginBottom: 14, fontFamily: "monospace", fontSize: 12, lineHeight: 2, color: C.textMid }}>
              <div style={{ color: C.textMuted, fontSize: 11 }}>// S(u, j) = Similarity Score</div>
              {matchFactors.map((f, i) => (
                <div key={i} style={{ paddingLeft: 16 }}>
                  <span style={{ color: f.color, fontWeight: 700 }}>{(f.weight * 100).toFixed(0)}%</span>
                  <span style={{ color: C.textMuted }}> × {f.factor}</span>
                  {i < matchFactors.length - 1 && <span style={{ color: C.textMuted }}> +</span>}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matchFactors.map(f => (
                <div key={f.factor}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{f.factor}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{Math.round(f.score * 100)}%</span>
                  </div>
                  <ProgressBar value={f.score * 100} color={f.color} height={6} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📐 Composite Score Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={matchFactors.map(f => ({ name: f.factor, value: f.weight * 100, color: f.color }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {matchFactors.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ background: C.blueLight, borderRadius: 10, padding: 14, border: `1px solid ${C.blueBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Composite Score</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: C.blue }}>{Math.round(matchFactors.reduce((s, f) => s + f.weight * f.score, 0) * 100)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === "cnn" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 20 }}>🧠 CNN Salary Prediction Architecture</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {cnnLayers.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: `${l.color}12`, border: `1px solid ${l.color}40`, borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: l.color, marginBottom: 4 }}>{l.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>{l.nodes}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.4 }}>{l.desc}</div>
                </div>
                {i < cnnLayers.length - 1 && <ChevronRight size={18} color={C.textLight} />}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── ADVANCED JOB SEARCH ──────────────────────────────────────────────────────
const AdvancedJobSearch = ({ user }) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ remote: false, minSalary: 100000, sort: "match" });
  const [results, setResults] = useState(null);

  const search = () => {
    const filtered = MOCK.jobs.filter(j => {
      if (filters.remote && !j.location.toLowerCase().includes("remote")) return false;
      if (j.salary_range[1] < filters.minSalary) return false;
      return true;
    });
    setResults(filtered);
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Advanced Job Search" sub="Multi-filter search — all results show salary advancement only" icon={Search} />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", flex: 1, gap: 8, alignItems: "center", minWidth: 200 }}>
            <Search size={16} color={C.textMuted} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search role, company, skill..." style={{ border: "none", outline: "none", fontSize: 13, color: C.text, background: "transparent", width: "100%" }} />
          </div>
          <Divider />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Remote Only</span>
            <button onClick={() => setFilters(p => ({ ...p, remote: !p.remote }))} style={{ width: 40, height: 22, borderRadius: 11, background: filters.remote ? C.blue : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: filters.remote ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Min: ${Math.round(filters.minSalary / 1000)}K</span>
            <input type="range" min={50000} max={300000} step={10000} value={filters.minSalary}
              onChange={e => setFilters(p => ({ ...p, minSalary: +e.target.value }))} style={{ width: 80, accentColor: C.blue }} />
          </div>
          <button onClick={search} style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={14} /> Search
          </button>
        </div>
      </Card>

      {results ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 13, color: C.textMuted }}>{results.length} results</div>
          {results.map(job => (
            <Card key={job.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{job.title}</div>
                    <Pill color="blue">{job.match?.salary_normalization?.level}</Pill>
                    <Pill color="green">↑ Advancement</Pill>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: C.textMuted, marginBottom: 10, flexWrap: "wrap" }}>
                    <span>{job.company}</span><span>{job.location}</span>
                    <span>${Math.round(job.salary_range[0] / 1000)}K–${Math.round(job.salary_range[1] / 1000)}K</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {job.match?.matched_skills?.map(s => <SkillTag key={s} skill={s} status="have" />)}
                    {job.match?.missing_skills?.map(s => <SkillTag key={s} skill={s} status="missing" />)}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <ScoreRing score={Math.round(job.match?.score || 75)} size={75} color={C.blue} label="MATCH" />
                  <button style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Apply →</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <Search size={36} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: C.textMid, marginBottom: 6 }}>Search for your next role</div>
          <div style={{ color: C.textMuted, fontSize: 13 }}>All results show advancement-only positions</div>
        </Card>
      )}
    </div>
  );
};

// ─── RESUME BUILDER ───────────────────────────────────────────────────────────
const ResumeBuilder = ({ user }) => {
  const [sections, setSections] = useState({
    summary: `${user.experience_years || 4}+ years in ${user.current_role || "software engineering"}, specializing in scalable systems and cloud infrastructure.`,
    experience: [
      { title: "Senior Software Engineer", company: "TechCorp", period: "2022–Present", bullets: ["Built ML pipelines processing 10M events/day using Python and Apache Spark", "Reduced API latency by 40% through Redis caching", "Led Kubernetes migration cutting infra costs by 30%"] },
      { title: "Software Engineer", company: "StartupXYZ", period: "2020–2022", bullets: ["Developed React frontend serving 50K+ daily active users", "Implemented CI/CD with GitHub Actions, reducing deploy time by 75%"] },
    ],
    skills: (user.skills || ["Python", "Docker", "Kubernetes", "AWS", "SQL", "React"]).join(", "),
    education: "B.S. Computer Science — State University, 2020",
  });
  const [atsScore, setAtsScore] = useState(71);

  const updateBullet = (ei, bi, v) => {
    const ne = [...sections.experience]; ne[ei].bullets[bi] = v;
    setSections(p => ({ ...p, experience: ne }));
    setAtsScore(prev => Math.min(100, prev + (v.match(/\d/) ? 2 : -1)));
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Live Resume Builder" sub="Real-time ATS scoring with keyword and impact analysis" icon={Edit3}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: atsScore >= 75 ? C.greenLight : C.orangeLight, border: `1px solid ${atsScore >= 75 ? C.greenBorder : C.orangeBorder}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 800, color: atsScore >= 75 ? C.green : C.orange }}>ATS: {atsScore}/100</div>
            <button style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={13} /> Export
            </button>
          </div>
        } />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Summary */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>📝 Professional Summary</div>
              <Pill color={sections.summary.split(" ").length > 30 ? "green" : "orange"}>{sections.summary.split(" ").length} words</Pill>
            </div>
            <textarea rows={4} value={sections.summary} onChange={e => setSections(p => ({ ...p, summary: e.target.value }))} style={{ resize: "none", fontSize: 13, lineHeight: 1.7 }} />
          </Card>
          {/* Experience */}
          {sections.experience.map((exp, ei) => (
            <Card key={ei}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px", gap: 8, marginBottom: 12 }}>
                <input value={exp.title} onChange={e => { const ne = [...sections.experience]; ne[ei].title = e.target.value; setSections(p => ({ ...p, experience: ne })); }} placeholder="Job Title" style={{ fontWeight: 700 }} />
                <input value={exp.company} onChange={e => { const ne = [...sections.experience]; ne[ei].company = e.target.value; setSections(p => ({ ...p, experience: ne })); }} placeholder="Company" />
                <input value={exp.period} onChange={e => { const ne = [...sections.experience]; ne[ei].period = e.target.value; setSections(p => ({ ...p, experience: ne })); }} placeholder="Period" />
              </div>
              {exp.bullets.map((b, bi) => (
                <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.blue, paddingTop: 10, fontSize: 16, flexShrink: 0 }}>•</span>
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea rows={2} value={b} onChange={e => updateBullet(ei, bi, e.target.value)}
                      style={{ resize: "none", fontSize: 12, lineHeight: 1.6, borderColor: /\d+[%x$]|\d+ (users|events|ms)/i.test(b) ? C.greenBorder : C.border }} />
                    {!/\d/.test(b) && <div style={{ position: "absolute", right: 8, top: 6, fontSize: 10, color: C.orange, fontWeight: 700 }}>⚠ No metrics</div>}
                  </div>
                </div>
              ))}
            </Card>
          ))}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 10 }}>🛠 Skills</div>
            <input value={sections.skills} onChange={e => setSections(p => ({ ...p, skills: e.target.value }))} placeholder="Python, Docker, Kubernetes..." />
          </Card>
        </div>
        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ textAlign: "center", padding: 24 }}>
            <ScoreRing score={atsScore} size={100} color={atsScore >= 75 ? C.green : C.orange} label="ATS SCORE" />
            <div style={{ marginTop: 12 }}>
              {[{ l: "Metrics Used", ok: true }, { l: "Action Verbs", ok: true }, { l: "Skills Section", ok: true }, { l: "Keywords Match", ok: atsScore > 75 }].map(c => (
                <div key={c.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 0" }}>
                  {c.ok ? <CheckCircle size={13} color={C.green} /> : <AlertCircle size={13} color={C.orange} />}
                  <span style={{ color: c.ok ? C.textMid : C.orange }}>{c.l}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>💡 Suggested Keywords</div>
            {["quantified results", "team leadership", "cross-functional", "architected", "optimized"].map(k => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.textMid }}>{k}</span>
                <button style={{ background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ Add</button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── LEARNING IMPACT ROI ──────────────────────────────────────────────────────
const LearningImpact = ({ user }) => {
  const salary = user.current_salary || 85000;
  const courses = [
    { title: "MLOps Specialization", platform: "Coursera", cost: 400, salaryBefore: salary, salaryAfter: salary + 28000, duration: "4 months", skill: "MLOps", color: CH.blue },
    { title: "AWS Solutions Architect", platform: "AWS", cost: 300, salaryBefore: salary, salaryAfter: salary + 25000, duration: "3 months", skill: "AWS", color: CH.purple },
    { title: "TensorFlow Developer", platform: "Google", cost: 200, salaryBefore: salary, salaryAfter: salary + 18000, duration: "4 months", skill: "TensorFlow", color: CH.orange },
    { title: "PyTorch for Deep Learning", platform: "fast.ai", cost: 0, salaryBefore: salary, salaryAfter: salary + 20000, duration: "8 weeks", skill: "PyTorch", color: CH.pink },
  ];
  const roiData = courses.map(c => ({ name: c.skill, roi: Math.round((c.salaryAfter - c.salaryBefore) / c.cost * 100), uplift: Math.round((c.salaryAfter - c.salaryBefore) / 1000), fill: c.color }));

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Learning Impact ROI" sub="Per-course salary impact and return on investment analysis" icon={TrendingUp} />
      <Card elevated style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📊 ROI by Course</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: C.textMuted }} unit="K" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.textMuted }} unit="%" />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="uplift" radius={[4, 4, 0, 0]} name="Salary Uplift ($K)">
              {roiData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        {courses.map((c, i) => (
          <Card key={c.title} style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Pill color={["blue", "purple", "orange", "pink"][i]}>{c.skill}</Pill>
              <span style={{ fontSize: 12, color: C.textMuted }}>{c.duration}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>{c.platform} · {c.cost === 0 ? "Free" : `$${c.cost}`}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: C.bgSection, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Before</div>
                <div style={{ fontWeight: 700, color: C.textMid }}>${Math.round(c.salaryBefore / 1000)}K</div>
              </div>
              <div style={{ background: `${c.color}12`, border: `1px solid ${c.color}30`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>After</div>
                <div style={{ fontWeight: 800, color: c.color }}>${Math.round(c.salaryAfter / 1000)}K</div>
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: C.green, fontWeight: 700 }}>
              +${Math.round((c.salaryAfter - c.salaryBefore) / 1000)}K uplift
              {c.cost > 0 && ` · ${Math.round((c.salaryAfter - c.salaryBefore) / c.cost * 100)}% ROI`}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── CAREER NETWORK MAP ───────────────────────────────────────────────────────
const CareerNetworkMap = ({ user }) => {
  const [selected, setSelected] = useState(null);
  const nodes = [
    { id: "n1", label: "Junior Dev", level: "L2", salary: "$60K", x: 80, y: 200, color: CH.blue },
    { id: "n2", label: "Mid SWE", level: "L3", salary: "$85K", x: 220, y: 120, color: CH.blue },
    { id: "n3", label: "Senior SWE", level: "L4", salary: "$120K", x: 380, y: 80, color: CH.purple, current: true },
    { id: "n4", label: "Staff Eng", level: "L5", salary: "$165K", x: 540, y: 60, color: CH.orange },
    { id: "n5", label: "Principal", level: "L6", salary: "$210K", x: 680, y: 100, color: CH.pink },
    { id: "n6", label: "Data Scientist", level: "L4", salary: "$115K", x: 380, y: 220, color: CH.teal },
    { id: "n7", label: "ML Engineer", level: "L5", salary: "$155K", x: 540, y: 200, color: CH.orange },
    { id: "n8", label: "Eng Manager", level: "L5", salary: "$170K", x: 540, y: 320, color: CH.purple },
  ];
  const edges = [["n1", "n2"], ["n2", "n3"], ["n3", "n4"], ["n4", "n5"], ["n2", "n6"], ["n3", "n7"], ["n7", "n5"], ["n3", "n8"]];
  const width = 780, height = 380;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Career Network Map" sub="Interactive role transition graph — click any node to explore" icon={GitBranch} />
      <Card elevated>
        <div style={{ overflowX: "auto" }}>
          <svg width={width} height={height} style={{ display: "block" }}>
            {/* Edges */}
            {edges.map(([a, b], i) => {
              const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
              return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={C.border} strokeWidth={2} strokeDasharray="6 3" />;
            })}
            {/* Nodes */}
            {nodes.map(n => (
              <g key={n.id} onClick={() => setSelected(n)} style={{ cursor: "pointer" }}>
                <circle cx={n.x} cy={n.y} r={n.current ? 32 : 26} fill={n.current ? `${n.color}20` : `${n.color}10`}
                  stroke={n.current ? n.color : `${n.color}60`} strokeWidth={n.current ? 3 : 1.5} />
                {n.current && <circle cx={n.x} cy={n.y} r={36} fill="none" stroke={n.color} strokeWidth={1} opacity={0.3} strokeDasharray="4 2" />}
                <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={n.color}>{n.level}</text>
                <text x={n.x} y={n.y + 8} textAnchor="middle" fontSize={9} fill={C.textMuted}>{n.salary}</text>
                <text x={n.x} y={n.y + 26} textAnchor="middle" fontSize={9} fill={C.textMid} fontWeight={600}>{n.label}</text>
                {n.current && <text x={n.x} y={n.y - 20} textAnchor="middle" fontSize={9} fill={n.color} fontWeight={700}>← YOU</text>}
              </g>
            ))}
          </svg>
        </div>
        {selected && (
          <div style={{ marginTop: 16, background: C.bgSection, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{selected.label} — {selected.level}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Avg. salary: {selected.salary}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill color="blue">{selected.level}</Pill>
              {selected.current && <Pill color="green">Current Position</Pill>}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><X size={16} /></button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
const NotificationCenter = ({ user }) => {
  const [filter, setFilter] = useState("all");
  const [notifs, setNotifs] = useState([
    { id: 1, type: "job_match", title: "3 new jobs match your ML Engineer target", body: "DeepMind, Anthropic, and Stripe posted roles above your salary level", time: "2h ago", read: false, priority: "high", icon: Briefcase, color: CH.blue },
    { id: 2, type: "skill", title: "MLOps demand surged +78% this week", body: "Jobs requiring MLOps pay 32% more. Add it to your skill list now.", time: "4h ago", read: false, priority: "high", icon: TrendingUp, color: CH.orange },
    { id: 3, type: "score", title: "Career score improved to 74 (+3)", body: "Your TensorFlow progress updated your match score across 12 jobs", time: "1d ago", read: true, priority: "medium", icon: Award, color: CH.green },
    { id: 4, type: "market", title: "AI sector salaries up 11.3% YoY", body: "Senior ML roles are growing faster than any other tech discipline", time: "2d ago", read: true, priority: "medium", icon: BarChart2, color: CH.purple },
    { id: 5, type: "job_match", title: "Salary alert: AWS is paying $28K more for certified engineers", body: "3 AWS roles in your location are above your level. Apply before they close.", time: "3d ago", read: true, priority: "low", icon: DollarSign, color: CH.pink },
  ]);

  const filtered = filter === "all" ? notifs : notifs.filter(n => n.type === filter || n.priority === filter);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader title="Notification Center" sub="Alerts for new jobs, trending skills, score changes and market shifts" icon={Bell}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {unread > 0 && <Pill color="orange">{unread} unread</Pill>}
            <button onClick={() => setNotifs(p => p.map(n => ({ ...n, read: true })))} style={{ background: C.bgSection, border: `1px solid ${C.border}`, color: C.textMuted, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Mark all read</button>
          </div>
        } />

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "all", l: "All" }, { id: "job_match", l: "Jobs" }, { id: "skill", l: "Skills" }, { id: "market", l: "Market" }, { id: "score", l: "Scores" }, { id: "high", l: "High Priority" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${filter === f.id ? C.blueBorder : C.border}`, background: filter === f.id ? C.blueLight : "transparent", color: filter === f.id ? C.blue : C.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>{f.l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((n, i) => (
          <div key={n.id} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
            style={{ background: n.read ? C.bgCard : C.bgHover, border: `1px solid ${!n.read ? `${n.color}40` : C.border}`, borderRadius: 12, padding: 16, display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", transition: "all 0.15s", animation: `fadeUp 0.4s ease both`, animationDelay: `${i * 40}ms` }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ background: `${n.color}15`, padding: 10, borderRadius: 10, border: `1px solid ${n.color}30`, flexShrink: 0 }}>
              <n.icon size={18} color={n.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 14, color: n.read ? C.textMuted : C.text }}>{n.title}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color }} />}
                  <span style={{ fontSize: 11, color: C.textLight }}>{n.time}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{n.body}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <Pill color={n.priority === "high" ? "orange" : n.priority === "medium" ? "blue" : "muted"}>{n.priority}</Pill>
                <Pill color="muted">{n.type.replace("_", " ")}</Pill>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setNotifs(p => p.filter(x => x.id !== n.id)); }} style={{ background: "transparent", border: "none", color: C.textLight, cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <Bell size={28} color={C.textLight} style={{ margin: "0 auto 10px", display: "block" }} />
            <div style={{ color: C.textMuted, fontSize: 13 }}>No notifications in this category</div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP SHELL ───────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [backendStatus, setBackendStatus] = useState("demo");

  useEffect(() => {
    apiCall("/").then(d => setBackendStatus(d ? "online" : "demo")).catch(() => setBackendStatus("demo"));
  }, []);

  const navGroups = [
    { id: "core", label: "Core Platform" },
    { id: "growth", label: "Growth & Prep" },
    { id: "tools", label: "Tools & Income" },
    { id: "account", label: "Account" },
  ];

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", group: "core" },
    { id: "resume", icon: Upload, label: "Resume Analysis", group: "core" },
    { id: "salary", icon: DollarSign, label: "Salary Intelligence", group: "core" },
    { id: "jobs", icon: Briefcase, label: "Job Matching", group: "core" },
    { id: "search", icon: Search, label: "Advanced Search", group: "core" },
    { id: "skills", icon: Target, label: "Skill Gap", group: "core" },
    { id: "market", icon: BarChart2, label: "Market Insights", group: "core" },
    { id: "forecast", icon: TrendingUp, label: "Growth Forecast", group: "growth" },
    { id: "interview", icon: MessageSquare, label: "Interview Prep", group: "growth" },
    { id: "tracker", icon: Activity, label: "Progress Tracker", group: "growth" },
    { id: "impact", icon: Zap, label: "Learning Impact", group: "growth" },
    { id: "network", icon: GitBranch, label: "Career Map", group: "growth" },
    { id: "ats", icon: FileText, label: "ATS Optimizer", group: "tools" },
    { id: "builder", icon: Edit3, label: "Resume Builder", group: "tools" },
    { id: "explainability", icon: Brain, label: "AI Explainability", group: "tools" },
    { id: "benchmarking", icon: Users, label: "Benchmarking", group: "tools" },
    { id: "hustles", icon: Coffee, label: "Side Hustles", group: "tools" },
    { id: "portfolio", icon: Code, label: "Portfolio", group: "tools" },
    { id: "notifications", icon: Bell, label: "Notifications", group: "account" },
    { id: "settings", icon: Settings, label: "Settings", group: "account" },
  ];

  const u = user || {};
  const pageComponents = {
    dashboard: <Dashboard user={u} onNavigate={setActivePage} />,
    resume: <ResumeAnalysis user={u} />,
    salary: <SalaryIntelligence user={u} />,
    jobs: <JobMatching user={u} />,
    search: <AdvancedJobSearch user={u} />,
    skills: <SkillGapAnalysis user={u} />,
    market: <MarketInsights />,
    forecast: <CareerGrowthForecast user={u} />,
    interview: <InterviewPrep user={u} />,
    tracker: <ProgressTracker user={u} />,
    impact: <LearningImpact user={u} />,
    network: <CareerNetworkMap user={u} />,
    ats: <ATSOptimizer user={u} />,
    builder: <ResumeBuilder user={u} />,
    explainability: <MLExplainability user={u} />,
    benchmarking: <CommunityBenchmarking user={u} />,
    hustles: <SideHustles />,
    portfolio: <Portfolio />,
    notifications: <NotificationCenter user={u} />,
    settings: <SettingsPrivacy user={u} onUserUpdate={setUser} onLogout={() => setUser(null)} />,
  };

  const globalCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#F8FAFC;color:#0F172A;font-family:'Inter',system-ui,-apple-system,sans-serif;min-height:100vh;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
    input,textarea,select{
      background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:8px;
      color:#0F172A;font-family:'Inter',sans-serif;font-size:14px;
      padding:10px 14px;outline:none;transition:border-color 0.2s,box-shadow 0.2s;width:100%;
    }
    input:focus,textarea:focus,select:focus{
      border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,0.1);
      background:#FFFFFF;
    }
    input::placeholder,textarea::placeholder{color:#94A3B8;}
    select option{background:#FFFFFF;color:#0F172A;}
    ::-webkit-scrollbar{width:6px;height:6px;}
    ::-webkit-scrollbar-track{background:#F1F5F9;}
    ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
    ::-webkit-scrollbar-thumb:hover{background:#94A3B8;}
    button{font-family:'Inter',sans-serif;}
  `;

  if (!user) return (
    <>
      <style>{globalCSS}</style>
      <LandingPage onStart={setUser} />
    </>
  );

  const currentPage = navItems.find(n => n.id === activePage);

  return (
    <>
      <style>{globalCSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

        {/* SIDEBAR */}
        <div style={{
          width: sidebarOpen ? "224px" : "56px",
          flexShrink: 0, background: C.bgSidebar,
          borderRight: `1px solid ${C.border}`,
          boxShadow: "1px 0 0 rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column",
          transition: "width 0.25s ease",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden"
        }}>
          {/* Logo */}
          <div style={{ padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, padding: 8, borderRadius: 10, flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
              <Brain size={17} color="white" />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
                  Career<span style={{ color: C.blue }}>IQ</span>
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400, marginLeft: 4 }}>Pro</span>
                </div>
                <div style={{ fontSize: 9, color: backendStatus === "online" ? C.green : C.textLight, fontWeight: 600 }}>
                  {backendStatus === "online" ? "● API Live" : "● Demo Mode"}
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
            {navGroups.map(g => {
              const items = navItems.filter(n => n.group === g.id);
              return (
                <div key={g.id} style={{ marginBottom: 8 }}>
                  {sidebarOpen && (
                    <div style={{ fontSize: 9, color: C.textLight, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "6px 8px 2px" }}>
                      {g.label}
                    </div>
                  )}
                  {items.map(item => {
                    const active = activePage === item.id;
                    return (
                      <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                        display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8,
                        border: "none", cursor: "pointer", background: active ? C.bgActive : "transparent",
                        color: active ? C.blue : C.textMuted, transition: "all 0.12s",
                        textAlign: "left", width: "100%", marginBottom: 1,
                        borderLeft: `2px solid ${active ? C.blue : "transparent"}`,
                        fontWeight: active ? 600 : 400,
                      }}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.textMid; } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; } }}>
                        <item.icon size={15} style={{ flexShrink: 0 }} />
                        {sidebarOpen && <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User info */}
          {sidebarOpen && (
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${C.blue},${C.purple})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "white", flexShrink: 0 }}>
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "User"}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.current_role}</div>
                </div>
                <button onClick={() => setUser(null)} title="Sign out" style={{ background: "transparent", border: "none", color: C.textLight, cursor: "pointer", padding: 4 }}>
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button onClick={() => setSidebarOpen(p => !p)} style={{
            margin: 6, padding: 8, background: C.bgSection, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            {sidebarOpen ? <X size={13} /> : <Menu size={13} />}
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Topbar */}
          <div style={{
            background: C.bgCard, borderBottom: `1px solid ${C.border}`,
            padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 0 rgba(0,0,0,0.04)"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{currentPage?.label}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                CareerIQ Pro · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Pill color="blue">{user.current_role}</Pill>
              <Pill color="purple">{user.experience_years}y exp</Pill>
              <Pill color="muted">${Math.round((user.current_salary || 0) / 1000)}K</Pill>
            </div>
          </div>

          {/* Page */}
          <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {pageComponents[activePage]}
          </div>
        </div>
      </div>
    </>
  );
}
