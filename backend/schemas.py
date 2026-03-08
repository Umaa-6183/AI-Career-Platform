"""
CareerIQ Pro - Pydantic Schemas
All request/response validation models
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ── Auth Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=100)
    current_role: str = Field(..., min_length=2, max_length=100)
    experience_years: int = Field(0, ge=0, le=50)
    current_salary: float = Field(0, ge=0)
    location: str = "US"

    @validator("password")
    def password_strength(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    name_alias: Optional[str]


# ── User Schemas ────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    name: str
    current_role: str
    target_role: Optional[str]
    experience_years: int = 0
    current_salary: float = 0.0
    location: str = "US"
    skills: List[str] = []


class UserProfileUpdate(BaseModel):
    current_role: Optional[str]
    target_role: Optional[str]
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    current_salary: Optional[float] = Field(None, ge=0)
    location: Optional[str]
    privacy_settings: Optional[Dict[str, bool]]


class UserProfileResponse(BaseModel):
    id: str
    name_alias: str
    current_role: Optional[str]
    target_role: Optional[str]
    experience_years: int
    current_salary: float
    salary_level: Optional[str]
    salary_norm_score: float
    location: Optional[str]
    created_at: datetime
    skills_count: int = 0

    class Config:
        from_attributes = True


# ── Resume Schemas ──────────────────────────────────────────────────────────────

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, max_length=50_000)
    target_role: Optional[str]
    location: Optional[str] = "US"


class ResumeAnalysisResponse(BaseModel):
    status: str
    resume_id: Optional[str]
    parsing: Dict[str, Any]
    salary_estimation: Dict[str, Any]
    skill_gap: Optional[Dict[str, Any]]
    ats_score: float
    resume_quality_score: float
    recommendations: List[str]
    processing_time_ms: Optional[float]


class ATSOptimizationRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    job_description: str = Field(..., min_length=20)


# ── Salary Schemas ──────────────────────────────────────────────────────────────

class SalaryNormRequest(BaseModel):
    role: str
    experience_years: int = Field(0, ge=0, le=50)
    skills: List[str] = []
    location: str = "US"
    education: Optional[str] = "bachelor"


class SalaryNormResponse(BaseModel):
    status: str
    data: Dict[str, Any]


class SalaryLevel(BaseModel):
    level: str
    label: str
    range: List[float]
    normalized_score: float


# ── Job Matching Schemas ────────────────────────────────────────────────────────

class JobMatchRequest(BaseModel):
    user_skills: List[str]
    experience_years: int = Field(0, ge=0)
    current_salary_score: float = Field(0.0, ge=0, le=1)
    target_roles: List[str] = []
    location: Optional[str]
    remote_ok: bool = True
    filters: Optional[Dict[str, Any]] = {}


class JobMatchResponse(BaseModel):
    status: str
    jobs: List[Dict[str, Any]]
    total_found: int
    advancement_filter_applied: bool
    filter_stats: Optional[Dict]


class JobSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    location: Optional[str]
    remote_ok: bool = True
    salary_min: Optional[float]
    experience_years: Optional[int]
    page: int = Field(1, ge=1)
    per_page: int = Field(10, ge=1, le=50)


# ── Skill Gap Schemas ───────────────────────────────────────────────────────────

class SkillGapRequest(BaseModel):
    current_skills: List[str]
    target_role: str


class SkillGapResponse(BaseModel):
    status: str
    gap_analysis: Dict[str, Any]
    learning_resources: List[Dict[str, Any]]


class SkillUpdateRequest(BaseModel):
    skill_name: str
    status: str  # have, missing, priority
    proficiency: Optional[int] = Field(None, ge=0, le=100)
    source: Optional[str] = "manual"


# ── Progress Schemas ────────────────────────────────────────────────────────────

class LearningProgressUpdate(BaseModel):
    resource_id: str
    skill_name: str
    progress_pct: float = Field(0, ge=0, le=100)
    hours_spent: float = Field(0, ge=0)
    status: str = "in_progress"


class ScoreHistoryEntry(BaseModel):
    salary_score: float
    job_match_score: float
    skill_score: float
    ats_score: float
    skills_count: int
    recorded_at: datetime

    class Config:
        from_attributes = True


# ── Market Insights Schema ──────────────────────────────────────────────────────

class MarketInsightsResponse(BaseModel):
    status: str
    trending_skills: List[Dict]
    salary_benchmarks: Dict
    top_hiring_companies: List[str]
    hot_regions: List[str]
    last_updated: Optional[str]


# ── Career Forecast Schema ──────────────────────────────────────────────────────

class CareerForecastRequest(BaseModel):
    current_level: str = "L3"
    target_level: str = "L5"
    current_salary: float = 85_000
    years: int = Field(4, ge=1, le=10)
    scenario: str = "moderate"  # conservative, moderate, aggressive


class CareerForecastResponse(BaseModel):
    status: str
    trajectory: List[Dict]
    total_salary_growth: str
    scenario: str


# ── Community Benchmarking Schema ───────────────────────────────────────────────

class BenchmarkQuery(BaseModel):
    role: str
    experience_years: int
    location: Optional[str]
    skills_count: Optional[int]


class BenchmarkResponse(BaseModel):
    status: str
    user_percentile: float
    peer_salary_distribution: List[Dict]
    skill_overlap_stats: List[Dict]
    anonymized_peers: List[Dict]
    privacy_note: str


# ── Generic Responses ───────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    status: str = "success"
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    code: Optional[str]
    detail: Optional[Any]


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
