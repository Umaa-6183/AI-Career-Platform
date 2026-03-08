"""
AI-Driven Career Growth Platform - FastAPI Backend
Handles resume analysis, salary normalization, job matching, and skill gap analysis
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import json
import re
import math
import random
from datetime import datetime, timedelta

app = FastAPI(
    title="CareerIQ Pro API",
    description="AI-Driven Career Growth and Job Assistance Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Models ───────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    name: str
    email: str
    current_role: str
    experience_years: int
    current_salary: float
    target_role: Optional[str] = None
    skills: List[str] = []
    location: str = "Remote"

class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = None

class SalaryQueryRequest(BaseModel):
    role: str
    experience_years: int
    skills: List[str]
    location: str = "US"

class JobMatchRequest(BaseModel):
    user_skills: List[str]
    experience_years: int
    current_salary_score: float
    target_roles: List[str] = []

class SkillGapRequest(BaseModel):
    current_skills: List[str]
    target_role: str

# ─── Salary Normalization Engine ───────────────────────────────────────────────

SALARY_LEVELS = {
    "L1": {"range": (30000, 50000), "label": "Entry Level"},
    "L2": {"range": (50000, 70000), "label": "Junior"},
    "L3": {"range": (70000, 90000), "label": "Mid-Level"},
    "L4": {"range": (90000, 120000), "label": "Senior"},
    "L5": {"range": (120000, 160000), "label": "Staff / Lead"},
    "L6": {"range": (160000, 200000), "label": "Principal"},
    "L7": {"range": (200000, 260000), "label": "Distinguished"},
    "L8": {"range": (260000, 340000), "label": "Fellow"},
    "L9": {"range": (340000, 450000), "label": "Senior Fellow"},
    "L10": {"range": (450000, 1000000), "label": "Executive / VP"},
}

def normalize_salary(salary: float) -> Dict:
    for level, data in SALARY_LEVELS.items():
        low, high = data["range"]
        if low <= salary < high:
            score = (salary - low) / (high - low)
            normalized_score = (list(SALARY_LEVELS.keys()).index(level) + score) / 10.0
            return {
                "level": level,
                "label": data["label"],
                "normalized_score": round(normalized_score, 3),
                "salary_range": data["range"],
                "percentile": round(normalized_score * 100, 1)
            }
    return {"level": "L10", "label": "Executive", "normalized_score": 1.0, "salary_range": (450000, 1000000), "percentile": 99.9}

def estimate_salary_from_profile(role: str, years: int, skills: List[str], location: str) -> Dict:
    base_salaries = {
        "software engineer": 110000,
        "data scientist": 115000,
        "product manager": 120000,
        "devops engineer": 108000,
        "machine learning engineer": 130000,
        "frontend developer": 100000,
        "backend developer": 105000,
        "full stack developer": 108000,
        "data engineer": 112000,
        "cloud architect": 140000,
        "cybersecurity analyst": 95000,
        "ai engineer": 135000,
    }
    role_lower = role.lower()
    base = 80000
    for key, val in base_salaries.items():
        if key in role_lower:
            base = val
            break

    experience_multiplier = 1.0 + (min(years, 20) * 0.045)
    high_value_skills = {"kubernetes", "aws", "gcp", "azure", "tensorflow", "pytorch",
                         "react", "golang", "rust", "scala", "spark", "kafka"}
    skill_bonus = sum(8000 for s in skills if s.lower() in high_value_skills)
    location_multipliers = {"US": 1.0, "UK": 0.82, "Canada": 0.78, "India": 0.22, "Remote": 0.95}
    loc_mult = location_multipliers.get(location, 0.85)
    estimated = (base * experience_multiplier + skill_bonus) * loc_mult
    return {
        "estimated_salary": round(estimated, 2),
        "low_range": round(estimated * 0.85, 2),
        "high_range": round(estimated * 1.18, 2),
        "normalization": normalize_salary(estimated),
        "market_alignment_index": round(random.uniform(0.72, 0.96), 2)
    }

# ─── Skill Gap Engine ──────────────────────────────────────────────────────────

ROLE_SKILL_REQUIREMENTS = {
    "machine learning engineer": {
        "core": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas"],
        "advanced": ["MLOps", "Kubernetes", "Docker", "Apache Spark", "Feature Engineering"],
        "soft": ["Research skills", "Data storytelling", "Cross-team collaboration"]
    },
    "data scientist": {
        "core": ["Python", "R", "SQL", "Statistics", "Pandas", "Scikit-learn"],
        "advanced": ["Deep Learning", "A/B Testing", "Tableau", "Apache Spark", "BigQuery"],
        "soft": ["Business acumen", "Communication", "Stakeholder management"]
    },
    "software engineer": {
        "core": ["Python", "JavaScript", "Data Structures", "Algorithms", "Git"],
        "advanced": ["System Design", "Microservices", "AWS", "Docker", "CI/CD"],
        "soft": ["Problem solving", "Code review", "Technical writing"]
    },
    "devops engineer": {
        "core": ["Linux", "Docker", "Kubernetes", "CI/CD", "Terraform"],
        "advanced": ["AWS", "GCP", "Azure", "Prometheus", "Grafana", "Ansible"],
        "soft": ["Incident management", "Documentation", "SRE mindset"]
    },
    "product manager": {
        "core": ["Product roadmapping", "User research", "A/B Testing", "SQL", "Analytics"],
        "advanced": ["OKRs", "Agile/Scrum", "Figma", "Competitive analysis", "Pricing strategy"],
        "soft": ["Leadership", "Communication", "Prioritization", "Empathy"]
    }
}

def analyze_skill_gap(current_skills: List[str], target_role: str) -> Dict:
    role_key = None
    for key in ROLE_SKILL_REQUIREMENTS:
        if key in target_role.lower():
            role_key = key
            break
    if not role_key:
        role_key = "software engineer"

    requirements = ROLE_SKILL_REQUIREMENTS[role_key]
    all_required = requirements["core"] + requirements["advanced"]
    current_lower = [s.lower() for s in current_skills]

    have = []
    missing = []
    priority = []

    for skill in all_required:
        if skill.lower() in current_lower:
            have.append(skill)
        else:
            missing.append(skill)
            if skill in requirements["core"][:3]:
                priority.append(skill)

    match_score = len(have) / max(len(all_required), 1)
    return {
        "target_role": target_role,
        "role_matched": role_key,
        "skills_have": have,
        "skills_missing": missing,
        "skills_priority": priority,
        "soft_skills_needed": requirements["soft"],
        "match_score": round(match_score * 100, 1),
        "completeness_level": "Strong" if match_score > 0.7 else "Moderate" if match_score > 0.4 else "Needs Work"
    }

# ─── Job Matching Engine ───────────────────────────────────────────────────────

MOCK_JOBS = [
    {"id": "j1", "title": "Senior ML Engineer", "company": "DeepMind", "salary_range": (180000, 240000), "required_skills": ["Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes"], "location": "London / Remote", "industry": "AI Research"},
    {"id": "j2", "title": "Staff Data Scientist", "company": "Stripe", "salary_range": (200000, 280000), "required_skills": ["Python", "Statistics", "SQL", "A/B Testing", "ML"], "location": "San Francisco", "industry": "Fintech"},
    {"id": "j3", "title": "Principal Software Engineer", "company": "Anthropic", "salary_range": (220000, 300000), "required_skills": ["Python", "System Design", "AWS", "Microservices", "Distributed Systems"], "location": "Remote", "industry": "AI Safety"},
    {"id": "j4", "title": "ML Platform Engineer", "company": "Uber", "salary_range": (160000, 210000), "required_skills": ["Python", "Kubernetes", "Apache Spark", "MLOps", "Scala"], "location": "NYC", "industry": "Mobility"},
    {"id": "j5", "title": "AI Research Engineer", "company": "Google DeepMind", "salary_range": (250000, 380000), "required_skills": ["Python", "PyTorch", "Research", "Mathematics", "JAX"], "location": "Mountain View", "industry": "AI Research"},
    {"id": "j6", "title": "Data Engineering Lead", "company": "Databricks", "salary_range": (170000, 230000), "required_skills": ["Python", "Apache Spark", "Kafka", "SQL", "dbt"], "location": "Remote", "industry": "Data"},
    {"id": "j7", "title": "Cloud Solutions Architect", "company": "AWS", "salary_range": (190000, 260000), "required_skills": ["AWS", "Terraform", "Kubernetes", "System Design", "Python"], "location": "Seattle", "industry": "Cloud"},
    {"id": "j8", "title": "Senior Product Manager - AI", "company": "OpenAI", "salary_range": (210000, 290000), "required_skills": ["Product roadmapping", "SQL", "AI/ML knowledge", "User research", "OKRs"], "location": "San Francisco", "industry": "AI"},
]

def compute_similarity_score(user_skills: List[str], job: Dict, current_score: float) -> Dict:
    job_skills = job["required_skills"]
    user_lower = [s.lower() for s in user_skills]
    matched = [s for s in job_skills if s.lower() in user_lower]
    skill_overlap = len(matched) / max(len(job_skills), 1)

    job_salary_norm = normalize_salary(sum(job["salary_range"]) / 2)
    advancement_score = 1.0 if job_salary_norm["normalized_score"] > current_score else 0.0

    composite_score = (skill_overlap * 0.5) + (advancement_score * 0.3) + (random.uniform(0.1, 0.2))
    return {
        "score": round(min(composite_score, 0.99) * 100, 1),
        "skill_overlap": round(skill_overlap * 100, 1),
        "matched_skills": matched,
        "missing_skills": [s for s in job_skills if s.lower() not in user_lower],
        "advancement_guaranteed": advancement_score > 0,
        "salary_normalization": job_salary_norm,
    }

def match_jobs(user_skills: List[str], current_salary_score: float, target_roles: List[str]) -> List[Dict]:
    results = []
    for job in MOCK_JOBS:
        match = compute_similarity_score(user_skills, job, current_salary_score)
        if match["advancement_guaranteed"]:
            results.append({**job, "match": match})
    results.sort(key=lambda x: x["match"]["score"], reverse=True)
    return results[:6]

# ─── Learning Resources ────────────────────────────────────────────────────────

LEARNING_RESOURCES = {
    "Python": [
        {"title": "Python for Everybody", "platform": "Coursera", "type": "course", "rating": 4.8, "duration": "7 weeks", "url": "#", "salary_uplift": "+$8K"},
        {"title": "Fluent Python", "platform": "O'Reilly", "type": "book", "rating": 4.9, "duration": "Self-paced", "url": "#", "salary_uplift": "+$6K"},
    ],
    "TensorFlow": [
        {"title": "TensorFlow Developer Certificate", "platform": "Google", "type": "certification", "rating": 4.7, "duration": "4 months", "url": "#", "salary_uplift": "+$18K"},
        {"title": "Deep Learning Specialization", "platform": "DeepLearning.AI", "type": "course", "rating": 4.9, "duration": "3 months", "url": "#", "salary_uplift": "+$22K"},
    ],
    "Kubernetes": [
        {"title": "CKA: Certified Kubernetes Administrator", "platform": "CNCF", "type": "certification", "rating": 4.8, "duration": "3 months", "url": "#", "salary_uplift": "+$20K"},
    ],
    "AWS": [
        {"title": "AWS Solutions Architect", "platform": "AWS", "type": "certification", "rating": 4.7, "duration": "3 months", "url": "#", "salary_uplift": "+$25K"},
    ],
    "PyTorch": [
        {"title": "PyTorch for Deep Learning", "platform": "fast.ai", "type": "course", "rating": 4.9, "duration": "8 weeks", "url": "#", "salary_uplift": "+$20K"},
    ],
    "MLOps": [
        {"title": "MLOps Specialization", "platform": "Coursera", "type": "course", "rating": 4.6, "duration": "4 months", "url": "#", "salary_uplift": "+$28K"},
    ],
    "SQL": [
        {"title": "Advanced SQL for Data Scientists", "platform": "Udemy", "type": "course", "rating": 4.7, "duration": "4 weeks", "url": "#", "salary_uplift": "+$10K"},
    ],
    "System Design": [
        {"title": "Designing Data-Intensive Applications", "platform": "O'Reilly", "type": "book", "rating": 4.9, "duration": "Self-paced", "url": "#", "salary_uplift": "+$30K"},
    ]
}

def get_learning_resources(skills: List[str]) -> List[Dict]:
    resources = []
    for skill in skills[:6]:
        skill_resources = LEARNING_RESOURCES.get(skill, [])
        for r in skill_resources:
            resources.append({"skill": skill, **r})
    if not resources:
        for key in list(LEARNING_RESOURCES.keys())[:4]:
            for r in LEARNING_RESOURCES[key][:1]:
                resources.append({"skill": key, **r})
    return resources

# ─── Side Hustle Recommendations ──────────────────────────────────────────────

SIDE_HUSTLES = [
    {"title": "Freelance ML Consulting", "platform": "Toptal / Upwork", "estimated_monthly": "$3,000-$8,000", "skills_needed": ["Python", "ML"], "difficulty": "Medium", "time_to_first_income": "2-4 weeks"},
    {"title": "Technical Content Creation", "platform": "YouTube / Substack", "estimated_monthly": "$500-$5,000", "skills_needed": ["Any Tech Skill"], "difficulty": "Low", "time_to_first_income": "1-3 months"},
    {"title": "Open Source Contributions", "platform": "GitHub", "estimated_monthly": "$1,000-$4,000", "skills_needed": ["Programming"], "difficulty": "Medium", "time_to_first_income": "2-6 months"},
    {"title": "Course Creation", "platform": "Udemy / Teachable", "estimated_monthly": "$1,000-$10,000", "skills_needed": ["Any Expertise"], "difficulty": "Medium", "time_to_first_income": "1-2 months"},
    {"title": "AI App Development", "platform": "ProductHunt / AppStore", "estimated_monthly": "$500-$15,000", "skills_needed": ["Python", "AI/ML", "React"], "difficulty": "High", "time_to_first_income": "3-6 months"},
    {"title": "Data Labeling & Annotation", "platform": "Scale AI / Appen", "estimated_monthly": "$800-$2,500", "skills_needed": ["Domain Knowledge"], "difficulty": "Low", "time_to_first_income": "1-2 weeks"},
]

# ─── Resume Parsing (Mock NLP) ─────────────────────────────────────────────────

def parse_resume_text(text: str) -> Dict:
    skills_pattern = r'\b(Python|JavaScript|React|Node\.js|SQL|AWS|Docker|Kubernetes|TensorFlow|PyTorch|Java|C\+\+|Scala|Go|Rust|TypeScript|ML|AI|NLP|CV|Git|Linux|Terraform|Spark|Kafka|Redis|MongoDB|PostgreSQL|Pandas|NumPy|Scikit-learn|FastAPI|Flask|Django|MLOps|CI/CD|Agile|Scrum)\b'
    skills_found = list(set(re.findall(skills_pattern, text, re.IGNORECASE)))
    experience_matches = re.findall(r'(\d+)\s*(?:\+\s*)?years?', text, re.IGNORECASE)
    years = max([int(x) for x in experience_matches], default=0) if experience_matches else 0
    anonymized_text = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[REDACTED]', text)
    anonymized_text = re.sub(r'\b[\w.+-]+@[\w-]+\.[\w.]+\b', '[EMAIL REDACTED]', anonymized_text)
    anonymized_text = re.sub(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', '[PHONE REDACTED]', anonymized_text)
    return {
        "extracted_skills": skills_found,
        "estimated_experience_years": years,
        "anonymized": True,
        "anonymization_summary": "PII removed: names, email, phone",
        "word_count": len(text.split()),
        "skill_density": round(len(skills_found) / max(len(text.split()) / 100, 1), 2),
    }

# ─── Portfolio Recommendations ─────────────────────────────────────────────────

def get_portfolio_projects(skills: List[str], target_role: str) -> List[Dict]:
    projects = [
        {"title": "Real-Time Stock Price Predictor", "tech": ["Python", "LSTM", "FastAPI", "React"], "description": "End-to-end ML app predicting stock trends with explainable AI dashboard", "github_value": "High", "estimated_time": "3-4 weeks", "salary_impact": "+$12K visibility"},
        {"title": "NLP Resume Screener", "tech": ["Python", "BERT", "spaCy", "Streamlit"], "description": "ATS bypass tool using transformer models for semantic matching", "github_value": "Very High", "estimated_time": "2-3 weeks", "salary_impact": "+$15K visibility"},
        {"title": "Kubernetes Auto-Scaler", "tech": ["Kubernetes", "Python", "Prometheus", "Grafana"], "description": "Custom HPA controller with ML-based workload prediction", "github_value": "High", "estimated_time": "4-5 weeks", "salary_impact": "+$18K visibility"},
        {"title": "Distributed Data Pipeline", "tech": ["Apache Spark", "Kafka", "dbt", "Airflow"], "description": "Real-time ETL pipeline processing 1M+ events/sec with monitoring", "github_value": "Very High", "estimated_time": "5-6 weeks", "salary_impact": "+$20K visibility"},
        {"title": "LLM Fine-Tuning Framework", "tech": ["PyTorch", "HuggingFace", "PEFT", "Weights & Biases"], "description": "Parameter-efficient fine-tuning pipeline with evaluation benchmarks", "github_value": "Extremely High", "estimated_time": "6-8 weeks", "salary_impact": "+$35K visibility"},
    ]
    return projects[:4]

# ─── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "CareerIQ Pro API v1.0", "status": "operational", "modules": 12}

@app.post("/api/resume/analyze")
async def analyze_resume(request: ResumeAnalysisRequest):
    parsed = parse_resume_text(request.resume_text)
    salary_data = estimate_salary_from_profile(
        role=request.target_role or "Software Engineer",
        years=parsed["estimated_experience_years"],
        skills=parsed["extracted_skills"],
        location="US"
    )
    skill_gap = None
    if request.target_role:
        skill_gap = analyze_skill_gap(parsed["extracted_skills"], request.target_role)
    return {
        "status": "success",
        "parsing": parsed,
        "salary_estimation": salary_data,
        "skill_gap": skill_gap,
        "ats_score": random.randint(62, 91),
        "resume_quality_score": random.randint(65, 88),
        "recommendations": [
            "Add quantified achievements (e.g., 'reduced latency by 40%')",
            "Include relevant certifications section",
            "Expand on leadership and cross-team collaboration",
            "Add GitHub / portfolio links prominently",
            "Use action verbs at the start of each bullet"
        ]
    }

@app.post("/api/salary/normalize")
async def normalize_salary_endpoint(request: SalaryQueryRequest):
    data = estimate_salary_from_profile(request.role, request.experience_years, request.skills, request.location)
    return {"status": "success", "data": data}

@app.post("/api/jobs/match")
async def match_jobs_endpoint(request: JobMatchRequest):
    jobs = match_jobs(request.user_skills, request.current_salary_score, request.target_roles)
    return {"status": "success", "jobs": jobs, "total_found": len(jobs), "advancement_filter_applied": True}

@app.post("/api/skills/gap")
async def skill_gap_endpoint(request: SkillGapRequest):
    gap = analyze_skill_gap(request.current_skills, request.target_role)
    resources = get_learning_resources(gap["skills_priority"] + gap["skills_missing"][:3])
    return {"status": "success", "gap_analysis": gap, "learning_resources": resources}

@app.get("/api/resources/{skill}")
async def get_resources_for_skill(skill: str):
    resources = get_learning_resources([skill])
    return {"status": "success", "resources": resources}

@app.post("/api/portfolio/recommend")
async def portfolio_recommendations(skills: List[str], target_role: str = "Software Engineer"):
    projects = get_portfolio_projects(skills, target_role)
    return {"status": "success", "projects": projects}

@app.get("/api/side-hustles")
async def get_side_hustles():
    return {"status": "success", "side_hustles": SIDE_HUSTLES}

@app.get("/api/market/insights")
async def market_insights():
    return {
        "status": "success",
        "trending_skills": [
            {"skill": "LLM Fine-Tuning", "demand_growth": "+89%", "avg_salary_premium": "$35K"},
            {"skill": "Kubernetes", "demand_growth": "+67%", "avg_salary_premium": "$28K"},
            {"skill": "MLOps", "demand_growth": "+78%", "avg_salary_premium": "$32K"},
            {"skill": "Rust", "demand_growth": "+45%", "avg_salary_premium": "$22K"},
            {"skill": "Apache Kafka", "demand_growth": "+56%", "avg_salary_premium": "$18K"},
            {"skill": "Terraform", "demand_growth": "+43%", "avg_salary_premium": "$20K"},
        ],
        "top_hiring_companies": ["Google", "Meta", "Apple", "Anthropic", "OpenAI", "Stripe", "Databricks", "Snowflake"],
        "salary_benchmarks": {
            "entry_level": {"range": "$55K-$80K", "yoy_growth": "+4.2%"},
            "mid_level": {"range": "$90K-$130K", "yoy_growth": "+6.8%"},
            "senior": {"range": "$130K-$200K", "yoy_growth": "+8.1%"},
            "staff_plus": {"range": "$200K-$400K", "yoy_growth": "+11.3%"},
        },
        "hot_regions": ["San Francisco", "New York", "Remote-First", "London", "Singapore"],
    }

@app.get("/api/salary-levels")
async def get_salary_levels():
    return {"status": "success", "levels": SALARY_LEVELS}

@app.get("/api/career/growth-forecast")
async def growth_forecast(current_level: str = "L3", target_level: str = "L5", years: int = 3):
    level_keys = list(SALARY_LEVELS.keys())
    current_idx = level_keys.index(current_level) if current_level in level_keys else 2
    target_idx = level_keys.index(target_level) if target_level in level_keys else 4
    trajectory = []
    for i in range(years + 1):
        progress = i / years
        idx = current_idx + int(progress * (target_idx - current_idx))
        level = level_keys[min(idx, len(level_keys) - 1)]
        mid_salary = sum(SALARY_LEVELS[level]["range"]) / 2
        trajectory.append({
            "year": datetime.now().year + i,
            "level": level,
            "label": SALARY_LEVELS[level]["label"],
            "projected_salary": round(mid_salary * (1 + i * 0.08), 0)
        })
    return {"status": "success", "trajectory": trajectory, "total_salary_growth": f"+{round((trajectory[-1]['projected_salary'] / trajectory[0]['projected_salary'] - 1) * 100, 1)}%"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
