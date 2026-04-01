"""
CareerIQ Pro — FastAPI Backend v3.0 (Production Edition)
────────────────────────────────────────────────────────
• All salaries in INR
• Real-time job data via JSearch (RapidAPI) with internal fallback
• AI-powered endpoints via Google Gemini 1.5 Flash
• Full SQLite / PostgreSQL persistence via SQLAlchemy
• Peer benchmarking, progress tracking, portfolio & learning tracker
• CORS-ready for Vercel frontend + Render deployment
"""

from __future__ import annotations

import os
import re
import math
import uuid
import hashlib
import json
import httpx
import enum
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean,
    DateTime, Text, JSON, ForeignKey, Index
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session
from google import genai

from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")        # JSearch job API
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./careeriq.db")
USE_SQLITE = DATABASE_URL.startswith("sqlite")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
SECRET_KEY = os.getenv("SECRET_KEY", "careeriq-secret-change-in-prod")

# Configure Gemini
client = genai.Client(api_key=GEMINI_API_KEY)

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if USE_SQLITE else {},
    pool_size=5,
    max_overflow=10,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── ORM Models ────────────────────────────────────────────────────────────────

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    email_hash = Column(String(64), unique=True, index=True)
    name_alias = Column(String(80))
    current_role = Column(String(120))
    target_role = Column(String(120))
    experience_years = Column(Integer, default=0)
    location = Column(String(80))
    current_salary = Column(Float, default=0.0)
    salary_level = Column(String(5))
    skills = Column(JSON, default=list)     # ["Python","React",…]
    goals = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    resumes = relationship(
        "DBResume",           back_populates="user", cascade="all, delete")
    progress_entries = relationship(
        "DBProgressEntry",    back_populates="user", cascade="all, delete")
    score_history = relationship(
        "DBScoreHistory",     back_populates="user", cascade="all, delete")
    peer_connections = relationship("DBPeerConnection",   back_populates="user", cascade="all, delete",
                                    foreign_keys="DBPeerConnection.user_id")


class DBResume(Base):
    __tablename__ = "resumes"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    version = Column(Integer, default=1)
    anonymized_text = Column(Text)
    extracted_skills = Column(JSON, default=list)
    experience_years = Column(Integer, default=0)
    education_level = Column(String(50))
    ats_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    salary_estimate = Column(Float, default=0.0)
    analysis_json = Column(JSON, default=dict)
    ai_feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_primary = Column(Boolean, default=True)
    user = relationship("DBUser", back_populates="resumes")


class DBProgressEntry(Base):
    """Tracks every course / resource a user is working on"""
    __tablename__ = "progress_entries"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    platform = Column(String(80))       # youtube, geeksforgeeks, hackerrank …
    resource_title = Column(String(300))
    resource_url = Column(String(600))
    skill_tag = Column(String(100))
    category = Column(String(80))       # tech | non-tech
    sessions = Column(Integer, default=0)   # sessions attended/completed
    progress_pct = Column(Float, default=0.0)   # 0-100
    # not_started | in_progress | completed
    status = Column(String(30), default="not_started")
    salary_impact = Column(Float, default=0.0)   # estimated INR uplift
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
    user = relationship("DBUser", back_populates="progress_entries")


class DBScoreHistory(Base):
    __tablename__ = "score_history"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    salary_score = Column(Float, default=0.0)
    job_match_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    ats_score = Column(Float, default=0.0)
    skills_count = Column(Integer, default=0)
    courses_done = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    user = relationship("DBUser", back_populates="score_history")
    __table_args__ = (Index("ix_sh_user_date", "user_id", "recorded_at"),)


class DBPeerConnection(Base):
    __tablename__ = "peer_connections"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    peer_alias = Column(String(80))
    peer_role = Column(String(120))
    peer_salary = Column(Float, default=0.0)
    peer_level = Column(String(5))
    peer_skills = Column(JSON, default=list)
    peer_location = Column(String(80))
    invite_code = Column(String(12), unique=True, index=True)
    accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("DBUser", back_populates="peer_connections",
                        foreign_keys=[user_id])


class DBPortfolioProject(Base):
    __tablename__ = "portfolio_projects"
    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    title = Column(String(200))
    description = Column(Text)
    tech_stack = Column(JSON, default=list)
    github_url = Column(String(500))
    live_url = Column(String(500))
    thumbnail = Column(String(500))
    webflow_id = Column(String(100))       # webflow CMS item id if published
    salary_impact_amount = Column(Float, default=0.0)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ CareerIQ DB tables ready")

# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────


class UserOnboardRequest(BaseModel):
    name:             str
    email:            str
    current_role:     str
    target_role:      str
    experience_years: int
    location:         str = "Bangalore"
    current_salary:   float = 0.0
    skills:           List[str] = []
    goals:            Dict[str, Any] = {}


class ResumeRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = None
    user_id:     Optional[str] = None


class ATSRequest(BaseModel):
    resume_text:     str
    job_description: str
    user_id:         Optional[str] = None


class SalaryRequest(BaseModel):
    role:             str
    experience_years: int
    skills:           List[str]
    location:         str = "Bangalore"
    education:        str = "bachelor"


class JobMatchRequest(BaseModel):
    user_skills:          List[str]
    experience_years:     int
    current_salary_score: float = 0.3
    target_roles:         List[str] = []
    location:             Optional[str] = None


class SkillGapRequest(BaseModel):
    current_skills: List[str]
    target_role:    str


class InterviewRequest(BaseModel):
    question: str
    answer:   str
    role:     str = "Software Engineer"


class ProgressUpsertRequest(BaseModel):
    user_id:        str
    platform:       str
    resource_title: str
    resource_url:   str
    skill_tag:      str
    category:       str = "tech"
    sessions:       int = 0
    progress_pct:   float = 0.0
    status:         str = "in_progress"
    notes:          Optional[str] = None


class ProgressSessionRequest(BaseModel):
    entry_id:    str
    sessions_delta: int = 1
    progress_pct: float = 0.0


class PeerInviteRequest(BaseModel):
    user_id:      str
    peer_alias:   str
    peer_role:    str
    peer_salary:  float
    peer_skills:  List[str] = []
    peer_location: str = "India"


class PortfolioProjectRequest(BaseModel):
    user_id:     str
    title:       str
    description: str
    tech_stack:  List[str] = []
    github_url:  Optional[str] = None
    live_url:    Optional[str] = None
    thumbnail:   Optional[str] = None
    tags:        List[str] = []


class GeminiChatRequest(BaseModel):
    prompt:   str
    context:  Optional[str] = None
    user_id:  Optional[str] = None

# ─────────────────────────────────────────────────────────────────────────────
# SALARY DATA & HELPERS
# ─────────────────────────────────────────────────────────────────────────────


SALARY_LEVELS = {
    "L1":  {"range": (100_000,   600_000),  "label": "Fresher / Trainee",    "index": 0},
    "L2":  {"range": (600_000,  1_000_000), "label": "Junior Engineer",      "index": 1},
    "L3":  {"range": (1_000_000, 1_600_000), "label": "Mid-Level Engineer",   "index": 2},
    "L4":  {"range": (1_600_000, 2_500_000), "label": "Senior Engineer",      "index": 3},
    "L5":  {"range": (2_500_000, 4_000_000), "label": "Staff / Tech Lead",    "index": 4},
    "L6":  {"range": (4_000_000, 6_000_000), "label": "Principal Engineer",   "index": 5},
    "L7":  {"range": (6_000_000, 9_000_000), "label": "Distinguished Eng",    "index": 6},
    "L8":  {"range": (9_000_000, 14_000_000), "label": "Fellow / Architect",   "index": 7},
    "L9":  {"range": (14_000_000, 22_000_000), "label": "Senior Fellow",        "index": 8},
    "L10": {"range": (22_000_000, 60_000_000), "label": "VP / CTO",             "index": 9},
}


def fmt(n: float) -> str:
    if n >= 10_000_000:
        return f"₹{n/10_000_000:.1f}Cr"
    if n >= 100_000:
        return f"₹{n/100_000:.1f}L"
    return f"₹{n:,.0f}"


def normalize_salary(salary: float) -> dict:
    for level, data in SALARY_LEVELS.items():
        lo, hi = data["range"]
        if lo <= salary < hi:
            intra = (salary - lo) / (hi - lo)
            score = (data["index"] + intra) / 10.0
            return {"level": level, "label": data["label"],
                    "normalized_score": round(score, 4),
                    "intra_level_position": round(intra, 4),
                    "level_index": data["index"],
                    "salary_range": list(data["range"]),
                    "percentile": round(score * 100, 1),
                    "above_median": salary > sum(data["range"]) / 2}
    return {"level": "L10", "label": "VP / CTO", "normalized_score": 1.0,
            "intra_level_position": 1.0, "level_index": 9,
            "salary_range": [22_000_000, 60_000_000], "percentile": 99.9, "above_median": True}


BASE_INR = {
    "software engineer": 1_200_000, "frontend developer": 1_000_000,
    "backend developer": 1_100_000, "full stack developer": 1_150_000,
    "data scientist": 1_400_000, "data engineer": 1_300_000,
    "machine learning engineer": 1_600_000, "ai engineer": 1_800_000,
    "devops engineer": 1_200_000, "sre": 1_400_000,
    "cloud architect": 1_800_000, "product manager": 1_500_000,
    "engineering manager": 2_000_000, "android developer": 1_050_000,
    "ios developer": 1_100_000, "security engineer": 1_300_000,
    "data analyst": 900_000, "generative ai engineer": 2_000_000,
}

SKILL_PREM = {
    "kubernetes": 280_000, "terraform": 220_000, "aws": 250_000,
    "gcp": 220_000, "azure": 200_000, "kafka": 200_000,
    "tensorflow": 280_000, "pytorch": 280_000, "mlops": 350_000,
    "rust": 250_000, "go": 200_000, "scala": 180_000,
    "spark": 180_000, "dbt": 150_000, "airflow": 160_000,
    "llm": 450_000, "transformers": 350_000, "rlhf": 500_000,
    "system design": 300_000, "distributed systems": 280_000,
    "react": 120_000, "docker": 120_000, "langchain": 300_000,
    "generative ai": 500_000,
}

LOC_MULT = {
    "bangalore": 1.15, "bengaluru": 1.15, "hyderabad": 1.05,
    "pune": 1.00, "mumbai": 1.10, "delhi": 1.05,
    "gurgaon": 1.08, "noida": 1.02, "chennai": 1.00,
    "india": 1.00, "remote": 1.05,
}


def estimate_salary(role: str, years: int, skills: List[str],
                    location: str = "India", edu: str = "bachelor") -> dict:
    base = next((v for k, v in BASE_INR.items() if k in role.lower()), 900_000)
    exp = 1.0 + (min(years, 15) * 0.055) + (max(0, years - 15) * 0.02)
    bonus = min(sum(SKILL_PREM.get(s.lower(), 0) for s in skills), 1_200_000)
    loc = next((v for k, v in LOC_MULT.items() if k in location.lower()), 1.00)
    edu_m = {"phd": 1.15, "master": 1.08, "bachelor": 1.00,
             "associate": 0.92, "none": 0.88}.get(edu.lower(), 1.0)
    est = (base * exp + bonus) * loc * edu_m
    return {
        "estimated_salary": round(est),
        "low_range":        round(est * 0.82),
        "high_range":       round(est * 1.22),
        "formatted":        fmt(est),
        "formatted_range":  f"{fmt(est * 0.82)} – {fmt(est * 1.22)}",
        "normalization":    normalize_salary(est),
        "feature_contributions": {
            "base_role":           round(base),
            "experience_delta":    round(base * (exp - 1)),
            "skill_premium":       round(bonus * loc),
            "location_adjustment": round((est / loc) * (loc - 1)),
        },
        "confidence": round(min(0.95, 0.55 + len(skills) * 0.02 + years * 0.01), 3),
        "currency": "INR",
    }

# ─────────────────────────────────────────────────────────────────────────────
# RESUME PARSING
# ─────────────────────────────────────────────────────────────────────────────


SKILLS_RE = (
    r'\b(Python|JavaScript|TypeScript|Java|C\+\+|Go|Golang|Rust|Scala|Kotlin|Swift|'
    r'Ruby|SQL|Bash|React|Vue|Angular|NextJS|Node\.js|Express|FastAPI|Flask|Django|'
    r'Spring|TensorFlow|PyTorch|Keras|Scikit-learn|XGBoost|HuggingFace|BERT|GPT|LLM|'
    r'LangChain|MLOps|NLP|OpenCV|Docker|Kubernetes|Helm|Terraform|Ansible|AWS|GCP|'
    r'Azure|Jenkins|Prometheus|Grafana|Datadog|Apache Spark|Kafka|Airflow|dbt|'
    r'Snowflake|BigQuery|PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|Pandas|NumPy|'
    r'Matplotlib|Tableau|Power BI|Git|Linux|GraphQL|REST|gRPC|Microservices|'
    r'System Design|Agile|Scrum|Generative AI)\b'
)

PII_PATTERNS = [
    (r'\b\d{3}-\d{2}-\d{4}\b',              '[SSN REDACTED]'),
    (r'\b[\w.+-]+@[\w-]+\.[\w.]+\b',         '[EMAIL REDACTED]'),
    (r'\b(\+?91[-.\s]?)?\d{10}\b',           '[PHONE REDACTED]'),
    (r'\bhttps?://[^\s]+\b',                  '[URL REDACTED]'),
    (r'\b\d{12}\b',                            '[AADHAAR REDACTED]'),
    (r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',          '[NAME REDACTED]'),
]


def parse_resume(text: str) -> dict:
    skills = list(set(re.findall(SKILLS_RE, text, re.IGNORECASE)))
    em = re.findall(r'(\d+)\+?\s*years?', text, re.IGNORECASE)
    years = max([int(x) for x in em], default=0) if em else 0
    if not years:
        ds = re.findall(r'(20\d{2})', text)
        if len(ds) >= 2:
            years = max(int(d) for d in ds) - min(int(d) for d in ds)

    tl = text.lower()
    edu = ("phd" if any(w in tl for w in ["phd", "ph.d", "doctorate"]) else
           "master" if any(w in tl for w in ["master", "m.tech", "mba", "m.s."]) else
           "bachelor")

    anon = text
    for p, r in PII_PATTERNS:
        anon = re.sub(p, r, anon)

    avs = ["led", "built", "designed", "implemented", "reduced", "improved",
           "developed", "architected", "optimized", "deployed", "managed", "launched", "scaled"]
    has_metrics = bool(
        re.search(r'\d+%|₹\d+|\d+x\b|crore|lakh', text, re.IGNORECASE))
    has_actions = sum(1 for v in avs if v in tl)
    ats = (min(len(skills) * 3, 35) +
           (15 if has_metrics else 0) +
           min(has_actions * 3, 15) +
           (10 if "experience" in tl and "skills" in tl else 0) +
           (8 if "education" in tl else 0) +
           (5 if len(text.split()) > 300 else 0) +
           (7 if "github" in tl or "linkedin" in tl else 0))
    return {
        "extracted_skills":          skills,
        "estimated_experience_years": min(years, 30),
        "education_level":           edu,
        "anonymized_text":           anon,
        "pii_removed_count":         sum(len(re.findall(p, text)) for p, _ in PII_PATTERNS),
        "word_count":                len(text.split()),
        "ats_score":                 min(ats, 100),
        "has_metrics":               has_metrics,
        "action_verb_count":         has_actions,
        "skill_count":               len(skills),
    }

# ─────────────────────────────────────────────────────────────────────────────
# SKILL GAP
# ─────────────────────────────────────────────────────────────────────────────


ROLE_REQ = {
    "machine learning engineer": {
        "core":     ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas"],
        "advanced": ["MLOps", "Kubernetes", "Docker", "Apache Spark", "Feature Engineering"],
        "nice":     ["JAX", "ONNX", "Triton"],
        "soft":     ["Research Skills", "Experiment Design", "Data Storytelling"],
    },
    "data scientist": {
        "core":     ["Python", "R", "SQL", "Statistics", "Pandas", "Scikit-learn"],
        "advanced": ["Deep Learning", "A/B Testing", "Tableau", "Apache Spark", "BigQuery"],
        "nice":     ["Causal Inference", "Bayesian Modeling"],
        "soft":     ["Business Acumen", "Communication", "Storytelling"],
    },
    "software engineer": {
        "core":     ["Python", "JavaScript", "Data Structures", "Algorithms", "Git", "SQL"],
        "advanced": ["System Design", "Microservices", "AWS", "Docker", "CI/CD"],
        "nice":     ["Rust", "Go", "gRPC"],
        "soft":     ["Problem Solving", "Code Review", "Mentoring"],
    },
    "devops engineer": {
        "core":     ["Linux", "Docker", "Kubernetes", "CI/CD", "Terraform", "Bash"],
        "advanced": ["AWS", "GCP", "Prometheus", "Grafana", "Ansible", "Helm"],
        "nice":     ["ArgoCD", "Istio", "Vault"],
        "soft":     ["Incident Management", "Documentation", "SRE Mindset"],
    },
    "data engineer": {
        "core":     ["Python", "SQL", "Apache Spark", "Airflow", "dbt", "PostgreSQL"],
        "advanced": ["Kafka", "Snowflake", "BigQuery", "Databricks"],
        "nice":     ["Flink", "Iceberg", "Prefect"],
        "soft":     ["Data Modeling", "Documentation", "Reliability Mindset"],
    },
    "frontend developer": {
        "core":     ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git"],
        "advanced": ["NextJS", "Redux", "GraphQL", "Webpack", "REST APIs"],
        "nice":     ["Vue", "React Native", "Tailwind"],
        "soft":     ["UI/UX Sensibility", "Performance Mindset", "Accessibility"],
    },
    "backend developer": {
        "core":     ["Python", "Java", "Node.js", "SQL", "REST APIs", "Git"],
        "advanced": ["Microservices", "Docker", "PostgreSQL", "Redis", "AWS", "System Design"],
        "nice":     ["Go", "Rust", "Kafka", "gRPC"],
        "soft":     ["Scalability Thinking", "Security Mindset", "Documentation"],
    },
    "generative ai engineer": {
        "core":     ["Python", "LLM", "LangChain", "HuggingFace", "PyTorch", "Generative AI"],
        "advanced": ["MLOps", "Kubernetes", "Vector Databases", "RAG", "Fine-tuning"],
        "nice":     ["RLHF", "LoRA", "Triton"],
        "soft":     ["Research Mindset", "Prompt Engineering", "Ethics"],
    },
    "product manager": {
        "core":     ["Product Roadmapping", "User Research", "A/B Testing", "SQL", "Analytics"],
        "advanced": ["OKRs", "Agile/Scrum", "Figma", "Competitive Analysis"],
        "nice":     ["Python Basics", "ML Basics"],
        "soft":     ["Leadership", "Communication", "Prioritization", "Empathy"],
    },
}

SKILL_IMP = {
    "tensorflow": 250_000, "pytorch": 280_000, "mlops": 400_000,
    "kubernetes": 300_000, "aws": 350_000, "apache spark": 220_000,
    "system design": 450_000, "kafka": 220_000, "dbt": 180_000,
    "llm": 600_000, "go": 280_000, "rust": 350_000,
    "gcp": 280_000, "terraform": 280_000, "langchain": 300_000,
    "generative ai": 500_000,
}


def analyze_skill_gap(skills: List[str], role: str) -> dict:
    rk = next((k for k in ROLE_REQ if k in role.lower()
               or any(w in role.lower() for w in k.split())), "software engineer")
    reqs = ROLE_REQ[rk]
    all_req = reqs["core"] + reqs["advanced"]
    cl = [s.lower() for s in skills]
    have = [s for s in all_req if s.lower() in cl]
    missing = [s for s in all_req if s.lower() not in cl]
    priority = [s for s in missing if s in reqs["core"]][:4]
    pd_list = [{
        "skill": s,
        "estimated_salary_impact": SKILL_IMP.get(s.lower(), 150_000),
        "estimated_salary_impact_formatted": fmt(SKILL_IMP.get(s.lower(), 150_000)),
        "learning_weeks": 6 if s.lower() in ["kubernetes", "aws", "mlops"] else 4,
    } for s in priority]
    ms = len(have) / max(len(all_req), 1) * 100
    return {
        "target_role":   role,
        "role_matched":  rk,
        "skills_have":   have,
        "skills_missing": missing,
        "skills_priority": priority,
        "skills_priority_detailed": pd_list,
        "skills_nice_to_have": reqs.get("nice", []),
        "soft_skills":   reqs.get("soft", []),
        "match_score":   round(ms, 1),
        "completeness_level": ("Strong" if ms > 70 else "Moderate" if ms > 40 else "Needs Work"),
        "estimated_reskilling_weeks": len(missing) * 3,
        "total_potential_salary_uplift": sum(p["estimated_salary_impact"] for p in pd_list),
        "total_potential_salary_uplift_formatted": fmt(sum(p["estimated_salary_impact"] for p in pd_list)),
    }

# ─────────────────────────────────────────────────────────────────────────────
# ATS OPTIMIZER
# ─────────────────────────────────────────────────────────────────────────────


def ats_optimize(resume_text: str, jd: str) -> dict:
    rl = resume_text.lower()
    jd_skills = list(set(re.findall(SKILLS_RE, jd, re.IGNORECASE)))
    r_skills = list(set(re.findall(SKILLS_RE, resume_text, re.IGNORECASE)))
    matched = [s for s in jd_skills if s.lower() in rl]
    missing = [s for s in jd_skills if s.lower() not in rl]
    km = len(matched) / max(len(jd_skills), 1) * 100
    has_m = bool(re.search(r'\d+%|₹\d+|\d+x\b|crore|lakh',
                 resume_text, re.IGNORECASE))
    avs = ["led", "built", "designed", "reduced",
           "improved", "developed", "architected"]
    has_a = sum(1 for v in avs if v in rl)
    scores = {
        "keyword_match":        round(km),
        "ats_formatting":       85 if "experience" in rl and "skills" in rl else 60,
        "quantified_impact":    90 if has_m else 40,
        "action_verbs":         min(100, has_a * 15),
        "section_completeness": 90 if "education" in rl else 65,
    }
    overall = round(sum(scores.values()) / len(scores))
    issues = []
    if km < 60:
        issues.append({"severity": "high",
                       "issue": f"Only {len(matched)}/{len(jd_skills)} JD keywords found",
                       "fix": f"Add if applicable: {', '.join(missing[:5])}"})
    if not has_m:
        issues.append({"severity": "high",
                       "issue": "No quantified achievements",
                       "fix": "Add: 'Reduced latency by 40%', 'Saved ₹50L in infra costs'"})
    if has_a < 3:
        issues.append({"severity": "medium",
                       "issue": "Few action verbs",
                       "fix": "Start bullets: Led, Built, Reduced, Scaled, Architected"})
    return {
        "overall_ats_score":   overall,
        "scores":              scores,
        "matched_keywords":    matched,
        "missing_keywords":    missing,
        "keyword_match_pct":   round(km),
        "issues":              issues,
        "jd_skills_total":     len(jd_skills),
        "resume_skills_total": len(r_skills),
    }

# ─────────────────────────────────────────────────────────────────────────────
# REAL-TIME JOB SEARCH  (JSearch RapidAPI → internal fallback)
# ─────────────────────────────────────────────────────────────────────────────


INDIA_JOBS_FALLBACK = [
    {"id": "j1",  "title": "Senior ML Engineer",          "company": "Google India",      "salary_range": [4_000_000, 7_000_000], "location": "Bangalore",  "industry": "AI/Cloud",       "required_skills": [
        "Python", "TensorFlow", "Kubernetes", "MLOps"],          "preferred_skills": ["PyTorch", "GCP"],       "experience_years_min": 4, "remote": "Hybrid",   "url": "https://careers.google.com"},
    {"id": "j2",  "title": "Staff Data Scientist",         "company": "Flipkart",          "salary_range": [3_500_000, 6_000_000], "location": "Bangalore",  "industry": "E-commerce",     "required_skills": [
        "Python", "SQL", "Scikit-learn", "Apache Spark"],        "preferred_skills": ["dbt", "Airflow"],       "experience_years_min": 5, "remote": "On-site",  "url": "https://www.flipkartcareers.com"},
    {"id": "j3",  "title": "Principal Backend Engineer",   "company": "Swiggy",            "salary_range": [3_800_000, 6_500_000], "location": "Bangalore",  "industry": "Food Tech",      "required_skills": [
        "Java", "Python", "System Design", "Microservices", "Kafka"], "preferred_skills": ["Go", "Kubernetes"],     "experience_years_min": 6, "remote": "Hybrid",   "url": "https://bytes.swiggy.com/careers"},
    {"id": "j4",  "title": "ML Platform Engineer",         "company": "Walmart Labs India", "salary_range": [3_000_000, 5_500_000], "location": "Bengaluru",  "industry": "Retail Tech",    "required_skills": [
        "Python", "Kubernetes", "Apache Spark", "Airflow"],      "preferred_skills": ["Scala", "Terraform"],   "experience_years_min": 4, "remote": "Hybrid",   "url": "https://careers.walmart.com"},
    {"id": "j5",  "title": "Senior Data Engineer",         "company": "Razorpay",          "salary_range": [2_500_000, 4_500_000], "location": "Bangalore",  "industry": "Fintech",        "required_skills": [
        "Python", "SQL", "dbt", "Airflow", "Kafka"],              "preferred_skills": ["Snowflake"],          "experience_years_min": 3, "remote": "Hybrid",   "url": "https://razorpay.com/jobs"},
    {"id": "j6",  "title": "DevOps Lead",                  "company": "Infosys",           "salary_range": [2_000_000, 3_500_000], "location": "Hyderabad",  "industry": "IT Services",    "required_skills": [
        "Kubernetes", "Terraform", "AWS", "CI/CD", "Docker"],     "preferred_skills": ["Helm", "ArgoCD"],       "experience_years_min": 4, "remote": "On-site",  "url": "https://www.infosys.com/careers"},
    {"id": "j7",  "title": "AI Research Engineer",         "company": "Microsoft India",   "salary_range": [5_000_000, 9_000_000], "location": "Hyderabad",  "industry": "AI/Cloud",       "required_skills": [
        "Python", "PyTorch", "LLM", "MLOps"],                    "preferred_skills": ["Azure"],              "experience_years_min": 5, "remote": "Hybrid",   "url": "https://careers.microsoft.com"},
    {"id": "j8",  "title": "Senior Full Stack Developer",  "company": "Meesho",            "salary_range": [2_200_000, 4_000_000], "location": "Bangalore",  "industry": "Social Commerce", "required_skills": [
        "React", "Node.js", "PostgreSQL", "Docker"],             "preferred_skills": ["TypeScript", "Redis"],  "experience_years_min": 4, "remote": "Hybrid",   "url": "https://meesho.io/jobs"},
    {"id": "j9",  "title": "Cloud Solutions Architect",    "company": "TCS",               "salary_range": [2_800_000, 5_000_000], "location": "Mumbai",     "industry": "IT Services",    "required_skills": [
        "AWS", "Terraform", "Kubernetes", "System Design"],      "preferred_skills": ["GCP", "Azure"],        "experience_years_min": 6, "remote": "Hybrid",   "url": "https://www.tcs.com/careers"},
    {"id": "j10", "title": "Generative AI Engineer",       "company": "CRED",              "salary_range": [4_000_000, 7_000_000], "location": "Bangalore",  "industry": "Fintech",        "required_skills": [
        "Python", "LLM", "LangChain", "Generative AI"],          "preferred_skills": ["MLOps", "Vector DBs"], "experience_years_min": 3, "remote": "Hybrid",   "url": "https://cred.club/careers"},
    {"id": "j11", "title": "MLOps Engineer",               "company": "Ola",               "salary_range": [2_800_000, 5_000_000], "location": "Bangalore",  "industry": "Mobility Tech",  "required_skills": [
        "Python", "MLOps", "Docker", "Kubernetes", "Airflow"],    "preferred_skills": ["Prometheus"],         "experience_years_min": 3, "remote": "Hybrid",   "url": "https://ola.careers"},
    {"id": "j12", "title": "Senior Android Developer",     "company": "PhonePe",           "salary_range": [2_500_000, 4_500_000], "location": "Bangalore",  "industry": "Fintech",        "required_skills": [
        "Kotlin", "Java", "REST APIs", "Git"],                   "preferred_skills": ["Kubernetes"],        "experience_years_min": 4, "remote": "On-site",  "url": "https://www.phonepe.com/en/careers"},
]


async def fetch_live_jobs(query: str, location: str = "India") -> List[dict]:
    """Fetch live jobs from JSearch RapidAPI. Falls back to internal list on error."""
    if not RAPIDAPI_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://jsearch.p.rapidapi.com/search",
                headers={
                    "X-RapidAPI-Key":  RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                },
                params={"query": f"{query} in {location}",
                        "num_pages": "1", "page": "1"},
            )
            data = resp.json()
            jobs = []
            for j in data.get("data", [])[:12]:
                sal_min = j.get("job_min_salary") or 0
                sal_max = j.get("job_max_salary") or 0
                # Convert USD to INR approx if needed
                if sal_min and sal_min < 10_000:
                    sal_min = int(sal_min * 83)
                    sal_max = int(sal_max * 83)
                jobs.append({
                    "id":                  j.get("job_id", ""),
                    "title":               j.get("job_title", ""),
                    "company":             j.get("employer_name", ""),
                    "location":            j.get("job_city", "India"),
                    "salary_range":        [sal_min or 1_000_000, sal_max or 2_000_000],
                    "required_skills":     j.get("job_required_skills") or [],
                    "preferred_skills":    [],
                    "experience_years_min": j.get("job_required_experience", {}).get("required_experience_in_months", 0)//12,
                    "remote":              "Remote" if j.get("job_is_remote") else "On-site",
                    "url":                 j.get("job_apply_link", ""),
                    "industry":            j.get("job_publisher", ""),
                    "source":              "live",
                })
            return jobs
    except Exception:
        return []


def compute_match(user_skills: List[str], job: dict, user_score: float) -> dict:
    ul = [s.lower() for s in user_skills]
    req = job.get("required_skills", [])
    pref = job.get("preferred_skills", [])
    mreq = [s for s in req if s.lower() in ul]
    mpref = [s for s in pref if s.lower() in ul]
    miss = [s for s in req if s.lower() not in ul]
    so = (len(mreq) + 0.5 * len(mpref)) / max(len(req) + 0.5 * len(pref), 1)
    jn = normalize_salary(sum(job["salary_range"]) / 2)
    adv = jn["normalized_score"] > user_score
    comp = 0.50 * so + 0.25 * (1.0 if adv else 0.2) + 0.25 * 0.80
    return {
        "score":                round(comp * 100, 1),
        "skill_overlap":        round(so * 100, 1),
        "matched_skills":       mreq + mpref,
        "missing_skills":       miss,
        "advancement_guaranteed": adv,
        "salary_normalization": jn,
    }

# ─────────────────────────────────────────────────────────────────────────────
# LEARNING RESOURCES  (real URLs — YouTube, GeeksforGeeks, HackerRank, etc.)
# ─────────────────────────────────────────────────────────────────────────────


LEARN_RES: Dict[str, List[dict]] = {
    "Python": [
        {"title": "Python Tutorial for Beginners",             "platform": "YouTube",        "type": "video",        "rating": 4.9, "duration": "4 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",                                          "salary_uplift": "+₹80K",  "salary_uplift_amount": 80_000,   "skill_tag": "Python"},
        {"title": "Python – GeeksforGeeks",                    "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/python-programming-language/",                          "salary_uplift": "+₹80K",  "salary_uplift_amount": 80_000,   "skill_tag": "Python"},
        {"title": "Python Practice – HackerRank",              "platform": "HackerRank",     "type": "practice",     "rating": 4.8, "duration": "Self-paced", "price": "Free",
            "url": "https://www.hackerrank.com/domains/python",                                            "salary_uplift": "+₹70K",  "salary_uplift_amount": 70_000,   "skill_tag": "Python"},
        {"title": "Complete Python Bootcamp",                  "platform": "Udemy",          "type": "course",       "rating": 4.7, "duration": "6 weeks",  "price": "₹499",
            "url": "https://www.udemy.com/course/complete-python-bootcamp/",                               "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "Python"},
    ],
    "Data Structures": [
        {"title": "DSA Full Course",                           "platform": "YouTube",        "type": "video",        "rating": 4.9, "duration": "8 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=RBSGKlAvoiM",                                          "salary_uplift": "+₹1.5L", "salary_uplift_amount": 150_000,  "skill_tag": "Data Structures"},
        {"title": "DSA – GeeksforGeeks",                      "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.8, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/data-structures/",                                       "salary_uplift": "+₹1.5L", "salary_uplift_amount": 150_000,  "skill_tag": "Data Structures"},
        {"title": "Data Structures – HackerRank",              "platform": "HackerRank",     "type": "practice",     "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.hackerrank.com/domains/data-structures",                                   "salary_uplift": "+₹1.2L", "salary_uplift_amount": 120_000,  "skill_tag": "Data Structures"},
        {"title": "DSA – IndiaBix",                           "platform": "IndiaBix",       "type": "quiz",         "rating": 4.5, "duration": "Self-paced", "price": "Free",
            "url": "https://www.indiabix.com/computer-science/questions-and-answers/",                      "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "Data Structures"},
    ],
    "SQL": [
        {"title": "SQL Tutorial – W3Schools",                  "platform": "W3Schools",      "type": "tutorial",     "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.w3schools.com/sql/",                                                       "salary_uplift": "+₹80K",  "salary_uplift_amount": 80_000,   "skill_tag": "SQL"},
        {"title": "SQL – HackerRank",                         "platform": "HackerRank",     "type": "practice",     "rating": 4.8, "duration": "Self-paced", "price": "Free",
            "url": "https://www.hackerrank.com/domains/sql",                                               "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "SQL"},
        {"title": "SQL – GeeksforGeeks",                      "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/sql-tutorial/",                                          "salary_uplift": "+₹80K",  "salary_uplift_amount": 80_000,   "skill_tag": "SQL"},
        {"title": "Advanced SQL for Data Analysis",            "platform": "Mode Analytics", "type": "course",       "rating": 4.6, "duration": "4 weeks",  "price": "Free",
            "url": "https://mode.com/sql-tutorial/",                                                       "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "SQL"},
    ],
    "Machine Learning": [
        {"title": "Machine Learning Crash Course",             "platform": "YouTube",        "type": "video",        "rating": 4.8, "duration": "6 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=gmvvaobm7eQ",                                          "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "Machine Learning"},
        {"title": "ML – GeeksforGeeks",                       "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/machine-learning/",                                      "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "Machine Learning"},
        {"title": "Machine Learning – Coursera (Andrew Ng)",   "platform": "Coursera",       "type": "course",       "rating": 4.9, "duration": "3 months", "price": "₹3,500/mo",
         "url": "https://www.coursera.org/specializations/machine-learning-introduction",              "salary_uplift": "+₹3.5L", "salary_uplift_amount": 350_000,  "skill_tag": "Machine Learning"},
        {"title": "ML Practice – HackerRank",                 "platform": "HackerRank",     "type": "practice",     "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.hackerrank.com/domains/ai",                                               "salary_uplift": "+₹2.0L", "salary_uplift_amount": 200_000,  "skill_tag": "Machine Learning"},
    ],
    "TensorFlow": [
        {"title": "TensorFlow Developer Certificate Prep",     "platform": "Google",         "type": "certification", "rating": 4.8, "duration": "4 months", "price": "₹8,000",
            "url": "https://www.tensorflow.org/certificate",                                               "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "TensorFlow"},
        {"title": "Deep Learning Specialization",              "platform": "Coursera",       "type": "course",       "rating": 4.9, "duration": "3 months", "price": "₹3,500/mo",
            "url": "https://www.coursera.org/specializations/deep-learning",                              "salary_uplift": "+₹3.0L", "salary_uplift_amount": 300_000,  "skill_tag": "TensorFlow"},
        {"title": "TensorFlow Tutorial – YouTube",             "platform": "YouTube",        "type": "video",        "rating": 4.8, "duration": "5 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=tPYj3fFJGjk",                                          "salary_uplift": "+₹2.0L", "salary_uplift_amount": 200_000,  "skill_tag": "TensorFlow"},
    ],
    "PyTorch": [
        {"title": "PyTorch for Deep Learning",                 "platform": "Udemy",          "type": "course",       "rating": 4.8, "duration": "8 weeks",  "price": "₹499",
            "url": "https://www.udemy.com/course/pytorch-for-deep-learning-and-computer-vision/",          "salary_uplift": "+₹2.8L", "salary_uplift_amount": 280_000,  "skill_tag": "PyTorch"},
        {"title": "PyTorch Tutorials – YouTube",               "platform": "YouTube",        "type": "video",        "rating": 4.7, "duration": "4 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=c36lUUr864M",                                          "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "PyTorch"},
    ],
    "MLOps": [
        {"title": "MLOps Specialization",                      "platform": "Coursera",       "type": "course",       "rating": 4.6, "duration": "4 months", "price": "₹3,500/mo",
            "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops", "salary_uplift": "+₹4.0L", "salary_uplift_amount": 400_000,  "skill_tag": "MLOps"},
        {"title": "MLOps Full Course",                         "platform": "YouTube",        "type": "video",        "rating": 4.7, "duration": "6 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=-dJPoLm_gtE",                                          "salary_uplift": "+₹3.5L", "salary_uplift_amount": 350_000,  "skill_tag": "MLOps"},
    ],
    "Kubernetes": [
        {"title": "CKA Certification",                         "platform": "Linux Foundation", "type": "certification", "rating": 4.8, "duration": "3 months", "price": "₹29,000",
            "url": "https://training.linuxfoundation.org/certification/cka/",                              "salary_uplift": "+₹3.0L", "salary_uplift_amount": 300_000,  "skill_tag": "Kubernetes"},
        {"title": "Kubernetes Full Course",                    "platform": "YouTube",        "type": "video",        "rating": 4.8, "duration": "4 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=X48VuDVv0do",                                          "salary_uplift": "+₹2.8L", "salary_uplift_amount": 280_000,  "skill_tag": "Kubernetes"},
        {"title": "Kubernetes – GeeksforGeeks",               "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/kubernetes-tutorial/",                                   "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "Kubernetes"},
    ],
    "AWS": [
        {"title": "AWS Solutions Architect Associate",         "platform": "AWS",            "type": "certification", "rating": 4.7, "duration": "3 months", "price": "₹15,000",
            "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",         "salary_uplift": "+₹3.5L", "salary_uplift_amount": 350_000,  "skill_tag": "AWS"},
        {"title": "AWS Full Course – YouTube",                 "platform": "YouTube",        "type": "video",        "rating": 4.7, "duration": "10 hrs",   "price": "Free",
            "url": "https://www.youtube.com/watch?v=k1RI5locZE4",                                          "salary_uplift": "+₹3.0L", "salary_uplift_amount": 300_000,  "skill_tag": "AWS"},
        {"title": "AWS – GeeksforGeeks",                      "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/aws-tutorial/",                                          "salary_uplift": "+₹2.5L", "salary_uplift_amount": 250_000,  "skill_tag": "AWS"},
    ],
    "System Design": [
        {"title": "Grokking the System Design Interview",      "platform": "Educative.io",   "type": "course",       "rating": 4.9, "duration": "6 weeks",  "price": "₹2,500",
            "url": "https://www.educative.io/courses/grokking-the-system-design-interview",               "salary_uplift": "+₹4.5L", "salary_uplift_amount": 450_000,  "skill_tag": "System Design"},
        {"title": "System Design – YouTube (Gaurav Sen)",      "platform": "YouTube",        "type": "video",        "rating": 4.9, "duration": "Playlist", "price": "Free",
         "url": "https://www.youtube.com/@GauravSensei",                                                "salary_uplift": "+₹4.0L", "salary_uplift_amount": 400_000,  "skill_tag": "System Design"},
        {"title": "System Design – GeeksforGeeks",            "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/system-design-tutorial/",                                "salary_uplift": "+₹4.0L", "salary_uplift_amount": 400_000,  "skill_tag": "System Design"},
    ],
    "Docker": [
        {"title": "Docker Mastery",                            "platform": "Udemy",          "type": "course",       "rating": 4.8, "duration": "4 weeks",  "price": "₹499",
            "url": "https://www.udemy.com/course/docker-mastery/",                                         "salary_uplift": "+₹1.2L", "salary_uplift_amount": 120_000,  "skill_tag": "Docker"},
        {"title": "Docker Tutorial – YouTube",                 "platform": "YouTube",        "type": "video",        "rating": 4.7, "duration": "3 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo",                                          "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "Docker"},
        {"title": "Docker – GeeksforGeeks",                   "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/docker-tutorial/",                                       "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "Docker"},
    ],
    "React": [
        {"title": "React Full Course",                         "platform": "YouTube",        "type": "video",        "rating": 4.8, "duration": "8 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=bMknfKXIFA8",                                          "salary_uplift": "+₹1.2L", "salary_uplift_amount": 120_000,  "skill_tag": "React"},
        {"title": "The Complete React Developer",              "platform": "Zero to Mastery", "type": "course",      "rating": 4.8, "duration": "8 weeks",  "price": "₹1,999",
            "url": "https://zerotomastery.io/courses/learn-react/",                                        "salary_uplift": "+₹1.5L", "salary_uplift_amount": 150_000,  "skill_tag": "React"},
        {"title": "React – GeeksforGeeks",                    "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/react-tutorial/",                                        "salary_uplift": "+₹1.0L", "salary_uplift_amount": 100_000,  "skill_tag": "React"},
    ],
    "LLM": [
        {"title": "LLM University – Cohere",                  "platform": "Cohere",         "type": "course",       "rating": 4.8, "duration": "Self-paced", "price": "Free",
            "url": "https://docs.cohere.com/docs/llmu",                                                   "salary_uplift": "+₹6.0L", "salary_uplift_amount": 600_000,  "skill_tag": "LLM"},
        {"title": "Generative AI with LLMs",                  "platform": "Coursera",       "type": "course",       "rating": 4.8, "duration": "3 weeks",  "price": "₹3,500/mo",
            "url": "https://www.coursera.org/learn/generative-ai-with-llms",                              "salary_uplift": "+₹5.5L", "salary_uplift_amount": 550_000,  "skill_tag": "LLM"},
        {"title": "LangChain Full Course – YouTube",           "platform": "YouTube",        "type": "video",        "rating": 4.7, "duration": "5 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=lG7Uxts9SXs",                                          "salary_uplift": "+₹4.5L", "salary_uplift_amount": 450_000,  "skill_tag": "LLM"},
    ],
    "Aptitude": [
        {"title": "Aptitude Questions – IndiaBix",            "platform": "IndiaBix",       "type": "quiz",         "rating": 4.7, "duration": "Self-paced", "price": "Free",
            "url": "https://www.indiabix.com/aptitude/questions-and-answers/",                            "salary_uplift": "+₹50K",  "salary_uplift_amount": 50_000,   "skill_tag": "Aptitude"},
        {"title": "Quantitative Aptitude – GeeksforGeeks",    "platform": "GeeksforGeeks",  "type": "article/quiz", "rating": 4.6, "duration": "Self-paced", "price": "Free",
            "url": "https://www.geeksforgeeks.org/aptitude-gq/",                                           "salary_uplift": "+₹50K",  "salary_uplift_amount": 50_000,   "skill_tag": "Aptitude"},
        {"title": "Reasoning Practice – HackerRank",          "platform": "HackerRank",     "type": "practice",     "rating": 4.5, "duration": "Self-paced", "price": "Free",
            "url": "https://www.hackerrank.com/domains/tutorials/cracking-the-coding-interview",          "salary_uplift": "+₹60K",  "salary_uplift_amount": 60_000,   "skill_tag": "Aptitude"},
    ],
    "Communication": [
        {"title": "English Communication – Coursera",         "platform": "Coursera",       "type": "course",       "rating": 4.6, "duration": "4 weeks",  "price": "Free audit",
            "url": "https://www.coursera.org/learn/everyday-english",                                     "salary_uplift": "+₹40K",  "salary_uplift_amount": 40_000,   "skill_tag": "Communication"},
        {"title": "Business Communication – YouTube",          "platform": "YouTube",        "type": "video",        "rating": 4.5, "duration": "2 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=X2vAabgKiuM",                                          "salary_uplift": "+₹40K",  "salary_uplift_amount": 40_000,   "skill_tag": "Communication"},
    ],
    "Apache Spark": [
        {"title": "Apache Spark with Scala",                  "platform": "Udemy",          "type": "course",       "rating": 4.6, "duration": "6 weeks",  "price": "₹499",
            "url": "https://www.udemy.com/course/apache-spark-with-scala-hands-on-with-big-data/",         "salary_uplift": "+₹2.2L", "salary_uplift_amount": 220_000,  "skill_tag": "Apache Spark"},
        {"title": "Spark – YouTube",                          "platform": "YouTube",        "type": "video",        "rating": 4.6, "duration": "5 hrs",    "price": "Free",
            "url": "https://www.youtube.com/watch?v=F8pyaR4uQ2g",                                          "salary_uplift": "+₹2.0L", "salary_uplift_amount": 200_000,  "skill_tag": "Apache Spark"},
    ],
}

DEFAULT_RESOURCES = [
    {"skill": "System Design",  **LEARN_RES["System Design"][0]},
    {"skill": "Python",         **LEARN_RES["Python"][0]},
    {"skill": "AWS",            **LEARN_RES["AWS"][0]},
]


def get_resources(skills: List[str]) -> List[dict]:
    res = []
    for s in skills[:8]:
        key = next((k for k in LEARN_RES if k.lower() == s.lower()), None)
        if key:
            for r in LEARN_RES[key]:
                res.append({"skill": s, **r})
    return res or DEFAULT_RESOURCES

# ─────────────────────────────────────────────────────────────────────────────
# GEMINI AI HELPER
# ─────────────────────────────────────────────────────────────────────────────


async def call_gemini(prompt: str, system: str = "") -> str:
    if not GEMINI_API_KEY:
        return "AI features require GEMINI_API_KEY. Please configure it."

    models_to_try = ["gemini-2.0-flash",
                     "gemini-flash-latest", "gemini-pro-latest"]
    last_error = ""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        full_system = system or (
            "You are CareerIQ Pro AI — a world-class professional career coach and expert technical interviewer. "
            "STRICT RULES: "
            "1. NEVER use bold markdown (no ** symbols). Use plain text or bullet points (-) for emphasis. "
            "2. NEVER mention 'Gemini', 'Google', or any specific AI model. You are 'CareerIQ Pro AI'. "
            "3. If a candidate says 'I don't know' or is unsure, briefly and professionally explain the core concept "
            "in 1-2 sentences to help them learn, then proceed to the next question or topic. "
            "4. All salaries must be in INR. Be concise, actionable, and focus on the Indian tech job market."
        )

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_system + "\n\nUser Query:\n" + prompt
                )
                return response.text
            except Exception as e:
                last_error = str(e)
                # If it's a quota error, we continue to the next model
                if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                    continue
                # For other errors (like invalid prompt), we stop
                break

        if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
            return "[QUOTA_EXHAUSTED]"
        return f"AI response unavailable: {last_error}"

    except Exception as e:
        return f"AI Client Error: {str(e)}"
# ─────────────────────────────────────────────────────────────────────────────
# INTERVIEW SCORER
# ─────────────────────────────────────────────────────────────────────────────


def score_answer(question: str, answer: str) -> dict:
    if not answer or len(answer.strip()) < 20:
        return {"score": 10, "feedback": "Answer too brief. Use STAR framework.",
                "strengths": [], "improvements": ["Add more detail", "Use STAR framework"],
                "score_breakdown": {"depth": 2, "structure": 2, "specificity": 3, "clarity": 3}}
    wc = len(answer.split())
    depth = min(40, wc // 5)
    sk = ["first", "second", "finally", "because",
          "therefore", "however", "for example", "specifically"]
    structure = min(30, sum(5 for k in sk if k in answer.lower()))
    pk = ["₹", "%", "lakh", "crore", "reduced", "improved",
          "built", "deployed", "increased", "achieved"]
    spec = min(20, sum(4 for k in pk if k in answer.lower()))
    clar = min(10, 10 if wc > 50 else wc // 5)
    total = min(100, max(20, depth + structure + spec + clar))
    fb = ("Excellent! Well-structured with specific examples." if total >= 80 else
          "Good answer. Add more specific metrics and real examples." if total >= 60 else
          "Average. Needs more depth and structure." if total >= 40 else
          "Needs improvement. Focus on structure and specifics.")
    return {"score": total, "feedback": fb,
            "strengths": ["Clear communication"] if total > 50 else [],
            "improvements": ([] if total >= 80 else ["Add quantified achievements"]),
            "score_breakdown": {"depth": depth, "structure": structure,
                                "specificity": spec, "clarity": clar},
            "word_count": wc}


IQ = {
    "software_engineer": [
        {"q": "Tell me about your background and what draws you to this role. What key experiences make you a strong candidate?"},
        {"q": "Explain a complex technical challenge you faced. How did you solve it and what was the outcome?"},
        {"q": "How do you handle conflict in a team or a disagreement over a technical decision?"},
        {"q": "Describe your experience with large-scale data processing or system architecture. What tools do you prefer?"},
        {"q": "What is your approach to learning a new technology quickly? Can you give an example from your current role?"},
        {"q": "How do you ensure your code is maintainable and scalable? Mention specific practices like testing or CI/CD."},
        {"q": "Tell me about a time you failed or missed a deadline. How did you manage the situation and what did you learn?"},
        {"q": "Where do you see yourself in 3 years? How does this role align with your long-term career goals?"},
        {"q": "Do you have any questions for me about the company or the team culture?"},
        {"q": "How do you stay updated with the latest industry trends and technologies?"},
        {"q": "What is your process for debugging a production issue? Describe the tools and techniques you use."},
        {"q": "How do you prioritize tasks when you have multiple projects with competing deadlines?"},
    ],
    "ai_engineer": [
        {"q": "Explain L1 vs L2 regularization. When would you use each?"},
        {"q": "How does the transformer attention mechanism work? Describe self-attention, multi-head, and complexity."},
        {"q": "Handle class imbalance in a fraud detection model. Discuss imbalance, SMOTE, PR-AUC, and threshold tuning."},
        {"q": "Explain the bias-variance tradeoff with a real-world example and how to fix strategies for each case."},
        {"q": "Deploy an ML model for 1 million predictions per day. Discuss format, API, batching, and monitoring."},
        {"q": "How do you debug an ML model with 99% train accuracy but only 60% test accuracy?"},
        {"q": "What is your experience with fine-tuning Large Language Models (LLMs)? Detail any techniques like LoRA or PEFT."},
        {"q": "Design a recommendation system for an e-commerce platform with 50 million monthly active users."},
        {"q": "How do you handle data drift in a production ML pipeline? Describe your monitoring and retraining strategy."},
        {"q": "Explain the difference between supervised, unsupervised, and reinforcement learning with use cases."},
        {"q": "Tell me about your experience with vector databases like Chroma, Pinecone, or Weaviate in RAG applications."},
        {"q": "What are the common evaluation metrics for an LLM-based application? Discuss RAGAS, BLEU, and ROUGE."},
    ],
    "frontend": [
        {"q": "What is your strategy for optimizing the performance of a React application with a large number of components?"},
        {"q": "Explain the differences between Server-Side Rendering (SSR) and Static Site Generation (SSG) in a framework like Next.js."},
        {"q": "How do you manage global state in a complex frontend application? Discuss Redux, Context API, and Zustand."},
        {"q": "Describe your experience with CSS-in-JS vs Traditional CSS. What are the pros and cons of each in a large team?"},
        {"q": "How do you ensure web accessibility (a11y) in your frontend development? What tools and practices do you follow?"},
        {"q": "Explain the Virtual DOM and its role in React. How does it improve performance?"},
        {"q": "What is your approach to frontend testing? Discuss unit tests, integration tests, and end-to-end testing with tools like Jest or Cypress."},
        {"q": "How do you handle responsive design and cross-browser compatibility across different device types?"},
        {"q": "Describe your experience with TypeScript. How has it improved your development workflow and code quality?"},
        {"q": "How do you optimize core web vitals for a high-traffic web application?"},
        {"q": "Explain the concept of 'Hydration' in the context of SSR and SSG."},
        {"q": "How do you handle authentication and authorization in a Single Page Application (SPA)?"},
    ],
    "backend": [
        {"q": "Explain the differences between Monolithic and Microservices architectures. What factors influence your choice?"},
        {"q": "How do you design a RESTful API? Discuss versioning, authentication, and error handling best practices."},
        {"q": "Describe your experience with Relational vs NoSQL databases. When would you choose one over the other?"},
        {"q": "How do you handle database migrations in a production environment with zero downtime?"},
        {"q": "Explain the concept of ACID properties in the context of database transactions."},
        {"q": "How do you optimize the performance of a slow database query? Discuss indexing, caching, and partitioning."},
        {"q": "What is your strategy for handling high-volume concurrent requests in a backend service? Discuss message queues and load balancing."},
        {"q": "Describe your experience with containerization technologies like Docker and orchestration with Kubernetes."},
        {"q": "How do you ensure the security of your backend services? Discuss JWT, OAuth2, and rate limiting."},
        {"q": "Explain the difference between horizontal and vertical scaling for backend applications."},
        {"q": "What is your experience with event-driven architecture? Discuss tools like Kafka or RabbitMQ."},
        {"q": "How do you implement monitoring and observability for your backend services? Discuss logging, tracing, and metrics."},
    ],
    "devops": [
        {"q": "Explain the core principles of CI/CD and how you've implemented them in your previous roles."},
        {"q": "What is Infrastructure as Code (IaC)? Describe your experience with tools like Terraform or CloudFormation."},
        {"q": "How do you manage secret data in a cloud environment? Discuss AWS Secrets Manager, HashiCorp Vault, etc."},
        {"q": "Explain the concept of Canary deployment and how it differs from Blue-Green deployment."},
        {"q": "Describe your experience with monitoring tools like Prometheus, Grafana, or ELK stack."},
        {"q": "How do you handle scaling a Kubernetes cluster based on traffic and resource utilization?"},
        {"q": "What is your approach to disaster recovery and backup management in a cloud-native architecture?"},
        {"q": "Explain the shared responsibility model in cloud security (AWS, GCP, or Azure)."},
        {"q": "How do you optimize cloud costs without sacrificing performance or reliability?"},
        {"q": "Describe your experience with serverless technologies like AWS Lambda or Google Cloud Functions."},
        {"q": "How do you implement a Zero Trust security model in a cloud environment?"},
        {"q": "Explain the concept of GitOps and how it improves infrastructure management."},
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# PORTFOLIO PROJECTS  (seeded suggestions)
# ─────────────────────────────────────────────────────────────────────────────

PORTFOLIO_SUGGESTIONS = [
    {"title": "Stock Price Predictor (BSE/NSE)",       "tech": ["Python", "LSTM", "FastAPI", "React"],               "description": "ML app predicting Indian stock trends with explainable AI dashboard.",
     "github_value": "Very High",      "estimated_time": "3–4 weeks", "salary_impact": "+₹1.5L", "salary_impact_amount": 150_000, "emoji": "📈"},
    {"title": "NLP Resume Screener (Multilingual)",    "tech": ["Python", "BERT", "spaCy", "FastAPI"],               "description": "ATS tool with Hindi+English support using transformer models.",
     "github_value": "Extremely High", "estimated_time": "2–3 weeks", "salary_impact": "+₹2.0L", "salary_impact_amount": 200_000, "emoji": "🔍"},
    {"title": "Kubernetes Auto-Scaler with ML",        "tech": ["Kubernetes", "Python", "Prometheus", "Grafana"],    "description": "Custom HPA controller with ML-based workload prediction.",
        "github_value": "High",           "estimated_time": "4–5 weeks", "salary_impact": "+₹2.5L", "salary_impact_amount": 250_000, "emoji": "⚙️"},
    {"title": "LLM Fine-Tuning (Hindi Domain)",        "tech": ["PyTorch", "HuggingFace", "PEFT", "W&B"],            "description": "Fine-tune Llama/Mistral on Indian domain data (legal, medical).",
     "github_value": "Extremely High", "estimated_time": "6–8 weeks", "salary_impact": "+₹5.0L", "salary_impact_amount": 500_000, "emoji": "🤖"},
    {"title": "UPI Fraud Detection System",            "tech": ["Kafka", "Spark", "Python", "MLflow", "Docker"],      "description": "Real-time stream processing for UPI transaction fraud at scale.",
        "github_value": "Very High",      "estimated_time": "5–6 weeks", "salary_impact": "+₹3.0L", "salary_impact_amount": 300_000, "emoji": "🛡️"},
    {"title": "AI-Powered Career Coach App",           "tech": ["React", "FastAPI", "Gemini", "PostgreSQL"],         "description": "Full-stack web app with AI resume analysis and job matching.",
        "github_value": "High",           "estimated_time": "4–5 weeks", "salary_impact": "+₹2.0L", "salary_impact_amount": 200_000, "emoji": "🎯"},
]

# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CareerIQ Pro API",
    description="Production-grade career intelligence platform — India Edition",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()

# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "CareerIQ Pro API v3.0 — India Edition", "status": "operational", "currency": "INR"}


@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0.0", "db": "connected",
            "ai": "configured" if GEMINI_API_KEY else "not_configured",
            "jobs_api": "configured" if RAPIDAPI_KEY else "internal_fallback"}

# ─── User Onboarding ──────────────────────────────────────────────────────────


@app.post("/api/auth/register")
async def register(req: UserOnboardRequest, db: Session = Depends(get_db)):
    email_hash = hashlib.sha256(req.email.encode()).hexdigest()
    existing = db.query(DBUser).filter(DBUser.email_hash == email_hash).first()
    if existing:
        nm = normalize_salary(req.current_salary)
        existing.name_alias = req.name
        existing.current_role = req.current_role
        existing.target_role = req.target_role
        existing.experience_years = req.experience_years
        existing.location = req.location
        existing.current_salary = req.current_salary
        existing.salary_level = nm["level"]
        existing.skills = req.skills
        existing.goals = req.goals
        db.commit()
        db.refresh(existing)
        return {"status": "success", "user_id": existing.id, "message": "Profile updated", "user": {
            "name": existing.name_alias, "current_role": existing.current_role,
            "target_role": existing.target_role, "skills": existing.skills, "id": existing.id,
            "experience_years": existing.experience_years, "location": existing.location,
            "current_salary": existing.current_salary, "salary_level": existing.salary_level,
            "goals": existing.goals
        }}
    nm = normalize_salary(req.current_salary)
    user = DBUser(
        email_hash=email_hash,
        name_alias=req.name,
        current_role=req.current_role,
        target_role=req.target_role,
        experience_years=req.experience_years,
        location=req.location,
        current_salary=req.current_salary,
        salary_level=nm["level"],
        skills=req.skills,
        goals=req.goals,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Seed initial score history
    sal_est = estimate_salary(
        req.current_role, req.experience_years, req.skills, req.location)
    sh = DBScoreHistory(
        user_id=user.id,
        salary_score=nm["normalized_score"],
        job_match_score=0,
        skill_score=min(len(req.skills) * 3, 100),
        ats_score=0,
        skills_count=len(req.skills),
    )
    db.add(sh)
    db.commit()
    return {"status": "success", "user_id": user.id, "message": "User created",
            "salary_benchmark": sal_est, "level": nm["level"], "user": {
                "name": user.name_alias, "current_role": user.current_role,
                "target_role": user.target_role, "skills": user.skills, "id": user.id,
                "experience_years": user.experience_years, "location": user.location,
                "current_salary": user.current_salary, "salary_level": user.salary_level,
                "goals": user.goals
            }}


@app.get("/api/user/profile/{user_id}")
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return {"status": "success", "profile": {
        "id": user.id, "name": user.name_alias,
        "current_role": user.current_role, "target_role": user.target_role,
        "experience_years": user.experience_years, "location": user.location,
        "current_salary": user.current_salary, "salary_level": user.salary_level,
        "skills": user.skills or [], "goals": user.goals or {},
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }}


@app.put("/api/user/profile/{user_id}")
async def update_profile(user_id: str, payload: dict, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in payload.items():
        if hasattr(user, k):
            setattr(user, k, v)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Profile updated"}


@app.delete("/api/user/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"status": "success", "message": "Account deleted"}

# ─── Resume Analysis (merged: ATS + Builder + AI Explainability) ──────────────


@app.post("/api/resume/analyze")
async def analyze_resume(req: ResumeRequest, db: Session = Depends(get_db)):
    if not req.resume_text or len(req.resume_text.strip()) < 50:
        raise HTTPException(
            400, "Resume text too short. Paste at least 100 characters.")
    p = parse_resume(req.resume_text)
    sal = estimate_salary(req.target_role or "Software Engineer",
                          p["estimated_experience_years"], p["extracted_skills"], "Bangalore",
                          p["education_level"])
    gap = analyze_skill_gap(p["extracted_skills"],
                            req.target_role) if req.target_role else None

    # AI explainability via Gemini
    ai_feedback = await call_gemini(
        f"Resume analysis for a {req.target_role or 'tech professional'} in India.\n"
        f"Extracted skills: {', '.join(p['extracted_skills'][:15])}\n"
        f"Experience: {p['estimated_experience_years']} years\n"
        f"ATS score: {p['ats_score']}/100\n\n"
        "Give 3 specific improvements to increase ATS score and 2 salary negotiation tips. Be concise."
    )

    # Persist resume record
    resume_record = None
    if req.user_id:
        resume_record = DBResume(
            user_id=req.user_id,
            anonymized_text=p["anonymized_text"],
            extracted_skills=p["extracted_skills"],
            experience_years=p["estimated_experience_years"],
            education_level=p["education_level"],
            ats_score=p["ats_score"],
            quality_score=max(40, p["ats_score"] - 8),
            salary_estimate=sal["estimated_salary"],
            analysis_json={"parsing": p, "salary": sal, "gap": gap},
            ai_feedback=ai_feedback,
        )
        db.add(resume_record)
        db.commit()

    return {
        "status":               "success",
        "resume_id":            resume_record.id if resume_record else None,
        "parsing":              p,
        "salary_estimation":    sal,
        "skill_gap":            gap,
        "ats_score":            p["ats_score"],
        "resume_quality_score": max(40, p["ats_score"] - 8),
        "ai_feedback":          ai_feedback,
        "ats_optimization":     None,   # populated separately via /api/resume/ats-optimize
        "recommendations": [
            "Add quantified achievements: 'Reduced API latency by 40%', 'Saved ₹50L infra cost'",
            "Include certifications: AWS, GCP, CKA, TF Developer",
            "Add GitHub/LinkedIn links prominently",
            "Mention team size and leadership impact",
            "Start every bullet with action verb: Led, Built, Scaled, Reduced",
        ],
        "currency": "INR",
    }


@app.post("/api/resume/ats-optimize")
async def ats_endpoint(req: ATSRequest):
    result = ats_optimize(req.resume_text, req.job_description)
    ai_suggestions = await call_gemini(
        f"ATS optimization for job description.\n"
        f"Missing keywords: {', '.join(result['missing_keywords'][:8])}\n"
        f"Overall score: {result['overall_ats_score']}/100\n\n"
        "Give 3 targeted bullet-point suggestions to improve the resume for this JD. Keep it concise."
    )
    return {"status": "success", **result, "ai_suggestions": ai_suggestions}


@app.post("/api/resume/ai-build")
async def ai_resume_builder(payload: dict):
    """Generate AI-powered resume bullet points."""
    role = payload.get("role", "Software Engineer")
    skills = payload.get("skills", [])
    achievements = payload.get("achievements", "")
    ai_bullets = await call_gemini(
        f"Generate 5 strong ATS-optimised resume bullet points for a {role} in India.\n"
        f"Skills: {', '.join(skills[:10])}\n"
        f"Key achievements: {achievements}\n\n"
        "Format as numbered list. Each bullet: action verb + metric + impact. Use INR for salary figures."
    )
    return {"status": "success", "ai_bullets": ai_bullets, "role": role}


@app.post("/api/ai/chat")
async def ai_chat_endpoint(payload: dict):
    prompt = payload.get("prompt", "")
    system = payload.get("system", "")
    if not prompt:
        raise HTTPException(400, "Prompt is required")
    result = await call_gemini(prompt, system)
    if result == "[QUOTA_EXHAUSTED]":
        return {"status": "exhausted", "response": "AI is currently at capacity. Switching to offline mode."}
    return {"status": "success", "response": result}

# ─── Salary ───────────────────────────────────────────────────────────────────


@app.post("/api/salary/normalize")
async def salary_endpoint(req: SalaryRequest):
    return {"status": "success",
            "data": estimate_salary(req.role, req.experience_years,
                                    req.skills, req.location, req.education)}


@app.get("/api/salary-levels")
async def salary_levels():
    out = {k: {**v, "formatted_low": fmt(v["range"][0]),
               "formatted_high": fmt(v["range"][1])} for k, v in SALARY_LEVELS.items()}
    return {"status": "success", "levels": out, "currency": "INR"}


@app.get("/api/career/growth-forecast")
async def growth_forecast(current_salary: float = 1_200_000,
                          current_level:  str = "L3",
                          years:          int = 5):
    levels = list(SALARY_LEVELS.keys())
    idx = levels.index(current_level) if current_level in levels else 2
    scenarios = {
        "conservative": {"rate": 0.08,  "label": "Conservative (8%)"},
        "moderate":     {"rate": 0.14,  "label": "Moderate (14%)"},
        "aggressive":   {"rate": 0.22,  "label": "Aggressive (22%)"},
    }
    traj = {}
    for sc, cfg in scenarios.items():
        pts = [{
            "year":              datetime.now().year + i,
            "projected_salary":  round(current_salary * math.pow(1 + cfg["rate"], i)),
            "formatted":         fmt(current_salary * math.pow(1 + cfg["rate"], i)),
            "level":             levels[min(idx + i // 2, len(levels) - 1)],
            "cumulative_growth_pct": round((math.pow(1 + cfg["rate"], i) - 1) * 100, 1),
        } for i in range(years + 1)]
        traj[sc] = {"points": pts, "label": cfg["label"],
                    "final_formatted": fmt(current_salary * math.pow(1 + cfg["rate"], years))}
    return {"status": "success", "trajectories": traj,
            "current_salary": round(current_salary), "current_formatted": fmt(current_salary),
            "current_level": current_level, "years": years, "currency": "INR"}

# ─── Jobs ──────────────────────────────────────────────────────────────────────


@app.post("/api/jobs/match")
async def jobs_match(req: JobMatchRequest):
    live_jobs = await fetch_live_jobs(
        " OR ".join(
            req.target_roles[:2]) if req.target_roles else "software engineer",
        req.location or "India"
    )
    all_jobs = live_jobs + INDIA_JOBS_FALLBACK if not live_jobs else live_jobs
    results = []
    for j in all_jobs:
        m = compute_match(req.user_skills, j, req.current_salary_score)
        if m["advancement_guaranteed"]:
            jj = dict(j)
            jj["match"] = m
            jj["salary_formatted"] = f"{fmt(j['salary_range'][0])} – {fmt(j['salary_range'][1])}"
            results.append(jj)
    results.sort(key=lambda x: x["match"]["score"], reverse=True)
    return {"status": "success", "jobs": results[:10], "total_found": len(results),
            "source": "live" if live_jobs else "internal", "currency": "INR"}


@app.post("/api/jobs/search")
async def jobs_search(payload: dict):
    skills = payload.get("skills", [])
    score = payload.get("salary_score", 0.2)
    query = payload.get("query", "software engineer")
    loc = payload.get("location", "India")
    live = await fetch_live_jobs(query, loc)
    all_j = live + INDIA_JOBS_FALLBACK if not live else live
    results = [{**j, "match": compute_match(skills, j, score),
               "salary_formatted": f"{fmt(j['salary_range'][0])} – {fmt(j['salary_range'][1])}"} for j in all_j]
    results.sort(key=lambda x: x["match"]["score"], reverse=True)
    return {"status": "success", "jobs": results[:12], "source": "live" if live else "internal", "currency": "INR"}

# ─── Skills ───────────────────────────────────────────────────────────────────


@app.post("/api/skills/gap")
async def skills_gap(req: SkillGapRequest):
    gap = analyze_skill_gap(req.current_skills, req.target_role)
    res = get_resources(gap["skills_priority"] + gap["skills_missing"][:3])
    return {"status": "success", "gap_analysis": gap, "learning_resources": res}


@app.get("/api/resources/{skill}")
async def resources(skill: str):
    return {"status": "success", "resources": get_resources([skill])}


@app.get("/api/resources")
async def all_resources(category: Optional[str] = None):
    result = []
    for skill, items in LEARN_RES.items():
        for item in items:
            result.append({"skill": skill, **item})
    if category:
        result = [r for r in result if category.lower() in r.get("platform", "").lower()
                  or category.lower() in r.get("type", "").lower()]
    return {"status": "success", "resources": result, "total": len(result)}

# ─── Progress Tracker ─────────────────────────────────────────────────────────


@app.get("/api/progress/{user_id}")
async def get_progress(user_id: str, db: Session = Depends(get_db)):
    entries = db.query(DBProgressEntry).filter(
        DBProgressEntry.user_id == user_id).all()
    total_salary_impact = sum(
        e.salary_impact for e in entries if e.status == "completed")
    completed = [e for e in entries if e.status == "completed"]
    in_progress = [e for e in entries if e.status == "in_progress"]
    return {
        "status": "success",
        "entries": [{
            "id":             e.id,
            "platform":       e.platform,
            "resource_title": e.resource_title,
            "resource_url":   e.resource_url,
            "skill_tag":      e.skill_tag,
            "category":       e.category,
            "sessions":       e.sessions,
            "progress_pct":   e.progress_pct,
            "status":         e.status,
            "salary_impact":  e.salary_impact,
            "notes":          e.notes,
            "started_at":     e.started_at.isoformat() if e.started_at else None,
            "completed_at":   e.completed_at.isoformat() if e.completed_at else None,
        } for e in entries],
        "summary": {
            "total":               len(entries),
            "completed":           len(completed),
            "in_progress":         len(in_progress),
            "total_sessions":      sum(e.sessions for e in entries),
            "avg_progress":        round(sum(e.progress_pct for e in entries) / max(len(entries), 1), 1),
            "total_salary_impact": total_salary_impact,
            "total_salary_impact_formatted": fmt(total_salary_impact),
        },
    }


@app.post("/api/progress/upsert")
async def upsert_progress(req: ProgressUpsertRequest, db: Session = Depends(get_db)):
    existing = (db.query(DBProgressEntry)
                  .filter(DBProgressEntry.user_id == req.user_id,
                          DBProgressEntry.resource_url == req.resource_url)
                  .first())
    # Determine salary impact from LEARN_RES
    sal_impact = 0.0
    for skill_items in LEARN_RES.values():
        for item in skill_items:
            if item.get("url", "").lower() == req.resource_url.lower():
                sal_impact = item.get("salary_uplift_amount", 0.0)
                break

    if existing:
        existing.sessions = req.sessions
        existing.progress_pct = req.progress_pct
        existing.status = req.status
        existing.notes = req.notes or existing.notes
        existing.salary_impact = sal_impact if req.status == "completed" else 0.0
        if req.status == "in_progress" and not existing.started_at:
            existing.started_at = datetime.utcnow()
        if req.status == "completed" and not existing.completed_at:
            existing.completed_at = datetime.utcnow()
        existing.updated_at = datetime.utcnow()
        db.commit()
        entry_id = existing.id
    else:
        entry = DBProgressEntry(
            user_id=req.user_id,
            platform=req.platform,
            resource_title=req.resource_title,
            resource_url=req.resource_url,
            skill_tag=req.skill_tag,
            category=req.category,
            sessions=req.sessions,
            progress_pct=req.progress_pct,
            status=req.status,
            salary_impact=sal_impact if req.status == "completed" else 0.0,
            notes=req.notes,
            started_at=datetime.utcnow() if req.status != "not_started" else None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        entry_id = entry.id
    return {"status": "success", "entry_id": entry_id, "salary_impact": sal_impact}


@app.post("/api/progress/session")
async def record_session(req: ProgressSessionRequest, db: Session = Depends(get_db)):
    """Increment session count and update progress for a tracked resource."""
    entry = db.query(DBProgressEntry).filter(
        DBProgressEntry.id == req.entry_id).first()
    if not entry:
        raise HTTPException(404, "Progress entry not found")
    entry.sessions += req.sessions_delta
    entry.progress_pct = min(100.0, req.progress_pct or entry.progress_pct)
    entry.status = "completed" if entry.progress_pct >= 100 else "in_progress"
    if not entry.started_at:
        entry.started_at = datetime.utcnow()
    if entry.status == "completed" and not entry.completed_at:
        entry.completed_at = datetime.utcnow()
        entry.salary_impact = next(
            (item.get("salary_uplift_amount", 0)
             for skill_items in LEARN_RES.values()
             for item in skill_items
             if item.get("url", "").lower() == entry.resource_url.lower()), 0.0)
    entry.updated_at = datetime.utcnow()
    db.commit()

    # Update score history
    user_entries = db.query(DBProgressEntry).filter(
        DBProgressEntry.user_id == entry.user_id).all()
    done = [e for e in user_entries if e.status == "completed"]
    sh = DBScoreHistory(
        user_id=entry.user_id,
        skill_score=min(len(done) * 5, 100),
        courses_done=len(done),
        recorded_at=datetime.utcnow(),
    )
    db.add(sh)
    db.commit()
    return {"status": "success", "sessions": entry.sessions,
            "progress_pct": entry.progress_pct, "entry_status": entry.status}


@app.get("/api/progress/learning-impact/{user_id}")
async def learning_impact(user_id: str, db: Session = Depends(get_db)):
    """Aggregate learning impact linked to completed and in-progress courses."""
    entries = db.query(DBProgressEntry).filter(
        DBProgressEntry.user_id == user_id).all()
    history = (db.query(DBScoreHistory)
                 .filter(DBScoreHistory.user_id == user_id)
                 .order_by(DBScoreHistory.recorded_at)
                 .all())
    completed = [e for e in entries if e.status == "completed"]
    in_prog = [e for e in entries if e.status == "in_progress"]
    total_impact = sum(e.salary_impact for e in completed)
    skills_gained = list({e.skill_tag for e in completed})
    monthly = {}
    for e in completed:
        if e.completed_at:
            k = e.completed_at.strftime("%Y-%m")
            monthly.setdefault(
                k, {"month": k, "courses_completed": 0, "salary_impact": 0})
            monthly[k]["courses_completed"] += 1
            monthly[k]["salary_impact"] += e.salary_impact
    return {
        "status": "success",
        "total_salary_impact":           total_impact,
        "total_salary_impact_formatted": fmt(total_impact),
        "courses_completed":             len(completed),
        "courses_in_progress":           len(in_prog),
        "skills_gained":                 skills_gained,
        "monthly_progress":              sorted(monthly.values(), key=lambda x: x["month"]),
        "score_history": [{
            "recorded_at":    sh.recorded_at.isoformat(),
            "skill_score":    sh.skill_score,
            "courses_done":   sh.courses_done,
        } for sh in history],
        "progress_by_platform": _group_by_platform(entries),
    }


def _group_by_platform(entries) -> list:
    d = {}
    for e in entries:
        d.setdefault(
            e.platform, {"platform": e.platform, "total": 0, "completed": 0})
        d[e.platform]["total"] += 1
        if e.status == "completed":
            d[e.platform]["completed"] += 1
    return list(d.values())

# ─── Score History ────────────────────────────────────────────────────────────


@app.get("/api/progress/scores/{user_id}")
async def progress_scores(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    history = (db.query(DBScoreHistory)
                 .filter(DBScoreHistory.user_id == user_id)
                 .order_by(DBScoreHistory.recorded_at)
                 .all())
    latest = history[-1] if history else None
    return {
        "status":  "success",
        "scores": {
            "salary_score":    latest.salary_score if latest else 0,
            "job_match_score": latest.job_match_score if latest else 0,
            "skill_score":     latest.skill_score if latest else 0,
            "ats_score":       latest.ats_score if latest else 0,
            "skills_count":    latest.skills_count if latest else 0,
        },
        "history": [{
            "recorded_at":    sh.recorded_at.isoformat(),
            "salary_score":   sh.salary_score,
            "job_match_score": sh.job_match_score,
            "skill_score":    sh.skill_score,
            "ats_score":      sh.ats_score,
        } for sh in history],
    }

# ─── Career Map ───────────────────────────────────────────────────────────────


@app.get("/api/career/map/{user_id}")
async def career_map(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    gap = analyze_skill_gap(
        user.skills or [], user.target_role or "Software Engineer")
    sal = estimate_salary(user.current_role or "Software Engineer",
                          user.experience_years or 0, user.skills or [], user.location or "India")
    ai_roadmap = await call_gemini(
        f"Career map for {user.name_alias} who is a {user.current_role} (L{user.salary_level or '3'}) "
        f"targeting {user.target_role} in India.\n"
        f"Current skills: {', '.join((user.skills or [])[:10])}\n"
        f"Missing skills: {', '.join(gap['skills_missing'][:6])}\n\n"
        "Give a 6-month structured roadmap with milestones (month 1, 2, 4, 6). Be specific and concise."
    )
    return {
        "status":          "success",
        "current_role":    user.current_role,
        "target_role":     user.target_role,
        "current_level":   user.salary_level,
        "current_salary":  user.current_salary,
        "current_salary_formatted": fmt(user.current_salary),
        "skill_gap":       gap,
        "salary_uplift_potential": gap["total_potential_salary_uplift_formatted"],
        "ai_roadmap":      ai_roadmap,
        "recommended_resources": get_resources(gap["skills_priority"]),
    }

# ─── Market Insights ──────────────────────────────────────────────────────────


@app.get("/api/market/insights")
async def market_insights():
    return {
        "status": "success",
        "trending_skills": [
            {"skill": "Generative AI / LLM",     "demand_growth": "+124%",
                "avg_salary_premium": "₹6L–₹12L",  "premium_amount": 900_000},
            {"skill": "MLOps",                    "demand_growth": "+89%",
                "avg_salary_premium": "₹4L–₹8L",   "premium_amount": 600_000},
            {"skill": "Kubernetes",               "demand_growth": "+67%",
                "avg_salary_premium": "₹3L–₹5L",   "premium_amount": 400_000},
            {"skill": "Rust",                     "demand_growth": "+56%",
                "avg_salary_premium": "₹3.5L–₹6L", "premium_amount": 475_000},
            {"skill": "Apache Kafka",             "demand_growth": "+61%",
                "avg_salary_premium": "₹2.5L–₹4L", "premium_amount": 325_000},
            {"skill": "Terraform",                "demand_growth": "+48%",
                "avg_salary_premium": "₹2.5L–₹4.5L", "premium_amount": 350_000},
            {"skill": "System Design",            "demand_growth": "+43%",
                "avg_salary_premium": "₹4L–₹7L",   "premium_amount": 550_000},
            {"skill": "dbt + Modern Data Stack",  "demand_growth": "+71%",
                "avg_salary_premium": "₹2L–₹3.5L", "premium_amount": 275_000},
        ],
        "top_hiring_companies": ["Google India", "Microsoft India", "Amazon India", "Flipkart",
                                 "Swiggy", "Zomato", "Razorpay", "PhonePe", "CRED", "Meesho",
                                 "Ola", "Freshworks", "Zoho", "Infosys", "TCS"],
        "salary_benchmarks": {
            "fresher":    {"range": "₹3L–₹8L",    "yoy_growth": "+6.2%",  "range_low": 300_000,   "range_high": 800_000},
            "junior":     {"range": "₹8L–₹16L",   "yoy_growth": "+8.4%",  "range_low": 800_000,   "range_high": 1_600_000},
            "mid_level":  {"range": "₹16L–₹30L",  "yoy_growth": "+10.2%", "range_low": 1_600_000, "range_high": 3_000_000},
            "senior":     {"range": "₹30L–₹60L",  "yoy_growth": "+12.1%", "range_low": 3_000_000, "range_high": 6_000_000},
            "staff_plus": {"range": "₹60L–₹1.5Cr", "yoy_growth": "+14.8%", "range_low": 6_000_000, "range_high": 15_000_000},
        },
        "hot_cities": [
            {"city": "Bangalore",  "demand_index": 97, "avg_premium": "+15%"},
            {"city": "Hyderabad",  "demand_index": 88, "avg_premium": "+5%"},
            {"city": "Pune",       "demand_index": 82, "avg_premium": "0%"},
            {"city": "Mumbai",     "demand_index": 79, "avg_premium": "+10%"},
            {"city": "Delhi/NCR",  "demand_index": 76, "avg_premium": "+5%"},
        ],
        "currency": "INR",
    }

# ─── Benchmarking + Peer Comparison ───────────────────────────────────────────


@app.get("/api/benchmarking")
async def get_benchmarking(role: str = "Software Engineer", salary: float = 1_200_000):
    return await benchmark({"role": role, "current_salary": salary})


@app.post("/api/market/benchmark")
async def benchmark(payload: dict = {}):
    sal = payload.get("current_salary", 1_200_000)
    role = payload.get("role", "Software Engineer")
    loc = payload.get("location", "Bangalore")
    nm = normalize_salary(sal)
    peer_avg = {
        "L1": 450_000,  "L2": 800_000,  "L3": 1_300_000, "L4": 2_000_000,
        "L5": 3_200_000, "L6": 5_000_000, "L7": 7_500_000, "L8": 11_500_000,
        "L9": 18_000_000, "L10": 35_000_000,
    }.get(nm["level"], 1_000_000)
    return {
        "status":            "success",
        "your_salary":       sal,
        "your_salary_formatted": fmt(sal),
        "your_percentile":   nm["percentile"],
        "your_level":        nm["level"],
        "peer_avg_salary":   peer_avg,
        "peer_avg_formatted": fmt(peer_avg),
        "vs_peer_avg_pct":   round((sal - peer_avg) / peer_avg * 100, 1),
        "peer_distribution": [
            {"level": "L1–L2", "pct": 28, "label": "Fresher / Junior"},
            {"level": "L3",    "pct": 32, "label": "Mid-Level"},
            {"level": "L4",    "pct": 22, "label": "Senior"},
            {"level": "L5–L6", "pct": 12, "label": "Staff / Principal"},
            {"level": "L7+",   "pct":  6, "label": "Distinguished+"},
        ],
        "currency": "INR",
    }


@app.post("/api/benchmark/peer/invite")
async def invite_peer(req: PeerInviteRequest, db: Session = Depends(get_db)):
    """Add a peer connection for anonymous salary + skill comparison."""
    code = str(uuid.uuid4())[:8].upper()
    nm = normalize_salary(req.peer_salary)
    peer = DBPeerConnection(
        user_id=req.user_id,
        peer_alias=req.peer_alias,
        peer_role=req.peer_role,
        peer_salary=req.peer_salary,
        peer_level=nm["level"],
        peer_skills=req.peer_skills,
        peer_location=req.peer_location,
        invite_code=code,
        accepted=True,   # auto-accept when user adds manually
    )
    db.add(peer)
    db.commit()
    return {"status": "success", "invite_code": code,
            "peer_level": nm["level"], "peer_formatted": fmt(req.peer_salary)}


@app.get("/api/benchmark/peers/{user_id}")
async def get_peers(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    peers = db.query(DBPeerConnection).filter(
        DBPeerConnection.user_id == user_id,
        DBPeerConnection.accepted == True
    ).all()
    my_nm = normalize_salary(user.current_salary if user else 0)
    result = []
    for p in peers:
        pnm = normalize_salary(p.peer_salary)
        common_skills = list(set(user.skills or []) & set(p.peer_skills or []))
        result.append({
            "alias":          p.peer_alias,
            "role":           p.peer_role,
            "salary":         p.peer_salary,
            "salary_formatted": fmt(p.peer_salary),
            "level":          p.peer_level,
            "location":       p.peer_location,
            "common_skills":  common_skills,
            "vs_you_pct":     round((p.peer_salary - (user.current_salary if user else 0)) / max(user.current_salary if user else 1, 1) * 100, 1),
        })
    return {"status": "success", "peers": result, "your_level": my_nm["level"],
            "your_salary_formatted": fmt(user.current_salary if user else 0)}

# ─── Portfolio ─────────────────────────────────────────────────────────────────


@app.get("/api/portfolio/suggestions")
async def portfolio_suggestions():
    """Curated portfolio project ideas (no dummy user data)."""
    return {"status": "success", "projects": PORTFOLIO_SUGGESTIONS}


@app.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: str, db: Session = Depends(get_db)):
    projects = db.query(DBPortfolioProject).filter(
        DBPortfolioProject.user_id == user_id).all()
    return {"status": "success", "projects": [{
        "id":           p.id,
        "title":        p.title,
        "description":  p.description,
        "tech_stack":   p.tech_stack,
        "github_url":   p.github_url,
        "live_url":     p.live_url,
        "thumbnail":    p.thumbnail,
        "tags":         p.tags,
        "salary_impact": fmt(p.salary_impact_amount),
        "created_at":   p.created_at.isoformat() if p.created_at else None,
    } for p in projects]}


@app.post("/api/portfolio/project")
async def add_portfolio_project(req: PortfolioProjectRequest, db: Session = Depends(get_db)):
    proj = DBPortfolioProject(
        user_id=req.user_id,
        title=req.title,
        description=req.description,
        tech_stack=req.tech_stack,
        github_url=req.github_url,
        live_url=req.live_url,
        thumbnail=req.thumbnail,
        tags=req.tags,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {"status": "success", "project_id": proj.id}


@app.delete("/api/portfolio/project/{project_id}")
async def delete_portfolio_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(DBPortfolioProject).filter(
        DBPortfolioProject.id == project_id).first()
    if proj:
        db.delete(proj)
        db.commit()
    return {"status": "success", "message": "Project deleted"}


@app.post("/api/portfolio/ai-generate")
async def ai_generate_portfolio(payload: dict):
    """Generate AI portfolio project ideas based on user skills."""
    skills = payload.get("skills", [])
    role = payload.get("role", "Software Engineer")
    level = payload.get("level", "L3")
    ai_ideas = await call_gemini(
        f"Generate 3 unique portfolio project ideas for a {level} {role} in India.\n"
        f"Skills: {', '.join(skills[:12])}\n\n"
        "For each project: title, description (2 sentences), tech stack (5 items), "
        "estimated salary impact in INR, GitHub value (High/Very High/Extremely High). "
        "Format as JSON array."
    )
    return {"status": "success", "ai_ideas": ai_ideas, "role": role}

# ─── Interview ────────────────────────────────────────────────────────────────


@app.post("/api/interview/score")
async def interview_score(req: InterviewRequest):
    base = score_answer(req.question, req.answer)
    ai_fb = await call_gemini(
        f"Interview question: {req.question}\n"
        f"Candidate answer: {req.answer}\n"
        f"Role: {req.role} (India)\n\n"
        "Give 2 specific improvements and 1 strength in 3 bullet points. Keep it under 100 words."
    )
    return {"status": "success", **base, "ai_feedback": ai_fb}


@app.get("/api/interview/questions")
async def interview_questions(category: str = "technical"):
    return {"status": "success", "questions": IQ.get(category, IQ["technical"]), "category": category}

# ─── AI Chat / Explainability ─────────────────────────────────────────────────


# consolidated AI Chat moved up


@app.post("/api/ai/explain")
async def ai_explain(payload: dict):
    """Explain any CareerIQ metric / score in plain English."""
    metric = payload.get("metric", "ats_score")
    value = payload.get("value", 70)
    context = payload.get("context", "")
    resp = await call_gemini(
        f"Explain in simple terms what a {metric} of {value} means for an Indian tech professional. "
        f"Context: {context}\n"
        "Give 1 clear sentence explanation and 2 action items to improve it."
    )
    if resp == "[QUOTA_EXHAUSTED]":
        return {"status": "exhausted", "explanation": "AI quota reached. Please try again later."}
    return {"status": "success", "explanation": resp, "metric": metric, "value": value}

# ─── Side Hustles ─────────────────────────────────────────────────────────────


@app.get("/api/side-hustles")
async def side_hustles():
    return {"status": "success", "side_hustles": [
        {"title": "Freelance ML/AI Consulting",       "platform": "Toptal / Upwork",          "estimated_monthly": "₹40,000 – ₹1,20,000", "estimated_monthly_low": 40_000,   "estimated_monthly_high": 120_000,
            "skills_needed": ["Python", "ML/AI"],           "difficulty": "Medium", "time_to_first_income": "2–4 weeks",  "description": "Consult for startups building AI products. Charge ₹2,000–5,000/hr."},
        {"title": "Technical Content / Blogging",     "platform": "Medium / Substack / YouTube", "estimated_monthly": "₹10,000 – ₹80,000",  "estimated_monthly_low": 10_000,   "estimated_monthly_high": 80_000,
            "skills_needed": ["Any Tech Skill"],           "difficulty": "Low",    "time_to_first_income": "1–3 months", "description": "Write tutorials, record coding videos. Monetize via ads and sponsorships."},
        {"title": "Course Creation (Hindi/English)",  "platform": "Unacademy / Udemy India",   "estimated_monthly": "₹20,000 – ₹1,50,000", "estimated_monthly_low": 20_000,   "estimated_monthly_high": 150_000,
         "skills_needed": ["Any Expertise"],            "difficulty": "Medium", "time_to_first_income": "1–2 months", "description": "Create courses in vernacular languages. High demand, less competition."},
        {"title": "Open Source + GitHub Sponsorships", "platform": "GitHub Sponsors",           "estimated_monthly": "₹15,000 – ₹60,000",  "estimated_monthly_low": 15_000,   "estimated_monthly_high": 60_000,
            "skills_needed": ["Programming", "Git"],        "difficulty": "Medium", "time_to_first_income": "2–6 months", "description": "Build open source tools, get sponsorships and bounty rewards."},
        {"title": "AI SaaS Product",                  "platform": "ProductHunt / AppSumo",     "estimated_monthly": "₹10,000 – ₹2,50,000", "estimated_monthly_low": 10_000,   "estimated_monthly_high": 250_000,
            "skills_needed": ["Python", "AI/ML", "React"],   "difficulty": "High",   "time_to_first_income": "3–6 months", "description": "Build a micro-SaaS using LLMs. ₹299–999/user/month subscription."},
        {"title": "Hackathons & Competitive Programming", "platform": "HackerEarth / Codeforces", "estimated_monthly": "₹5,000 – ₹50,000",  "estimated_monthly_low": 5_000,    "estimated_monthly_high": 50_000,
            "skills_needed": ["Algorithms", "Data Structures"], "difficulty": "High", "time_to_first_income": "Immediate",  "description": "Win cash prizes from corporate hackathons and online contests."},
    ]}

# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
