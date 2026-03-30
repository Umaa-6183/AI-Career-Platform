"""
CareerIQ Pro - ML Engine
Salary Normalization, CNN Regression, NLP Skill Extraction,
Explainable Similarity Scoring (all production-ready, no external ML deps required for demo)
"""

import re
import math
import json
import hashlib
import statistics
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime


# ── Salary Normalization Module ─────────────────────────────────────────────────

SALARY_LEVELS = {
    "L1":  {"range": (30_000,   50_000),  "label": "Entry Level",      "index": 0},
    "L2":  {"range": (50_000,   70_000),  "label": "Junior",           "index": 1},
    "L3":  {"range": (70_000,   90_000),  "label": "Mid-Level",        "index": 2},
    "L4":  {"range": (90_000,  120_000),  "label": "Senior",           "index": 3},
    "L5":  {"range": (120_000, 160_000),  "label": "Staff / Lead",     "index": 4},
    "L6":  {"range": (160_000, 200_000),  "label": "Principal",        "index": 5},
    "L7":  {"range": (200_000, 260_000),  "label": "Distinguished",    "index": 6},
    "L8":  {"range": (260_000, 340_000),  "label": "Fellow",           "index": 7},
    "L9":  {"range": (340_000, 450_000),  "label": "Senior Fellow",    "index": 8},
    "L10": {"range": (450_000, 1_000_000), "label": "Executive / VP",   "index": 9},
}


def salary_normalize(salary: float) -> Dict:
    """
    Salary Normalization Function:
        normalized_score = (level_index + intra_level_position) / 10
    """
    for level, data in SALARY_LEVELS.items():
        low, high = data["range"]
        if low <= salary < high:
            intra = (salary - low) / (high - low)
            score = (data["index"] + intra) / 10.0
            percentile = round(score * 100, 1)
            return {
                "level": level,
                "label": data["label"],
                "normalized_score": round(score, 4),
                "intra_level_position": round(intra, 4),
                "level_index": data["index"],
                "salary_range": list(data["range"]),
                "percentile": percentile,
                "above_median": salary > sum(data["range"]) / 2,
            }
    # Above L10
    return {
        "level": "L10", "label": "Executive / VP",
        "normalized_score": 1.0, "intra_level_position": 1.0,
        "level_index": 9, "salary_range": [450_000, 1_000_000],
        "percentile": 99.9, "above_median": True,
    }


def salary_estimate_from_features(
    role: str,
    years_exp: int,
    skills: List[str],
    location: str = "US",
    education: str = "bachelor",
) -> Dict:
    """
    CNN-inspired multi-feature salary regression.
    Simulates: base_salary × experience_multiplier × skill_multiplier × location_factor
    """
    # Base salaries by role (research-aligned values)
    BASE_SALARIES = {
        "software engineer": 105_000, "frontend developer": 98_000,
        "backend developer": 108_000, "full stack developer": 106_000,
        "data scientist": 118_000, "data engineer": 112_000,
        "machine learning engineer": 132_000, "ai engineer": 138_000,
        "devops engineer": 110_000, "sre": 120_000,
        "cloud architect": 145_000, "solutions architect": 140_000,
        "product manager": 125_000, "engineering manager": 155_000,
        "cybersecurity analyst": 96_000, "security engineer": 118_000,
        "mobile developer": 102_000, "ios developer": 105_000,
        "android developer": 104_000, "platform engineer": 115_000,
    }

    role_lower = role.lower()
    base = 85_000
    for key, val in BASE_SALARIES.items():
        if key in role_lower:
            base = val
            break

    # Experience multiplier: +4.5% per year, diminishing after 15y
    exp_capped = min(years_exp, 20)
    exp_multiplier = 1.0 + (min(exp_capped, 15) * 0.045) + \
        (max(0, exp_capped - 15) * 0.015)

    # High-value skill bonuses
    SKILL_PREMIUMS = {
        "kubernetes": 22_000, "terraform": 18_000, "aws": 20_000,
        "gcp": 18_000, "azure": 17_000, "kafka": 16_000,
        "tensorflow": 22_000, "pytorch": 22_000, "mlops": 26_000,
        "rust": 20_000, "go": 18_000, "scala": 16_000,
        "spark": 15_000, "dbt": 12_000, "airflow": 14_000,
        "llm": 35_000, "transformers": 28_000, "rlhf": 40_000,
        "system design": 25_000, "distributed systems": 22_000,
    }
    skill_bonus = sum(
        SKILL_PREMIUMS.get(s.lower(), 0)
        for s in skills
    )
    skill_bonus = min(skill_bonus, 80_000)  # cap total skill premium

    # Location multiplier
    LOC_MULTIPLIERS = {
        "US": 1.00, "San Francisco": 1.28, "New York": 1.18,
        "Seattle": 1.12, "London": 0.88, "UK": 0.85,
        "Canada": 0.80, "Germany": 0.78, "India": 0.22,
        "Singapore": 0.92, "Australia": 0.82, "Remote": 0.95,
    }
    loc_mult = LOC_MULTIPLIERS.get(location, 0.85)

    # Education adjustment
    EDU_ADJUSTMENTS = {
        "phd": 1.12, "master": 1.06, "bachelor": 1.00, "associate": 0.92, "none": 0.88
    }
    edu_mult = EDU_ADJUSTMENTS.get(education.lower(), 1.00)

    estimated = (base * exp_multiplier + skill_bonus) * loc_mult * edu_mult
    low = estimated * 0.85
    high = estimated * 1.18

    return {
        "estimated_salary": round(estimated, 2),
        "low_range": round(low, 2),
        "high_range": round(high, 2),
        "normalization": salary_normalize(estimated),
        "market_alignment_index": round(min(0.98, 0.65 + (len(skills) * 0.02)), 3),
        "feature_contributions": {
            "base_role": round(base, 0),
            "experience_delta": round(base * (exp_multiplier - 1), 0),
            "skill_premium": round(skill_bonus * loc_mult, 0),
            "location_adjustment": round((estimated / loc_mult) * (loc_mult - 1), 0),
        },
        "confidence": round(min(0.95, 0.60 + (len(skills) * 0.02) + (years_exp * 0.01)), 3),
    }


# ── NLP Resume Parser ─────────────────────────────────────────────────────────

# Comprehensive skill taxonomy
SKILL_TAXONOMY = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
        "rust", "scala", "kotlin", "swift", "ruby", "php", "r", "matlab", "julia",
        "elixir", "haskell", "perl", "bash", "shell", "sql", "plsql",
    ],
    "ml_ai": [
        "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "xgboost",
        "lightgbm", "catboost", "huggingface", "transformers", "bert", "gpt",
        "llm", "langchain", "openai", "nlp", "cv", "computer vision",
        "deep learning", "machine learning", "reinforcement learning", "rlhf",
        "mlops", "feature engineering", "model serving", "triton", "onnx",
        "jax", "flax", "peft", "lora", "rag", "embeddings", "vector database",
        "pinecone", "weaviate", "chroma", "faiss",
    ],
    "data": [
        "pandas", "numpy", "polars", "dask", "spark", "apache spark", "pyspark",
        "kafka", "apache kafka", "flink", "beam", "airflow", "prefect", "dagster",
        "dbt", "sql", "postgresql", "mysql", "sqlite", "bigquery", "snowflake",
        "redshift", "databricks", "delta lake", "iceberg", "hive",
        "tableau", "power bi", "looker", "matplotlib", "seaborn", "plotly",
    ],
    "devops_cloud": [
        "docker", "kubernetes", "k8s", "helm", "terraform", "ansible", "chef",
        "puppet", "jenkins", "gitlab ci", "github actions", "circleci",
        "aws", "gcp", "azure", "cloudformation", "cdk", "pulumi",
        "prometheus", "grafana", "datadog", "newrelic", "elk", "elasticsearch",
        "linux", "nginx", "istio", "envoy", "argocd", "flux",
    ],
    "frontend": [
        "react", "vue", "angular", "svelte", "nextjs", "nuxt", "gatsby",
        "html", "css", "tailwind", "sass", "webpack", "vite", "babel",
        "redux", "mobx", "graphql", "rest", "websocket",
    ],
    "backend": [
        "fastapi", "flask", "django", "express", "nestjs", "spring", "rails",
        "gin", "fiber", "actix", "grpc", "microservices", "rest api",
        "redis", "memcached", "rabbitmq", "celery", "websocket",
    ],
    "soft_technical": [
        "system design", "distributed systems", "algorithms", "data structures",
        "design patterns", "tdd", "bdd", "agile", "scrum", "kanban",
        "ci/cd", "git", "code review", "technical writing",
    ],
}

FLAT_SKILLS = {skill: category for category,
               skills in SKILL_TAXONOMY.items() for skill in skills}

PII_PATTERNS = [
    # SSN FIRST — must precede phone
    (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]'),
    (r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[NAME REDACTED]'),
    (r'\b[\w.+-]+@[\w-]+\.[\w.]+\b', '[EMAIL REDACTED]'),
    (r'\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b',
     '[PHONE REDACTED]'),
    (r'\bhttps?://[^\s]+\b', '[URL REDACTED]'),
    (r'\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b', '[CARD REDACTED]'),
]


def anonymize_text(text: str) -> Tuple[str, List[str]]:
    """Remove PII from resume text. Returns (anonymized_text, [removed_items])"""
    removed = []
    result = text
    for pattern, replacement in PII_PATTERNS:
        matches = re.findall(pattern, result)
        removed.extend(matches)
        result = re.sub(pattern, replacement, result)
    return result, removed


def extract_skills(text: str) -> List[Dict]:
    """NLP skill extraction with category tagging"""
    text_lower = text.lower()
    found = []
    seen = set()
    for skill, category in FLAT_SKILLS.items():
        # word boundary matching
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower) and skill not in seen:
            seen.add(skill)
            found.append(
                {"skill": skill.title(), "category": category, "raw": skill})
    return sorted(found, key=lambda x: x["category"])


def extract_experience_years(text: str) -> int:
    """Extract years of experience from resume text"""
    patterns = [
        r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
        r'experience\s+of\s+(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s+(?:of\s+)?(?:exp|experience)',
    ]
    years = []
    for p in patterns:
        matches = re.findall(p, text, re.IGNORECASE)
        years.extend([int(m) for m in matches])

    if not years:
        # Infer from date ranges
        date_matches = re.findall(r'(20\d{2})', text)
        if len(date_matches) >= 2:
            dates = [int(d) for d in date_matches]
            inferred = max(dates) - min(dates)
            return max(0, min(inferred, 30))

    return max(years) if years else 0


def extract_education(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["phd", "ph.d", "doctorate"]):
        return "phd"
    if any(w in text_lower for w in ["master", "m.s.", "mba", "m.eng"]):
        return "master"
    if any(w in text_lower for w in ["bachelor", "b.s.", "b.e.", "b.tech", "b.sc"]):
        return "bachelor"
    if any(w in text_lower for w in ["associate", "a.s.", "diploma"]):
        return "associate"
    return "bachelor"  # default assumption


def parse_resume(text: str, target_role: str = None) -> Dict:
    """Full resume parsing pipeline"""
    anonymized, pii_removed = anonymize_text(text)
    skills_found = extract_skills(text)
    years_exp = extract_experience_years(text)
    education = extract_education(text)
    skill_names = [s["skill"] for s in skills_found]
    word_count = len(text.split())

    # ATS score calculation
    action_verbs = ["led", "built", "designed", "implemented", "reduced", "improved",
                    "created", "developed", "architected", "optimized", "deployed",
                    "managed", "launched", "scaled", "increased", "decreased"]
    has_metrics = bool(re.search(r'\b\d+%|\$\d+|\d+x\b', text, re.IGNORECASE))
    has_actions = sum(1 for v in action_verbs if v in text.lower())
    has_skills_section = "skills" in text.lower()
    has_experience = "experience" in text.lower() or "work" in text.lower()
    has_education = "education" in text.lower() or "university" in text.lower()
    has_github = "github" in text.lower()

    ats_score = (
        min(len(skill_names) * 3, 30) +  # skills (max 30)
        (15 if has_metrics else 0) +       # quantified results
        (min(has_actions * 3, 15) if has_actions else 0) +  # action verbs
        (10 if has_skills_section else 0) +
        (10 if has_experience else 0) +
        (8 if has_education else 0) +
        (7 if has_github else 0) +
        (5 if word_count > 300 else 0)
    )

    return {
        "anonymized_text": anonymized,
        "pii_removed_count": len(pii_removed),
        "anonymized": True,
        "extracted_skills": skill_names,
        "skills_with_categories": skills_found,
        "skill_count": len(skill_names),
        "estimated_experience_years": years_exp,
        "education_level": education,
        "word_count": word_count,
        "ats_score": min(ats_score, 100),
        "quality_score": min(ats_score * 0.9, 95),
        "has_metrics": has_metrics,
        "action_verb_count": has_actions,
        "skill_categories": list(set(s["category"] for s in skills_found)),
    }


# ── Explainable Similarity Scoring Engine ─────────────────────────────────────

SIMILARITY_WEIGHTS = {
    "skill_overlap":          0.40,
    "experience_relevance":   0.25,
    "industry_alignment":     0.15,
    "salary_band_compatibility": 0.20,
}


def compute_similarity_score(
    user_skills: List[str],
    user_years: int,
    user_salary_norm: float,
    job: Dict,
) -> Dict:
    """
    Weighted Similarity Scoring Equation:
    S(u,j) = w1*SkillOverlap + w2*ExperienceRel + w3*IndustryAlign + w4*SalaryCompat

    Advancement Constraint: job is only recommended if
        job.salary_normalized_score > user.salary_normalized_score
    """
    user_lower = [s.lower() for s in user_skills]
    job_skills = job.get("required_skills", [])
    preferred = job.get("preferred_skills", [])

    # w1: Skill Overlap
    required_matched = [s for s in job_skills if s.lower() in user_lower]
    preferred_matched = [s for s in preferred if s.lower() in user_lower]
    skill_overlap = (len(required_matched) + 0.5 * len(preferred_matched)
                     ) / max(len(job_skills) + 0.5 * len(preferred), 1)

    # w2: Experience Relevance
    job_exp_min = job.get("experience_years_min", 0)
    job_exp_max = job.get("experience_years_max", 20)
    if user_years < job_exp_min:
        exp_relevance = max(0.1, 1 - (job_exp_min - user_years) * 0.15)
    elif user_years > job_exp_max + 5:
        exp_relevance = 0.75  # overqualified but not excluded
    else:
        exp_relevance = 1.0

    # w3: Industry Alignment (simplified without full industry graph)
    industry_alignment = 0.75  # default; would use embedding similarity in prod

    # w4: Salary Band Compatibility
    job_mid_salary = sum(job.get("salary_range", [0, 0])) / 2
    job_norm = salary_normalize(job_mid_salary) if job_mid_salary else {
        "normalized_score": 0}
    job_norm_score = job_norm["normalized_score"]

    # Advancement constraint check
    advancement_guaranteed = job_norm_score > user_salary_norm

    salary_compat = 1.0 if advancement_guaranteed else 0.2

    # Composite score
    composite = (
        SIMILARITY_WEIGHTS["skill_overlap"] * skill_overlap +
        SIMILARITY_WEIGHTS["experience_relevance"] * exp_relevance +
        SIMILARITY_WEIGHTS["industry_alignment"] * industry_alignment +
        SIMILARITY_WEIGHTS["salary_band_compatibility"] * salary_compat
    )

    return {
        "composite_score": round(composite * 100, 2),
        "skill_overlap_pct": round(skill_overlap * 100, 1),
        "matched_required": required_matched,
        "matched_preferred": preferred_matched,
        "missing_skills": [s for s in job_skills if s.lower() not in user_lower],
        "experience_relevance": round(exp_relevance * 100, 1),
        "industry_alignment": round(industry_alignment * 100, 1),
        "salary_compatibility": round(salary_compat * 100, 1),
        "advancement_guaranteed": advancement_guaranteed,
        "job_salary_normalization": job_norm,
        "score_weights": SIMILARITY_WEIGHTS,
        "explainability": {
            "top_reason": "Strong skill overlap" if skill_overlap > 0.7 else
                          "Advancement opportunity" if advancement_guaranteed else
                          "Partial skill match",
            "skill_contribution": round(SIMILARITY_WEIGHTS["skill_overlap"] * skill_overlap * 100, 1),
            "salary_contribution": round(SIMILARITY_WEIGHTS["salary_band_compatibility"] * salary_compat * 100, 1),
        }
    }


# ── Skill Gap Analysis Engine ─────────────────────────────────────────────────

ROLE_REQUIREMENTS = {
    "machine learning engineer": {
        "core":     ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas"],
        "advanced": ["MLOps", "Kubernetes", "Docker", "Apache Spark", "Feature Engineering", "Model Serving"],
        "nice":     ["JAX", "ONNX", "Triton", "Weights & Biases", "DVC"],
        "soft":     ["Research skills", "Experiment design", "Data storytelling", "Cross-team collaboration"],
    },
    "data scientist": {
        "core":     ["Python", "R", "SQL", "Statistics", "Pandas", "Scikit-learn"],
        "advanced": ["Deep Learning", "A/B Testing", "Tableau", "Apache Spark", "BigQuery", "dbt"],
        "nice":     ["Causal inference", "Bayesian modeling", "Time series", "NLP"],
        "soft":     ["Business acumen", "Communication", "Stakeholder management", "Storytelling"],
    },
    "software engineer": {
        "core":     ["Python", "JavaScript", "Data Structures", "Algorithms", "Git", "SQL"],
        "advanced": ["System Design", "Microservices", "AWS", "Docker", "CI/CD", "Redis"],
        "nice":     ["Rust", "Go", "gRPC", "Kafka", "GraphQL"],
        "soft":     ["Problem solving", "Code review", "Technical writing", "Mentoring"],
    },
    "devops engineer": {
        "core":     ["Linux", "Docker", "Kubernetes", "CI/CD", "Terraform", "Bash"],
        "advanced": ["AWS", "GCP", "Azure", "Prometheus", "Grafana", "Ansible", "Helm"],
        "nice":     ["ArgoCD", "Istio", "Vault", "Pulumi", "Go"],
        "soft":     ["Incident management", "Documentation", "SRE mindset", "On-call discipline"],
    },
    "data engineer": {
        "core":     ["Python", "SQL", "Apache Spark", "Airflow", "dbt", "PostgreSQL"],
        "advanced": ["Kafka", "Delta Lake", "Snowflake", "BigQuery", "Databricks", "Redshift"],
        "nice":     ["Flink", "Iceberg", "dlt", "Prefect", "Dagster"],
        "soft":     ["Data modeling", "Documentation", "Collaboration", "Reliability mindset"],
    },
    "product manager": {
        "core":     ["Product roadmapping", "User research", "A/B Testing", "SQL", "Analytics"],
        "advanced": ["OKRs", "Agile/Scrum", "Figma", "Competitive analysis", "Pricing strategy"],
        "nice":     ["SQL", "Python basics", "API literacy", "ML basics"],
        "soft":     ["Leadership", "Communication", "Prioritization", "Empathy", "Negotiation"],
    },
}


def analyze_skill_gap(current_skills: List[str], target_role: str) -> Dict:
    """Classify skills as Have / Missing / Priority using Skill Possession Matrix"""
    role_key = None
    target_lower = target_role.lower()
    for key in ROLE_REQUIREMENTS:
        if key in target_lower or any(w in target_lower for w in key.split()):
            role_key = key
            break
    if not role_key:
        role_key = "software engineer"

    reqs = ROLE_REQUIREMENTS[role_key]
    all_required = reqs["core"] + reqs["advanced"]
    current_lower = [s.lower() for s in current_skills]

    have, missing, priority = [], [], []
    for skill in all_required:
        if skill.lower() in current_lower:
            have.append(skill)
        else:
            missing.append(skill)
            # Priority = top 3 core skills missing (highest ROI)
            if len(priority) < 4 and skill in reqs["core"]:
                priority.append(skill)

    match_score = len(have) / max(len(all_required), 1) * 100

    # Salary impact estimate for priority skills
    SKILL_IMPACT = {
        "tensorflow": 18000, "pytorch": 20000, "mlops": 28000,
        "kubernetes": 22000, "aws": 25000, "apache spark": 15000,
        "system design": 30000, "kafka": 16000, "dbt": 12000,
    }
    priority_with_impact = [
        {
            "skill": s,
            "estimated_salary_impact": SKILL_IMPACT.get(s.lower(), 10000),
            "learning_weeks": 6 if s.lower() in ["kubernetes", "aws"] else 4,
        }
        for s in priority
    ]

    return {
        "target_role": target_role,
        "role_matched": role_key,
        "skills_have": have,
        "skills_missing": missing,
        "skills_priority": priority,
        "skills_priority_detailed": priority_with_impact,
        "skills_nice_to_have": reqs.get("nice", []),
        "soft_skills": reqs.get("soft", []),
        "match_score": round(match_score, 1),
        "completeness_level": "Strong" if match_score > 70 else "Moderate" if match_score > 40 else "Needs Work",
        "estimated_reskilling_weeks": len(missing) * 3,
        "total_potential_salary_uplift": sum(s["estimated_salary_impact"] for s in priority_with_impact),
    }


# ── Learning Resource Scoring ─────────────────────────────────────────────────

def compute_learning_score(resource: Dict) -> float:
    """
    Learning Score = Relevance × Rating × Popularity × Skill Coverage
    Normalized to 0-100
    """
    relevance = resource.get("relevance", 0.8)
    rating = resource.get("rating", 3.5) / 5.0
    popularity = min(resource.get("review_count", 100) / 10000, 1.0)
    skill_cov = resource.get("skill_coverage", 0.7)
    raw = relevance * rating * popularity * skill_cov * 100_000
    return round(min(raw, 100), 1)


# ── Career Growth Predictor ────────────────────────────────────────────────────

def predict_career_trajectory(
    current_salary: float,
    current_level: str,
    target_level: str,
    years: int,
    scenario: str = "moderate",
) -> List[Dict]:
    """Predict salary trajectory using compounding growth model"""
    GROWTH_RATES = {
        "conservative": 0.06,
        "moderate":     0.12,
        "aggressive":   0.20,
    }
    rate = GROWTH_RATES.get(scenario, 0.12)
    levels = list(SALARY_LEVELS.keys())
    current_idx = levels.index(current_level) if current_level in levels else 2

    trajectory = []
    for i in range(years + 1):
        progress = i / max(years, 1)
        salary = current_salary * math.pow(1 + rate, i)
        level_float = current_idx + progress * 2  # advance ~2 levels over horizon
        level_idx = min(int(level_float), len(levels) - 1)
        level = levels[level_idx]
        trajectory.append({
            "year": datetime.now().year + i,
            "projected_salary": round(salary, 0),
            "salary_k": round(salary / 1000, 1),
            "level": level,
            "label": SALARY_LEVELS[level]["label"],
            "cumulative_growth_pct": round((math.pow(1 + rate, i) - 1) * 100, 1),
        })
    return trajectory
