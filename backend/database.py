"""
CareerIQ Pro — Database Models & Connection v3.0
─────────────────────────────────────────────────
• SQLAlchemy ORM — works with SQLite (dev) and PostgreSQL (prod)
• All models aligned with main.py v3.0
• Alembic-ready (metadata exposed as `Base`)
• Utility helpers: get_db(), init_db(), drop_db(), seed_demo_data()
• Switch between SQLite ↔ PostgreSQL ↔ MySQL via DATABASE_URL env var
  ─ SQLite  : sqlite:///./careeriq.db
  ─ PostgreSQL: postgresql://user:pass@host:5432/careeriq_db
  ─ MySQL   : mysql+pymysql://user:pass@host:3306/careeriq_db
"""

from __future__ import annotations

import os
import uuid
import enum
import hashlib
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    JSON,
    ForeignKey,
    Index,
    UniqueConstraint,
    event,
    text,
)
from sqlalchemy.orm import (
    sessionmaker,
    relationship,
    declarative_base,
    Session,
)
from sqlalchemy.pool import StaticPool

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG  —  read DATABASE_URL from environment, fall back to SQLite
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./careeriq.db")

# Detect driver family
_IS_SQLITE = DATABASE_URL.startswith("sqlite")
_IS_POSTGRES = DATABASE_URL.startswith(
    "postgresql") or DATABASE_URL.startswith("postgres")
_IS_MYSQL = DATABASE_URL.startswith("mysql")

# ── Engine factory ────────────────────────────────────────────────────────────


def _make_engine():
    kwargs: dict = {
        "echo": os.getenv("DB_ECHO", "false").lower() == "true",
    }

    if _IS_SQLITE:
        # SQLite needs check_same_thread=False for FastAPI's thread model
        kwargs["connect_args"] = {"check_same_thread": False}
        # Use StaticPool in test/dev so in-memory DBs work across threads
        if ":memory:" in DATABASE_URL:
            kwargs["poolclass"] = StaticPool
    else:
        # Connection pool tuning for PostgreSQL / MySQL
        kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE",    "10"))
        kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        kwargs["pool_timeout"] = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", "1800"))
        kwargs["pool_pre_ping"] = True   # drop stale connections

    return create_engine(DATABASE_URL, **kwargs)


engine = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Enable WAL mode for SQLite — better concurrent read performance
if _IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────────────────────

class SkillStatus(str, enum.Enum):
    HAVE = "have"
    MISSING = "missing"
    PRIORITY = "priority"


class JobStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    APPLIED = "applied"
    SAVED = "saved"


class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class SalaryLevel(str, enum.Enum):
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"
    L4 = "L4"
    L5 = "L5"
    L6 = "L6"
    L7 = "L7"
    L8 = "L8"
    L9 = "L9"
    L10 = "L10"


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _new_id() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


def hash_email(email: str) -> str:
    """SHA-256 of lower-cased email — used as the unique user key."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────────────────────────────────────

class DBUser(Base):
    """
    Core user profile.
    PII policy: only email_hash stored (SHA-256).  Raw email never persisted.
    """
    __tablename__ = "users"

    id = Column(String(36),  primary_key=True, default=_new_id)
    email_hash = Column(String(64),  unique=True, index=True, nullable=False)
    name = Column(String(80),  nullable=False)                # "Alex C." only
    current_role = Column(String(120))
    target_role = Column(String(120))
    experience_years = Column(Integer,     default=0)
    location = Column(String(80),  default="Bangalore")
    current_salary = Column(Float,       default=0.0)
    salary_level = Column(String(5))                            # L1 – L10
    salary_norm_score = Column(Float,       default=0.0)
    # ["Python","React",…]
    skills = Column(JSON,        default=list)
    # arbitrary onboarding goals
    goals = Column(JSON,        default=dict)
    onboarded = Column(Boolean,     default=False)
    is_active = Column(Boolean,     default=True)
    created_at = Column(DateTime,    default=_now)
    updated_at = Column(DateTime,    default=_now, onupdate=_now)
    last_login = Column(DateTime)
    privacy_settings = Column(JSON, default=lambda: {
        "share_anonymous": True,
        "store_history":   True,
        "allow_benchmarking": True,
    })

    # ── Relationships ──────────────────────────────────────────────────────
    resumes = relationship(
        "DBResume",           back_populates="user", cascade="all, delete-orphan")
    progress_entries = relationship(
        "DBProgressEntry",    back_populates="user", cascade="all, delete-orphan")
    score_history = relationship(
        "DBScoreHistory",     back_populates="user", cascade="all, delete-orphan")
    peer_connections = relationship(
        "DBPeerConnection",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="DBPeerConnection.user_id",
    )
    portfolio_projects = relationship(
        "DBPortfolioProject", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship(
        "DBJobApplication",   back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DBUser id={self.id[:8]} role={self.current_role} level={self.salary_level}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBResume(Base):
    """
    Anonymized resume storage.
    Raw PII is stripped before this record is written.
    analysis_json holds the full parsed output from main.py.
    ai_feedback holds Gemini's resume review text.
    """
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True, nullable=False)
    version = Column(Integer,    default=1)
    # SHA-256 for dedup — never raw text
    raw_text_hash = Column(String(64))
    anonymized_text = Column(Text)                     # PII-stripped version
    extracted_skills = Column(JSON,  default=list)      # ["Python","Docker",…]
    experience_years = Column(Integer,    default=0)
    education_level = Column(String(50))
    ats_score = Column(Float,      default=0.0)
    quality_score = Column(Float,      default=0.0)
    keyword_density = Column(Float,      default=0.0)
    salary_estimate = Column(Float,      default=0.0)
    salary_range_low = Column(Float,      default=0.0)
    salary_range_high = Column(Float,      default=0.0)
    salary_level = Column(String(5))
    analysis_json = Column(JSON,  default=dict)      # full analysis output
    ai_feedback = Column(Text)                     # Gemini resume review
    ats_optimization = Column(JSON,  default=dict)      # ATS optimizer output
    is_primary = Column(Boolean,    default=True)
    created_at = Column(DateTime,   default=_now)

    user = relationship("DBUser", back_populates="resumes")

    __table_args__ = (
        Index("ix_resume_user_primary", "user_id", "is_primary"),
    )

    def __repr__(self):
        return f"<DBResume id={self.id[:8]} ats={self.ats_score} user={self.user_id[:8]}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBProgressEntry(Base):
    """
    Tracks every course / resource a user engages with.
    One row per (user_id, resource_url) — unique constraint enforced.
    Sessions = number of sittings/lessons completed inside that resource.
    salary_impact is only counted once the resource reaches 'completed'.
    """
    __tablename__ = "progress_entries"

    id = Column(String(36),  primary_key=True, default=_new_id)
    user_id = Column(String(36),  ForeignKey(
        "users.id", ondelete="CASCADE"), index=True, nullable=False)
    # YouTube | GeeksforGeeks | HackerRank | IndiaBix | …
    platform = Column(String(80),  nullable=False)
    resource_title = Column(String(300), nullable=False)
    resource_url = Column(String(600), nullable=False)
    # Python | System Design | …
    skill_tag = Column(String(100))
    # tech | non-tech | soft-skills
    category = Column(String(80),  default="tech")
    # sessions / lessons attended
    sessions = Column(Integer,     default=0)
    progress_pct = Column(Float,       default=0.0)            # 0 – 100
    # not_started | in_progress | completed
    status = Column(String(30),  default="not_started")
    # INR uplift (counted only on completion)
    salary_impact = Column(Float,       default=0.0)
    notes = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    certificate_url = Column(String(600))
    created_at = Column(DateTime,    default=_now)
    updated_at = Column(DateTime,    default=_now, onupdate=_now)

    user = relationship("DBUser", back_populates="progress_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "resource_url", name="uq_user_resource"),
        Index("ix_pe_user_status", "user_id", "status"),
    )

    def __repr__(self):
        return f"<DBProgressEntry {self.platform} | {self.resource_title[:30]} | {self.status}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBScoreHistory(Base):
    """
    Time-series snapshot of all career scores.
    Written on resume upload, session record, and skill updates.
    Powers the progress graph in the dashboard.
    """
    __tablename__ = "score_history"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True, nullable=False)
    salary_score = Column(Float,  default=0.0)          # normalized 0–1
    job_match_score = Column(Float,  default=0.0)          # 0–100
    skill_score = Column(Float,  default=0.0)          # 0–100
    ats_score = Column(Float,  default=0.0)          # 0–100
    skills_count = Column(Integer, default=0)
    courses_done = Column(Integer, default=0)
    jobs_matched = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=_now, index=True)
    notes = Column(String(200))

    user = relationship("DBUser", back_populates="score_history")

    __table_args__ = (
        Index("ix_sh_user_date", "user_id", "recorded_at"),
    )

    def __repr__(self):
        return f"<DBScoreHistory user={self.user_id[:8]} skill={self.skill_score} at={self.recorded_at}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBPeerConnection(Base):
    """
    Anonymous peer comparison records.
    A user adds a peer manually (alias + salary + role + skills).
    No real PII stored — alias only.
    invite_code is shareable for future peer-to-peer linking.
    """
    __tablename__ = "peer_connections"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True, nullable=False)
    peer_alias = Column(String(80),  nullable=False)
    peer_role = Column(String(120))
    peer_salary = Column(Float,       default=0.0)
    peer_level = Column(String(5))
    peer_skills = Column(JSON,        default=list)
    peer_location = Column(String(80))
    invite_code = Column(String(12),  unique=True, index=True)
    accepted = Column(Boolean,     default=True)
    created_at = Column(DateTime,    default=_now)

    user = relationship(
        "DBUser",
        back_populates="peer_connections",
        foreign_keys=[user_id],
    )

    __table_args__ = (
        Index("ix_pc_user_accepted", "user_id", "accepted"),
    )

    def __repr__(self):
        return f"<DBPeerConnection alias={self.peer_alias} role={self.peer_role} level={self.peer_level}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBPortfolioProject(Base):
    """
    User-owned portfolio projects.
    Supports GitHub URL, live URL, optional Webflow CMS item ID.
    salary_impact_amount = estimated INR career impact of the project.
    """
    __tablename__ = "portfolio_projects"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    tech_stack = Column(JSON,  default=list)
    github_url = Column(String(600))
    live_url = Column(String(600))
    thumbnail = Column(String(600))
    webflow_id = Column(String(100))    # Webflow CMS item id if published
    webflow_slug = Column(String(200))    # Webflow page slug
    salary_impact_amount = Column(Float,  default=0.0)
    github_value = Column(String(30))     # High | Very High | Extremely High
    tags = Column(JSON,  default=list)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    user = relationship("DBUser", back_populates="portfolio_projects")

    def __repr__(self):
        return f"<DBPortfolioProject title={self.title[:40]} user={self.user_id[:8]}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBJob(Base):
    """
    Cached job listings — populated by the JSearch live feed or internal fallback.
    external_id is the job's unique ID from the source API.
    """
    __tablename__ = "jobs"

    id = Column(String(36),  primary_key=True, default=_new_id)
    external_id = Column(String(150), unique=True, index=True)
    source = Column(String(60))            # jsearch | internal
    title = Column(String(200), index=True)
    company = Column(String(120), index=True)
    location = Column(String(100))
    industry = Column(String(100))
    description = Column(Text)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    salary_min = Column(Float)
    salary_max = Column(Float)
    salary_level = Column(String(5))
    salary_norm_score = Column(Float,  default=0.0)
    url = Column(String(600))
    remote_ok = Column(Boolean, default=False)
    experience_years_min = Column(Integer, default=0)
    posted_at = Column(DateTime)
    expires_at = Column(DateTime)
    scraped_at = Column(DateTime, default=_now)
    is_active = Column(Boolean,  default=True)

    applications = relationship("DBJobApplication", back_populates="job")

    __table_args__ = (
        Index("ix_job_salary",       "salary_min", "salary_max"),
        Index("ix_job_active_level", "is_active",  "salary_level"),
    )

    def __repr__(self):
        return f"<DBJob {self.title} @ {self.company}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBJobApplication(Base):
    """Tracks a user's job applications and their match scores."""
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=_new_id)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    job_id = Column(String(36), ForeignKey(
        "jobs.id",  ondelete="SET NULL"), nullable=True)
    match_score = Column(Float,  default=0.0)
    skill_overlap = Column(Float,  default=0.0)
    status = Column(String(30), default=JobStatus.SAVED)
    notes = Column(Text)
    applied_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)

    user = relationship("DBUser", back_populates="job_applications")
    job = relationship("DBJob",  back_populates="applications")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job"),
    )

    def __repr__(self):
        return f"<DBJobApplication user={self.user_id[:8]} status={self.status}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBLearningResource(Base):
    """
    Master catalog of curated learning resources.
    Populated from main.py's LEARN_RES dict on first run via seed_learning_resources().
    Kept separate so new resources can be added without code changes.
    """
    __tablename__ = "learning_resources"

    id = Column(String(36),  primary_key=True, default=_new_id)
    title = Column(String(300), nullable=False, index=True)
    platform = Column(String(100))
    # video | course | certification | article | quiz | practice
    resource_type = Column(String(60))
    url = Column(String(600),    unique=True, index=True)
    skill_tag = Column(String(100),    index=True)
    category = Column(String(80),     default="tech")
    rating = Column(Float,          default=0.0)
    duration = Column(String(60))
    price = Column(String(30),     default="Free")
    is_free = Column(Boolean,        default=True)
    salary_uplift = Column(String(30))     # "+₹2.5L"
    salary_uplift_amount = Column(Float,     default=0.0)
    created_at = Column(DateTime,       default=_now)
    updated_at = Column(DateTime,       default=_now, onupdate=_now)

    __table_args__ = (
        Index("ix_lr_skill_platform", "skill_tag", "platform"),
    )

    def __repr__(self):
        return f"<DBLearningResource {self.platform} | {self.title[:40]}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBMarketSnapshot(Base):
    """
    Cached market intelligence — updated periodically by a background job.
    is_current = True marks the latest snapshot.
    """
    __tablename__ = "market_snapshots"

    id = Column(String(36),  primary_key=True, default=_new_id)
    snapshot_date = Column(DateTime,    default=_now, index=True)
    trending_skills = Column(JSON,  default=list)
    salary_benchmarks = Column(JSON,  default=dict)
    top_companies = Column(JSON,  default=list)
    hot_roles = Column(JSON,  default=list)
    regional_data = Column(JSON,  default=dict)
    source = Column(String(100))
    is_current = Column(Boolean, default=True)

    def __repr__(self):
        return f"<DBMarketSnapshot date={self.snapshot_date} current={self.is_current}>"


# ─────────────────────────────────────────────────────────────────────────────

class DBUserSession(Base):
    """
    JWT refresh token tracking.
    Allows multi-device logout and session revocation.
    """
    __tablename__ = "user_sessions"

    id = Column(String(36),  primary_key=True, default=_new_id)
    user_id = Column(String(36),  ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    refresh_token = Column(String(512), unique=True, index=True)
    device_info = Column(String(200))
    ip_address = Column(String(50))
    created_at = Column(DateTime,    default=_now)
    expires_at = Column(DateTime)
    revoked = Column(Boolean,     default=False)

    def __repr__(self):
        return f"<DBUserSession user={self.user_id[:8]} revoked={self.revoked}>"


# ─────────────────────────────────────────────────────────────────────────────
# DB HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def get_db():
    """
    FastAPI dependency — yields a SQLAlchemy Session.
    Usage:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables that don't exist yet. Safe to call on every startup."""
    Base.metadata.create_all(bind=engine)
    print(f"✅ CareerIQ DB ready  ({DATABASE_URL.split('///')[0]})")


def drop_db() -> None:
    """Drop ALL tables. DEV / TEST use only — never run in production."""
    Base.metadata.drop_all(bind=engine)
    print("⚠️  CareerIQ DB dropped")


def reset_db() -> None:
    """Drop then recreate all tables. Useful during development."""
    drop_db()
    init_db()
    print("🔄 CareerIQ DB reset complete")


def get_db_info() -> dict:
    """Return runtime info about the active DB connection."""
    return {
        "url":         DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
        "driver":      "SQLite" if _IS_SQLITE else ("PostgreSQL" if _IS_POSTGRES else "MySQL"),
        "echo":        engine.echo,
        "pool_size":   getattr(engine.pool, "size", lambda: 1)(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# SEED HELPERS
# ─────────────────────────────────────────────────────────────────────────────

# Import LEARN_RES from main without circular import — done lazily
def seed_learning_resources(db: Session) -> int:
    """
    Populate DBLearningResource from main.py's LEARN_RES dict.
    Skips rows that already exist (idempotent via url unique constraint).
    Returns the number of rows inserted.
    """
    try:
        from main import LEARN_RES  # type: ignore
    except ImportError:
        print("⚠️  Could not import LEARN_RES from main.py — skipping seed")
        return 0

    inserted = 0
    for skill_tag, resources in LEARN_RES.items():
        for r in resources:
            exists = db.query(DBLearningResource).filter(
                DBLearningResource.url == r["url"]
            ).first()
            if not exists:
                row = DBLearningResource(
                    title=r["title"],
                    platform=r["platform"],
                    resource_type=r["type"],
                    url=r["url"],
                    skill_tag=skill_tag,
                    category="tech",
                    rating=r.get("rating", 0.0),
                    duration=r.get("duration", ""),
                    price=r.get("price", "Free"),
                    is_free=r.get("price", "Free").lower() == "free",
                    salary_uplift=r.get("salary_uplift", ""),
                    salary_uplift_amount=r.get("salary_uplift_amount", 0.0),
                )
                db.add(row)
                inserted += 1
    db.commit()
    print(f"🌱 Seeded {inserted} learning resources")
    return inserted


def seed_demo_user(db: Session) -> Optional[DBUser]:
    """
    Create a demo user for local development / showcasing.
    Returns the existing user if already seeded.
    """
    demo_email_hash = hash_email("demo@careeriq.pro")
    existing = db.query(DBUser).filter(
        DBUser.email_hash == demo_email_hash).first()
    if existing:
        return existing

    user = DBUser(
        email_hash=demo_email_hash,
        name="Demo User",
        current_role="Software Engineer",
        target_role="Senior ML Engineer",
        experience_years=4,
        location="Bangalore",
        current_salary=1_600_000,
        salary_level="L3",
        salary_norm_score=0.35,
        skills=["Python", "React", "SQL", "Docker", "AWS", "Git"],
        goals={"target_salary": 3_000_000, "timeline_months": 12},
        onboarded=True,
    )
    db.add(user)
    db.flush()

    # Seed an initial score history row
    sh = DBScoreHistory(
        user_id=user.id,
        salary_score=0.35,
        job_match_score=55.0,
        skill_score=48.0,
        ats_score=62.0,
        skills_count=len(user.skills),
        courses_done=0,
    )
    db.add(sh)
    db.commit()
    print(f"🌱 Demo user created  id={user.id}")
    return user


def full_seed(db: Session) -> None:
    """Run all seed helpers in the correct order."""
    seed_demo_user(db)
    seed_learning_resources(db)


# ─────────────────────────────────────────────────────────────────────────────
# QUERY HELPERS  (reusable across routes)
# ─────────────────────────────────────────────────────────────────────────────

def get_user_by_id(db: Session, user_id: str) -> Optional[DBUser]:
    return db.query(DBUser).filter(DBUser.id == user_id, DBUser.is_active == True).first()


def get_user_by_email_hash(db: Session, email_hash: str) -> Optional[DBUser]:
    return db.query(DBUser).filter(DBUser.email_hash == email_hash).first()


def get_latest_resume(db: Session, user_id: str) -> Optional[DBResume]:
    return (
        db.query(DBResume)
        .filter(DBResume.user_id == user_id, DBResume.is_primary == True)
        .order_by(DBResume.created_at.desc())
        .first()
    )


def get_latest_score(db: Session, user_id: str) -> Optional[DBScoreHistory]:
    return (
        db.query(DBScoreHistory)
        .filter(DBScoreHistory.user_id == user_id)
        .order_by(DBScoreHistory.recorded_at.desc())
        .first()
    )


def get_user_progress_summary(db: Session, user_id: str) -> dict:
    """Return aggregated progress stats for a user — used by dashboard."""
    entries = db.query(DBProgressEntry).filter(
        DBProgressEntry.user_id == user_id).all()
    completed = [e for e in entries if e.status == "completed"]
    in_progress = [e for e in entries if e.status == "in_progress"]
    total_imp = sum(e.salary_impact for e in completed)
    return {
        "total_courses":         len(entries),
        "completed":             len(completed),
        "in_progress":           len(in_progress),
        "total_sessions":        sum(e.sessions for e in entries),
        "avg_progress_pct":      round(sum(e.progress_pct for e in entries) / max(len(entries), 1), 1),
        "total_salary_impact":   total_imp,
        "skills_gained":         list({e.skill_tag for e in completed if e.skill_tag}),
    }


def get_peer_comparison(db: Session, user_id: str) -> list:
    return (
        db.query(DBPeerConnection)
        .filter(DBPeerConnection.user_id == user_id, DBPeerConnection.accepted == True)
        .all()
    )


def upsert_score_history(
    db:             Session,
    user_id:        str,
    salary_score:   float = 0.0,
    job_match_score: float = 0.0,
    skill_score:    float = 0.0,
    ats_score:      float = 0.0,
    skills_count:   int = 0,
    courses_done:   int = 0,
    jobs_matched:   int = 0,
    notes:          str = "",
) -> DBScoreHistory:
    """Write a new score-history row and return it."""
    sh = DBScoreHistory(
        user_id=user_id,
        salary_score=salary_score,
        job_match_score=job_match_score,
        skill_score=skill_score,
        ats_score=ats_score,
        skills_count=skills_count,
        courses_done=courses_done,
        jobs_matched=jobs_matched,
        notes=notes,
    )
    db.add(sh)
    db.commit()
    db.refresh(sh)
    return sh


# ─────────────────────────────────────────────────────────────────────────────
# STANDALONE  —  run directly to init / seed the DB
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="CareerIQ DB management")
    parser.add_argument("--init",  action="store_true", help="Create tables")
    parser.add_argument("--drop",  action="store_true",
                        help="Drop tables (dev only!)")
    parser.add_argument("--reset", action="store_true",
                        help="Drop + recreate tables")
    parser.add_argument("--seed",  action="store_true", help="Seed demo data")
    parser.add_argument("--info",  action="store_true", help="Print DB info")
    args = parser.parse_args()

    if args.info:
        print(get_db_info())
    if args.drop:
        drop_db()
    if args.init or args.reset:
        if args.reset:
            drop_db()
        init_db()
    if args.seed:
        db = SessionLocal()
        try:
            full_seed(db)
        finally:
            db.close()

    if not any(vars(args).values()):
        # Default: just init
        init_db()
