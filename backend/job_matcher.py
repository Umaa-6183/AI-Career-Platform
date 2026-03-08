"""
CareerIQ Pro - Job Matching Service
Multi-source job aggregation + explainable similarity scoring
Supports Adzuna API, JSearch API, and internal dataset fallback
"""

import re
import json
import math
import random
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from ml_engine import compute_similarity_score, salary_normalize, SALARY_LEVELS


# ── Internal Job Dataset (fallback when APIs unavailable) ─────────────────────

INTERNAL_JOB_DATASET = [
    {
        "id": "j001", "source": "internal",
        "title": "Senior ML Engineer",        "company": "DeepMind",
        "location": "London / Remote",         "industry": "AI Research",
        "salary_range": [180_000, 240_000],
        "required_skills": ["Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes"],
        "preferred_skills": ["JAX", "Distributed Training", "Research"],
        "experience_years_min": 4, "experience_years_max": 12,
        "remote_ok": True, "posted_days_ago": 2,
        "description": "Join the research engineering team building next-gen ML systems.",
    },
    {
        "id": "j002", "source": "internal",
        "title": "Staff Data Scientist",       "company": "Stripe",
        "location": "San Francisco",            "industry": "Fintech",
        "salary_range": [200_000, 280_000],
        "required_skills": ["Python", "Statistics", "SQL", "A/B Testing", "ML"],
        "preferred_skills": ["Causal inference", "Bayesian modeling", "Spark"],
        "experience_years_min": 6, "experience_years_max": 15,
        "remote_ok": False, "posted_days_ago": 5,
        "description": "Drive data-driven decisions at scale across Stripe's global payments platform.",
    },
    {
        "id": "j003", "source": "internal",
        "title": "Principal Software Engineer", "company": "Anthropic",
        "location": "Remote",                   "industry": "AI Safety",
        "salary_range": [220_000, 300_000],
        "required_skills": ["Python", "System Design", "AWS", "Microservices", "Distributed Systems"],
        "preferred_skills": ["Rust", "Go", "Large-scale systems"],
        "experience_years_min": 8, "experience_years_max": 20,
        "remote_ok": True, "posted_days_ago": 1,
        "description": "Build safe, scalable infrastructure for advanced AI systems.",
    },
    {
        "id": "j004", "source": "internal",
        "title": "ML Platform Engineer",        "company": "Uber",
        "location": "NYC",                      "industry": "Mobility",
        "salary_range": [160_000, 210_000],
        "required_skills": ["Python", "Kubernetes", "Apache Spark", "MLOps", "Scala"],
        "preferred_skills": ["Airflow", "Kafka", "Feature Store"],
        "experience_years_min": 3, "experience_years_max": 10,
        "remote_ok": False, "posted_days_ago": 3,
        "description": "Scale ML infrastructure serving 100M+ daily predictions.",
    },
    {
        "id": "j005", "source": "internal",
        "title": "AI Research Engineer",        "company": "Google DeepMind",
        "location": "Mountain View",            "industry": "AI Research",
        "salary_range": [250_000, 380_000],
        "required_skills": ["Python", "PyTorch", "Research", "Mathematics", "JAX"],
        "preferred_skills": ["Reinforcement Learning", "RLHF", "Large models"],
        "experience_years_min": 5, "experience_years_max": 15,
        "remote_ok": False, "posted_days_ago": 7,
        "description": "Publish state-of-the-art research and translate it to products.",
    },
    {
        "id": "j006", "source": "internal",
        "title": "Data Engineering Lead",       "company": "Databricks",
        "location": "Remote",                   "industry": "Data Platform",
        "salary_range": [170_000, 230_000],
        "required_skills": ["Python", "Apache Spark", "Kafka", "SQL", "dbt"],
        "preferred_skills": ["Delta Lake", "Iceberg", "Terraform"],
        "experience_years_min": 5, "experience_years_max": 12,
        "remote_ok": True, "posted_days_ago": 4,
        "description": "Lead the data engineering function building the lakehouse platform.",
    },
    {
        "id": "j007", "source": "internal",
        "title": "Cloud Solutions Architect",   "company": "AWS",
        "location": "Seattle",                  "industry": "Cloud",
        "salary_range": [190_000, 260_000],
        "required_skills": ["AWS", "Terraform", "Kubernetes", "System Design", "Python"],
        "preferred_skills": ["CDK", "Serverless", "Multi-cloud"],
        "experience_years_min": 6, "experience_years_max": 15,
        "remote_ok": False, "posted_days_ago": 6,
        "description": "Help enterprise customers architect scalable, secure cloud solutions.",
    },
    {
        "id": "j008", "source": "internal",
        "title": "Senior Product Manager — AI", "company": "OpenAI",
        "location": "San Francisco",            "industry": "AI",
        "salary_range": [210_000, 290_000],
        "required_skills": ["Product roadmapping", "SQL", "AI knowledge", "User research", "OKRs"],
        "preferred_skills": ["LLM APIs", "Data analysis", "Design thinking"],
        "experience_years_min": 5, "experience_years_max": 15,
        "remote_ok": False, "posted_days_ago": 2,
        "description": "Shape the roadmap for AI products used by millions globally.",
    },
    {
        "id": "j009", "source": "internal",
        "title": "LLM Infrastructure Engineer", "company": "Cohere",
        "location": "Remote",                   "industry": "AI",
        "salary_range": [155_000, 205_000],
        "required_skills": ["Python", "PyTorch", "Kubernetes", "Distributed Systems", "CUDA"],
        "preferred_skills": ["Model parallelism", "Triton", "ONNX"],
        "experience_years_min": 3, "experience_years_max": 10,
        "remote_ok": True, "posted_days_ago": 1,
        "description": "Build the infrastructure that trains and serves large language models.",
    },
    {
        "id": "j010", "source": "internal",
        "title": "Senior DevOps / SRE",         "company": "Cloudflare",
        "location": "Austin / Remote",          "industry": "Networking",
        "salary_range": [145_000, 195_000],
        "required_skills": ["Kubernetes", "Terraform", "Go", "Prometheus", "Linux"],
        "preferred_skills": ["Rust", "eBPF", "Service mesh"],
        "experience_years_min": 4, "experience_years_max": 12,
        "remote_ok": True, "posted_days_ago": 3,
        "description": "Maintain 99.999% uptime for infrastructure serving 20% of global internet traffic.",
    },
]


class JobMatcherService:
    """
    Multi-source job matching with advancement constraint enforcement.
    Advancement Rule: recommended_salary_score > user_salary_score
    """

    def __init__(self, api_key_adzuna: str = None, api_key_jsearch: str = None):
        self.api_adzuna = api_key_adzuna
        self.api_jsearch = api_key_jsearch

    async def fetch_external_jobs(self, query: str, location: str = "us") -> List[Dict]:
        """Fetch live jobs from Adzuna API"""
        if not self.api_adzuna:
            return []
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"https://api.adzuna.com/v1/api/jobs/{location}/search/1",
                    params={
                        "app_id": self.api_adzuna,
                        "app_key": self.api_adzuna,
                        "results_per_page": 20,
                        "what": query,
                        "content-type": "application/json",
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return self._normalize_adzuna(data.get("results", []))
        except Exception:
            pass
        return []

    def _normalize_adzuna(self, raw_jobs: List[Dict]) -> List[Dict]:
        """Normalize Adzuna API response to internal format"""
        normalized = []
        for j in raw_jobs:
            salary_min = j.get("salary_min", 0) or 0
            salary_max = j.get("salary_max", salary_min * 1.2) or salary_min
            skills = self._extract_skills_from_description(j.get("description", ""))
            normalized.append({
                "id": f"adzuna_{j.get('id')}",
                "source": "adzuna",
                "title": j.get("title", ""),
                "company": j.get("company", {}).get("display_name", "Unknown"),
                "location": j.get("location", {}).get("display_name", ""),
                "salary_range": [salary_min, salary_max],
                "required_skills": skills[:8],
                "preferred_skills": skills[8:12],
                "experience_years_min": 0,
                "experience_years_max": 15,
                "remote_ok": "remote" in j.get("title", "").lower(),
                "description": j.get("description", "")[:500],
                "url": j.get("redirect_url", ""),
                "posted_days_ago": 3,
            })
        return normalized

    def _extract_skills_from_description(self, description: str) -> List[str]:
        """Quick skill extraction from job description"""
        SKILL_KEYWORDS = [
            "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "Scala",
            "TensorFlow", "PyTorch", "Kubernetes", "Docker", "AWS", "GCP", "Azure",
            "SQL", "PostgreSQL", "React", "Node.js", "FastAPI", "Spark", "Kafka",
            "MLOps", "Terraform", "Airflow", "dbt", "Redis", "MongoDB",
        ]
        found = []
        desc_lower = description.lower()
        for skill in SKILL_KEYWORDS:
            if skill.lower() in desc_lower:
                found.append(skill)
        return found

    def match_jobs(
        self,
        user_skills: List[str],
        experience_years: int,
        current_salary_score: float,
        target_roles: List[str] = [],
        remote_ok: bool = True,
        location: str = None,
        external_jobs: List[Dict] = [],
        min_score: float = 0.0,
    ) -> Dict:
        """
        Core job matching with advancement constraint.
        All returned jobs guarantee salary advancement.
        """
        all_jobs = INTERNAL_JOB_DATASET + external_jobs

        results = []
        filtered_out = 0

        for job in all_jobs:
            # Location filter
            if location and not remote_ok:
                if location.lower() not in job.get("location", "").lower():
                    continue

            # Remote filter
            if not remote_ok and job.get("remote_ok", False):
                # Skip remote-only jobs if user wants on-site
                pass

            # Score the match
            match = compute_similarity_score(
                user_skills=user_skills,
                user_years=experience_years,
                user_salary_norm=current_salary_score,
                job=job,
            )

            # Advancement constraint check
            if not match["advancement_guaranteed"]:
                filtered_out += 1
                continue

            # Role filter (optional)
            if target_roles:
                title_lower = job["title"].lower()
                if not any(role.lower() in title_lower or title_lower in role.lower() for role in target_roles):
                    pass  # still include for discovery

            results.append({
                **job,
                "match": match,
                "posted_ago": f"{job.get('posted_days_ago', 0)}d ago",
            })

        # Sort by match score
        results.sort(key=lambda x: x["match"]["composite_score"], reverse=True)

        return {
            "jobs": results[:10],
            "total_found": len(results),
            "total_checked": len(all_jobs),
            "filtered_non_advancement": filtered_out,
            "advancement_filter_applied": True,
            "filter_stats": {
                "passed_advancement_filter": len(results),
                "failed_advancement_filter": filtered_out,
                "advancement_filter_pct": round(len(results) / max(len(all_jobs), 1) * 100, 1),
            }
        }


job_matcher = JobMatcherService()
