"""
CareerIQ Pro - Database Models & Connection
SQLAlchemy ORM with async support via asyncpg
"""

from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean,
    DateTime, Text, JSON, ForeignKey, Enum as SAEnum, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
import enum

# ── Engine ─────────────────────────────────────────────────────────────────────
DATABASE_URL = "postgresql://careeriq:careeriq_pass@localhost:5432/careeriq_db"
SQLITE_URL   = "sqlite:///./careeriq_dev.db"   # fallback for local dev

# Use SQLite for development, PostgreSQL for production
import os
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"

engine = create_engine(
    SQLITE_URL if USE_SQLITE else DATABASE_URL,
    connect_args={"check_same_thread": False} if USE_SQLITE else {},
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Enums ───────────────────────────────────────────────────────────────────────
class SkillStatus(str, enum.Enum):
    HAVE     = "have"
    MISSING  = "missing"
    PRIORITY = "priority"

class JobStatus(str, enum.Enum):
    ACTIVE   = "active"
    CLOSED   = "closed"
    APPLIED  = "applied"
    SAVED    = "saved"

class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"

class SalaryLevel(str, enum.Enum):
    L1 = "L1"; L2 = "L2"; L3 = "L3"; L4 = "L4"; L5 = "L5"
    L6 = "L6"; L7 = "L7"; L8 = "L8"; L9 = "L9"; L10 = "L10"


# ── Models ──────────────────────────────────────────────────────────────────────

class User(Base):
    """Core user profile — no PII stored post-anonymization"""
    __tablename__ = "users"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_hash      = Column(String(64), unique=True, index=True)  # SHA-256 of email
    name_alias      = Column(String(50))                           # "Alex C." only
    current_role    = Column(String(100))
    target_role     = Column(String(100))
    experience_years= Column(Integer, default=0)
    location        = Column(String(50))
    current_salary  = Column(Float, default=0.0)
    salary_level    = Column(String(5))   # L1-L10
    salary_norm_score = Column(Float, default=0.0)
    hashed_password = Column(String(128))
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login      = Column(DateTime)
    privacy_settings = Column(JSON, default=lambda: {
        "share_anonymous": True,
        "store_history": True,
        "allow_benchmarking": True,
    })

    # Relationships
    resumes          = relationship("Resume", back_populates="user", cascade="all, delete")
    skills           = relationship("UserSkill", back_populates="user", cascade="all, delete")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete")
    learning_progress = relationship("LearningProgress", back_populates="user", cascade="all, delete")
    score_history    = relationship("ScoreHistory", back_populates="user", cascade="all, delete")
    sessions         = relationship("UserSession", back_populates="user", cascade="all, delete")

    def __repr__(self):
        return f"<User {self.id} | {self.current_role}>"


class Resume(Base):
    """Anonymized resume storage — PII stripped before persistence"""
    __tablename__ = "resumes"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id          = Column(String(36), ForeignKey("users.id"), index=True)
    version          = Column(Integer, default=1)
    raw_text_hash    = Column(String(64))          # hash for dedup, not raw text
    anonymized_text  = Column(Text)                # PII-stripped version only
    extracted_skills = Column(JSON, default=list)  # ["Python", "Docker", ...]
    experience_years = Column(Integer, default=0)
    education_level  = Column(String(50))
    ats_score        = Column(Float, default=0.0)
    quality_score    = Column(Float, default=0.0)
    keyword_density  = Column(Float, default=0.0)
    salary_estimate  = Column(Float, default=0.0)
    salary_range_low = Column(Float, default=0.0)
    salary_range_high= Column(Float, default=0.0)
    salary_level     = Column(String(5))
    analysis_json    = Column(JSON, default=dict)  # full analysis output
    created_at       = Column(DateTime, default=datetime.utcnow)
    is_primary       = Column(Boolean, default=True)

    user             = relationship("User", back_populates="resumes")

    __table_args__ = (Index("ix_resume_user_primary", "user_id", "is_primary"),)


class UserSkill(Base):
    """Individual skill record with learning progress"""
    __tablename__ = "user_skills"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id        = Column(String(36), ForeignKey("users.id"), index=True)
    skill_name     = Column(String(100), index=True)
    category       = Column(String(50))          # ML, DevOps, Frontend, etc.
    status         = Column(String(20), default=SkillStatus.MISSING)
    proficiency    = Column(Integer, default=0)  # 0-100
    is_priority    = Column(Boolean, default=False)
    salary_impact  = Column(Float, default=0.0)  # estimated $ uplift
    verified       = Column(Boolean, default=False)
    source         = Column(String(50))          # resume, manual, assessment
    added_at       = Column(DateTime, default=datetime.utcnow)
    verified_at    = Column(DateTime)

    user           = relationship("User", back_populates="skills")

    __table_args__ = (Index("ix_user_skill_unique", "user_id", "skill_name", unique=True),)


class Job(Base):
    """Cached job listing from external sources"""
    __tablename__ = "jobs"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    external_id      = Column(String(100), unique=True, index=True)
    source           = Column(String(50))          # adzuna, linkedin, indeed
    title            = Column(String(200), index=True)
    company          = Column(String(100), index=True)
    location         = Column(String(100))
    industry         = Column(String(100))
    description      = Column(Text)
    required_skills  = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    salary_min       = Column(Float)
    salary_max       = Column(Float)
    salary_level     = Column(String(5))
    salary_norm_score= Column(Float, default=0.0)
    url              = Column(String(500))
    remote_ok        = Column(Boolean, default=False)
    experience_years = Column(Integer, default=0)
    posted_at        = Column(DateTime)
    expires_at       = Column(DateTime)
    scraped_at       = Column(DateTime, default=datetime.utcnow)
    is_active        = Column(Boolean, default=True)
    advancement_tags = Column(JSON, default=list)

    applications     = relationship("JobApplication", back_populates="job")

    __table_args__ = (
        Index("ix_job_salary", "salary_min", "salary_max"),
        Index("ix_job_active_level", "is_active", "salary_level"),
    )


class JobApplication(Base):
    """User's job application tracking"""
    __tablename__ = "job_applications"

    id           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String(36), ForeignKey("users.id"), index=True)
    job_id       = Column(String(36), ForeignKey("jobs.id"))
    match_score  = Column(Float, default=0.0)
    skill_overlap= Column(Float, default=0.0)
    status       = Column(String(20), default=JobStatus.SAVED)
    notes        = Column(Text)
    applied_at   = Column(DateTime)
    created_at   = Column(DateTime, default=datetime.utcnow)

    user         = relationship("User", back_populates="job_applications")
    job          = relationship("Job", back_populates="applications")


class LearningResource(Base):
    """Curated learning resource catalog"""
    __tablename__ = "learning_resources"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title           = Column(String(200), index=True)
    platform        = Column(String(100))
    resource_type   = Column(String(50))  # course, book, certification, video
    url             = Column(String(500))
    skill_tags      = Column(JSON, default=list)
    rating          = Column(Float, default=0.0)
    review_count    = Column(Integer, default=0)
    duration_hours  = Column(Float)
    price_usd       = Column(Float, default=0.0)
    is_free         = Column(Boolean, default=False)
    salary_uplift   = Column(Float, default=0.0)   # estimated $ impact
    relevance_score = Column(Float, default=0.0)   # calculated
    learning_score  = Column(Float, default=0.0)   # Relevance × Rating × Popularity × Skill Coverage
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow)


class LearningProgress(Base):
    """User's progress on learning resources"""
    __tablename__ = "learning_progress"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id        = Column(String(36), ForeignKey("users.id"), index=True)
    resource_id    = Column(String(36), ForeignKey("learning_resources.id"))
    skill_name     = Column(String(100))
    status         = Column(String(20), default=ProgressStatus.NOT_STARTED)
    progress_pct   = Column(Float, default=0.0)   # 0-100
    hours_spent    = Column(Float, default=0.0)
    started_at     = Column(DateTime)
    completed_at   = Column(DateTime)
    certificate_url= Column(String(500))
    salary_impact_realized = Column(Float, default=0.0)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user           = relationship("User", back_populates="learning_progress")
    resource       = relationship("LearningResource")

    __table_args__ = (Index("ix_lp_user_resource", "user_id", "resource_id"),)


class ScoreHistory(Base):
    """Time-series tracking of salary, job-match, and skill scores"""
    __tablename__ = "score_history"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id        = Column(String(36), ForeignKey("users.id"), index=True)
    salary_score   = Column(Float, default=0.0)
    job_match_score= Column(Float, default=0.0)
    skill_score    = Column(Float, default=0.0)
    ats_score      = Column(Float, default=0.0)
    skills_count   = Column(Integer, default=0)
    jobs_matched   = Column(Integer, default=0)
    recorded_at    = Column(DateTime, default=datetime.utcnow, index=True)
    notes          = Column(String(200))

    user           = relationship("User", back_populates="score_history")

    __table_args__ = (Index("ix_sh_user_date", "user_id", "recorded_at"),)


class UserSession(Base):
    """JWT refresh token tracking"""
    __tablename__ = "user_sessions"

    id           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String(36), ForeignKey("users.id"), index=True)
    refresh_token= Column(String(500), unique=True, index=True)
    device_info  = Column(String(200))
    ip_address   = Column(String(50))
    created_at   = Column(DateTime, default=datetime.utcnow)
    expires_at   = Column(DateTime)
    revoked      = Column(Boolean, default=False)

    user         = relationship("User", back_populates="sessions")


class MarketSnapshot(Base):
    """Cached market intelligence data"""
    __tablename__ = "market_snapshots"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    snapshot_date   = Column(DateTime, default=datetime.utcnow, index=True)
    trending_skills = Column(JSON, default=list)
    salary_benchmarks = Column(JSON, default=dict)
    top_companies   = Column(JSON, default=list)
    hot_roles       = Column(JSON, default=list)
    regional_data   = Column(JSON, default=dict)
    source          = Column(String(100))
    is_current      = Column(Boolean, default=True)


# ── DB Helpers ─────────────────────────────────────────────────────────────────

def get_db():
    """FastAPI dependency — yields a DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables (run once on startup)"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def drop_db():
    """Drop all tables (dev/test only)"""
    Base.metadata.drop_all(bind=engine)
    print("⚠️  Database dropped")


if __name__ == "__main__":
    init_db()
