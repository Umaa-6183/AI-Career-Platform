import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { Upload, Brain, TrendingUp, Target, BookOpen, Zap, Shield, BarChart2, Users, Award, ChevronRight, CheckCircle, XCircle, AlertCircle, Star, ExternalLink, Code, Briefcase, DollarSign, Map, Sparkles, ArrowUpRight, Clock, Activity } from "lucide-react";

// ─── Color System ──────────────────────────────────────────────────────────────
const C = {
  cobalt: "#1A6BFF",
  cobaltDark: "#0047CC",
  cobaltGlow: "rgba(26,107,255,0.18)",
  orange: "#FF6425",
  orangeGlow: "rgba(255,100,37,0.18)",
  lime: "#AAFF00",
  limeGlow: "rgba(170,255,0,0.15)",
  charcoal: "#1C1C28",
  charcoalMid: "#252535",
  charcoalLight: "#2F2F45",
  surface: "#1A1A28",
  surfaceHover: "#232338",
  text: "#F0F0F8",
  textMuted: "#8888AA",
  textDim: "#5555770",
  border: "rgba(255,255,255,0.07)",
  borderActive: "rgba(26,107,255,0.4)",
};

const API = "http://localhost:8000";

// ─── Global Styles ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background: ${C.charcoal};
      color: ${C.text};
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.charcoal}; }
    ::-webkit-scrollbar-thumb { background: ${C.cobalt}; border-radius: 3px; }

    .mono { font-family: 'JetBrains Mono', monospace; }
    .syne { font-family: 'Syne', sans-serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 ${C.cobaltGlow}; }
      50% { box-shadow: 0 0 24px 8px ${C.cobaltGlow}; }
    }
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .anim-fade-up { animation: fadeUp 0.5s ease both; }
    .anim-float { animation: float 3s ease-in-out infinite; }
    
    .btn-cobalt {
      background: ${C.cobalt};
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-family: 'Syne', sans-serif;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.3px;
    }
    .btn-cobalt:hover { background: #2575FF; transform: translateY(-1px); box-shadow: 0 8px 24px ${C.cobaltGlow}; }
    .btn-cobalt:active { transform: translateY(0); }

    .btn-ghost {
      background: transparent;
      color: ${C.text};
      border: 1px solid ${C.border};
      padding: 10px 22px;
      border-radius: 8px;
      font-family: 'Syne', sans-serif;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover { border-color: ${C.cobalt}; color: ${C.cobalt}; background: ${C.cobaltGlow}; }

    .card {
      background: ${C.charcoalMid};
      border: 1px solid ${C.border};
      border-radius: 14px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: rgba(26,107,255,0.25); }

    .tag {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.5px;
    }
    .tag-cobalt { background: ${C.cobaltGlow}; color: ${C.cobalt}; border: 1px solid rgba(26,107,255,0.3); }
    .tag-lime { background: ${C.limeGlow}; color: ${C.lime}; border: 1px solid rgba(170,255,0,0.3); }
    .tag-orange { background: ${C.orangeGlow}; color: ${C.orange}; border: 1px solid rgba(255,100,37,0.3); }
    .tag-muted { background: rgba(255,255,255,0.05); color: ${C.textMuted}; border: 1px solid ${C.border}; }

    .gradient-text {
      background: linear-gradient(135deg, ${C.cobalt}, #8B5CF6, ${C.lime});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    input, textarea, select {
      background: ${C.charcoalLight};
      border: 1px solid ${C.border};
      border-radius: 8px;
      color: ${C.text};
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
    }
    input:focus, textarea:focus, select:focus { border-color: ${C.cobalt}; box-shadow: 0 0 0 3px ${C.cobaltGlow}; }
    input::placeholder, textarea::placeholder { color: ${C.textMuted}; }

    select option { background: ${C.charcoalLight}; }

    .progress-bar {
      height: 6px;
      background: ${C.charcoalLight};
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 1s ease;
    }

    .grid-bg {
      background-image: linear-gradient(${C.border} 1px, transparent 1px),
                        linear-gradient(90deg, ${C.border} 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid ${C.border};
      border-top-color: ${C.cobalt};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .tooltip-custom .recharts-tooltip-wrapper {
      background: ${C.charcoalMid} !important;
      border: 1px solid ${C.border} !important;
      border-radius: 8px;
    }
  `}</style>
);
