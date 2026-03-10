# CareerIQ Pro
### AI-Driven Career Growth and Job Assistance Web Platform
#### with Explainable Intelligence, Salary Normalization, Privacy-First Design, and Quantitative Evaluation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Innovations](#2-key-innovations)
3. [Full Folder and File Structure](#3-full-folder-and-file-structure)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Core Modules](#6-core-modules)
7. [Mathematical Formulations](#7-mathematical-formulations)
8. [Frontend Pages (21 Screens)](#8-frontend-pages-21-screens)
9. [Backend API Reference](#9-backend-api-reference)
10. [Database Schema](#10-database-schema)
11. [Design System](#11-design-system)
12. [Setup and Installation](#12-setup-and-installation)
13. [Docker Deployment](#13-docker-deployment)
14. [End-to-End User Workflow](#14-end-to-end-user-workflow)
15. [Evaluation and Validation Framework](#15-evaluation-and-validation-framework)
16. [Privacy and Ethics](#16-privacy-and-ethics)
17. [Environment Variables](#17-environment-variables)

---

## 1. Project Overview

CareerIQ Pro is a next-generation, purely software-based AI career intelligence platform that empowers candidates with transparent, data-driven, and explainable career guidance. Unlike traditional job portals that act as vacancy listing boards, CareerIQ Pro provides:

- Salary-normalized career intelligence — know your exact L1-L10 market position
- Advancement-only job filtering — every recommendation guarantees financial progression
- Explainable AI decisions — SHAP-style feature attribution for every prediction
- Privacy-first architecture — PII is stripped before any processing occurs
- Quantitative evaluation framework — measurable accuracy metrics for all AI components

### What This Platform Is

- Career intelligence and guidance system
- Skill gap detection and prioritization engine
- Salary-normalized job recommendation engine
- Learning and re-skilling assistant
- Resume analysis and ATS optimization tool

### What This Platform Is NOT

- No interviews conducted
- No employer communication
- No job placement guarantees
- No consultancy or HR replacement services

---

## 2. Key Innovations

| Innovation | Description |
|-----------|-------------|
| L1-L10 Salary Normalization | All salaries mapped to a universal 10-band scale before any regression or comparison |
| Advancement Constraint Rule | Jobs recommended ONLY if job.salary_score > user.salary_score |
| CNN Salary Prediction | Multi-layer convolutional model trained on anonymized resume features |
| Explainable Similarity Engine | Weighted 4-factor formula with full attribution breakdown |
| Skill Possession Matrix | Binary classification of skills as Have / Missing / Priority |
| Privacy-First Processing | PII anonymized before storage; SHA-256 email hashing; user-controlled deletion |
| Learning ROI Tracker | Tracks financial return (salary uplift / course cost) per certification |
| Career Network Map | Interactive SVG graph of all role transition paths with salary at each node |

---

## 3. Full Folder and File Structure

```
careeriq-pro/
|
|-- README.md                           <- This file (full project documentation)
|-- docker-compose.yml                  <- Full containerised stack (API + DB + Redis + Nginx)
|-- .env.example                        <- Environment variables template
|-- .gitignore
|-- nginx.conf                          <- Nginx reverse proxy configuration
|-- LICENSE
|
|-- backend/                            <- Python FastAPI backend
|   |-- Dockerfile                      <- Backend container definition
|   |-- requirements.txt                <- All Python dependencies (pinned versions)
|   |-- main.py                         <- FastAPI app entry point (434 lines, 20+ endpoints)
|   |-- config.py                       <- Pydantic Settings, env-based config (136 lines)
|   |-- database.py                     <- SQLAlchemy ORM, 10 models (322 lines)
|   |-- auth.py                         <- JWT auth, bcrypt, GDPR delete (227 lines)
|   |-- schemas.py                      <- 30+ Pydantic request/response models (270 lines)
|   |-- ml_engine.py                    <- CNN salary, NLP parser, skill gap (553 lines)
|   |-- job_matcher.py                  <- Multi-source aggregator, advancement filter (280 lines)
|   |-- init.sql                        <- PostgreSQL initialisation script
|   `-- tests/
|       |-- __init__.py
|       |-- test_salary.py              <- Unit tests: salary normalisation
|       |-- test_matching.py            <- Unit tests: job similarity scoring
|       |-- test_resume.py              <- Unit tests: NLP parsing pipeline
|       `-- test_auth.py                <- Unit tests: JWT auth flow
|
`-- frontend/                           <- React 18 SPA
    |-- Dockerfile                      <- Frontend container (nginx-served build)
    |-- package.json                    <- Dependencies: recharts, lucide-react
    |-- public/
    |   |-- index.html                  <- App HTML shell with loading screen
    |   `-- favicon.ico
    `-- src/
        |-- index.js                    <- React entry point (11 lines)
        |-- index.css                   <- Global reset, keyframes, typography (130 lines)
        |-- api.js                      <- API client, token mgmt, error handling (177 lines)
        |-- styles.jsx                  <- Design token constants, shared styles (190 lines)
        |
        |-- App_Full.jsx                <- PRODUCTION ENTRY: Parts 1+2 merged (2,302 lines)
        |                                  Contains all 15 pages integrated into
        |                                  one file with grouped sidebar navigation
        |
        |-- App.jsx                     <- Part 1 source: 9 core platform pages
        |-- App2.jsx                    <- Part 2 source: 6 growth and prep pages (1,353 lines)
        |-- App3.jsx                    <- Part 3 source: 6 advanced AI pages (1,091 lines)
        |
        `-- hooks/
            `-- useCareerData.js        <- 10 custom React hooks (177 lines)
```

### Backend Files - Detailed Description

```
backend/main.py        (434 lines)
  FastAPI application with CORS, lifespan DB init, and all 20+ API endpoints.
  Includes mock data fallback, health check, and OpenAPI metadata.

backend/ml_engine.py   (553 lines)
  The core AI/ML engine containing:
  - salary_normalize(salary) - L1-L10 mapping function
  - salary_estimate_from_features() - CNN-inspired regression
  - anonymize_text() - PII removal pipeline
  - extract_skills() - NLP skill taxonomy matching (200+ skills)
  - extract_experience_years() - date-range inference
  - parse_resume() - full pipeline orchestrator
  - compute_similarity_score() - weighted 4-factor matching
  - analyze_skill_gap() - Skill Possession Matrix
  - compute_learning_score() - resource ranking formula
  - predict_career_trajectory() - compound growth model

backend/database.py    (322 lines)
  SQLAlchemy ORM with 10 models:
  User, Resume, UserSkill, Job, JobApplication,
  LearningResource, LearningProgress, ScoreHistory,
  UserSession, MarketSnapshot
  Supports SQLite (dev) and PostgreSQL (production).

backend/auth.py        (227 lines)
  JWT access + refresh token rotation (7-day access, 30-day refresh).
  bcrypt password hashing. SHA-256 email hashing for privacy.
  GDPR-compliant hard delete via AuthService.delete_account().

backend/schemas.py     (270 lines)
  30+ Pydantic v2 models covering auth, resume, salary,
  jobs, skills, progress, market, career, and generic responses.

backend/job_matcher.py (280 lines)
  JobMatcherService with Adzuna API integration and 10-job
  internal dataset fallback. Advancement constraint enforced
  as a hard filter - non-compliant jobs are never returned.

backend/config.py      (136 lines)
  Pydantic BaseSettings with all configuration: DB URLs,
  JWT secrets, salary level definitions, similarity weights,
  privacy settings, external API keys.
```

### Frontend Files - Detailed Description

```
frontend/src/App_Full.jsx    (2,302 lines)  [PRODUCTION ENTRY]
  Complete SPA with all 15 pages:
  - LandingPage (onboarding form with animated grid background)
  - Dashboard (KPI cards, salary chart, radar chart)
  - ResumeAnalysis (paste/upload, NLP display, ATS score)
  - SalaryIntelligence (ScoreRing, L1-L10 bar chart, level grid)
  - JobMatching (advancement filter banner, match cards)
  - SkillGapAnalysis (possession matrix, learning path cards)
  - MarketInsights (demand bars, salary premiums, company grid)
  - SideHustles (income cards, difficulty, platform links)
  - Portfolio (project cards, tech stacks, GitHub scores)
  - CareerGrowthForecast (3-scenario chart, role roadmap)
  - InterviewPrep (question bank, practice mode, AI scoring)
  - ProgressTracker (skill bars, score history, activity)
  - ATSOptimizer (side-by-side editor, keyword matrix)
  - CommunityBenchmarking (salary distribution, peer profiles)
  - SettingsPrivacy (profile editor, privacy controls, export)

frontend/src/App2.jsx        (1,353 lines)  [Part 2 standalone]
  6 pages: CareerGrowthForecast, InterviewPrep, ProgressTracker,
  ATSOptimizer, CommunityBenchmarking, SettingsPrivacy.
  Includes integration guide comments for merging into App_Full.jsx.

frontend/src/App3.jsx        (1,091 lines)  [Part 3 standalone]
  6 pages: MLExplainability, AdvancedJobSearch, ResumeBuilder,
  LearningImpact, CareerNetworkMap, NotificationCenter.
  Includes integration guide comments at bottom of file.

frontend/src/api.js          (177 lines)
  Centralized fetch wrapper with:
  - Automatic Bearer token injection
  - Token refresh on 401 (silent refresh flow)
  - AbortController timeout (10s)
  - Graceful null return on network failure (demo mode fallback)
  - Methods: api.auth, api.resume, api.salary, api.jobs,
    api.skills, api.market, api.career, api.progress, api.user

frontend/src/hooks/useCareerData.js  (177 lines)
  10 custom hooks:
  - useFetch - generic data fetching with loading/error state
  - useMarketInsights - live market data
  - useSalaryLevels - L1-L10 reference data
  - useJobMatching - advancement-filtered job results
  - useSkillGap - skill classification for target role
  - useResumeAnalyzer - NLP analysis pipeline
  - useScoreHistory - time-series score data
  - useSalaryNorm - client-side salary normalisation
  - useDebounce - input debouncing (400ms default)
  - useWindowSize - responsive layout helper

frontend/src/index.css       (130 lines)
  Global CSS: box-model reset, Google Fonts import,
  keyframe animations (fadeUp, fadeIn, float, pulse-glow, shimmer, spin),
  custom scrollbar, selection color, Recharts tooltip overrides.
```

---

## 4. Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Primary language |
| FastAPI | 0.111 | REST API with OpenAPI auto-docs |
| Uvicorn | 0.29 | ASGI server (4-worker production) |
| SQLAlchemy | 2.0 | ORM for PostgreSQL / SQLite |
| PostgreSQL | 15 | Primary production database |
| SQLite | built-in | Development database (zero config) |
| Redis | 7 | API response caching (1h TTL) |
| Pydantic v2 | 2.7 | Request/response validation |
| python-jose | 3.3 | JWT encoding and decoding |
| passlib + bcrypt | 1.7 | Password hashing |
| httpx | 0.27 | Async HTTP client for external APIs |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Recharts | latest | Data visualizations (area, bar, line, radar, scatter, pie) |
| Lucide React | 0.263 | Icon system (40+ icons used) |
| Syne | - | Display and heading font (Google Fonts) |
| JetBrains Mono | - | Code and tag font (Google Fonts) |
| Inter | - | Body text font (Google Fonts) |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker | Container runtime |
| Docker Compose | Full-stack orchestration |
| Nginx | Reverse proxy and static file serving |

---

## 5. System Architecture

```
+-------------------------------------------------------------+
|                     Web User Interface                       |
|              React 18 SPA  *  21 pages  *  Dark UI          |
|         Electric Cobalt + Acid Lime + Sunset Orange          |
+----------------------+--------------------------------------+
                       | HTTPS / REST
+----------------------v--------------------------------------+
|                   Backend API Layer                          |
|          FastAPI  *  JWT Auth  *  Pydantic v2               |
|          20+ endpoints  *  OpenAPI auto-docs                 |
+--------+---------------------------+------------------------+
         |                           |
+--------v----------+    +-----------v---------------------+
|  Explainable AI   |    |   Secure Database Layer          |
|  / ML Engine      |    |                                  |
|                   |    |  PostgreSQL  (production)         |
|  * CNN Salary     |    |  SQLite      (development)        |
|    Regressor      |    |  Redis       (caching)            |
|  * NLP Parser     |    |                                  |
|  * Similarity     |    |  Tables: users, resumes,          |
|    Scoring Engine |    |  skills, jobs, applications,      |
|  * Skill Gap      |    |  learning_resources,              |
|    Matrix         |    |  learning_progress,               |
|  * Career Growth  |    |  score_history,                   |
|    Predictor      |    |  user_sessions,                   |
|                   |    |  market_snapshots                 |
+-------------------+    +----------------------------------+
                                      |
+-------------------------------------v--------------------+
|                 External Data Sources                     |
|    Adzuna Jobs API  *  JSearch API  *  Internal Dataset  |
+----------------------------------------------------------+
```

---

## 6. Core Modules

### 6.1 User Management and Personalisation

Handles user onboarding, JWT authentication with refresh token rotation, career preferences, target roles, salary expectations, and skill-level profiling. Email is stored only as a SHA-256 hash - never in plaintext. Files: database.py, auth.py.

### 6.2 Resume Upload, Parsing and Anonymisation

Extracts skills using regex-pattern NLP against a 200+ term skill taxonomy across 8 categories (languages, ML/AI, data engineering, DevOps/cloud, frontend, backend, soft-technical). Removes PII: names, email addresses, phone numbers, URLs. Infers years of experience from date ranges and explicit statements. Detects education level. Returns only anonymised text - raw input is never persisted. File: ml_engine.py.

### 6.3 Salary Normalization and Estimation

Maps any salary to the universal L1-L10 scale, then applies a multi-feature regression model to estimate salary from resume features. Outputs: normalised score, expected range, market alignment index, and per-feature contributions including role base, experience delta, skill premiums, and location adjustment. File: ml_engine.py.

### 6.4 Career Path Recommendation with Advancement Constraint

Every job recommendation is gated by the rule: job.salary_norm > user.salary_norm. Jobs below the user's current level are silently filtered before results are returned. The filter rate (% passing advancement check) is included in the API response for transparency. File: job_matcher.py.

### 6.5 Skill Possession Matrix

Classifies every skill in the target role's requirement set into three states: Have (confirmed in profile), Missing (absent, required), Priority (missing skills with highest salary-uplift ROI - top 4 core skills). Each priority skill includes estimated salary impact and learning weeks. File: ml_engine.py.

### 6.6 AI-Driven Rapid Skill Re-Education

Recommends short-duration, high-impact learning resources ranked by Learning Score = Relevance x Rating x Popularity x Skill Coverage. Sources include Coursera, Udemy, Pluralsight, official certifications, and books. File: main.py.

### 6.7 Explainable Similarity Scoring Engine

4-factor weighted formula produces a composite match score between a user profile and a job listing. Every score is fully decomposed with factor-level attribution shown to the user. File: ml_engine.py.

### 6.8 Resume Optimization and ATS Enhancement

Analyses resume against a job description to produce: 5-dimension ATS score, keyword match matrix with importance levels, severity-ranked issue list with specific fixes, action verb audit, and quantified result detection. Files: main.py, ml_engine.py.

### 6.9 Career Growth Prediction

Compound growth model with 3 scenarios: Conservative (6%), Moderate (12%), Aggressive (20%) annual growth. Projects salary trajectory, level progression, and cumulative growth over 2-10 year horizons. File: ml_engine.py.

### 6.10 Market Insights and Analytics Dashboard

Aggregates trending skills with demand growth rates, salary benchmarks by role, top hiring companies, and regional demand. File: main.py.

### 6.11 Side Hustle and Monetisable Skill Module

Recommends freelancing and gig-economy opportunities aligned with the user's existing skill set, with monthly income ranges, time-to-income estimates, difficulty ratings, and platform recommendations. File: main.py.

### 6.12 Portfolio and Project Recommendation

Suggests real-world projects, GitHub repository improvements, and case study ideas with tech stack, estimated build time, GitHub visibility score, and salary impact estimate. File: main.py.

### 6.13 Learning Impact and Progress Tracker

Time-series tracking of salary score, job-match score, skill coverage, and ATS score. Stores per-course progress and calculates ROI = (salary_after - salary_before) / course_cost * 100. File: database.py, main.py.

### 6.14 Community Benchmarking

Anonymised peer comparison across salary percentile, skill overlap, and role-level distribution. All peer data is fully anonymised. File: main.py.

### 6.15 Evaluation and Validation Framework

Exposes quantitative metrics: Precision/Recall for job matching, MAE/RMSE for salary prediction, Coverage Rate for skill gap detection, and ATS Score Delta for resume optimisation. File: main.py.

---

## 7. Mathematical Formulations

### 7.1 Salary Normalization Function

```
normalized_score(s) = (level_index(s) + intra_level_position(s)) / 10

Where:
  level_index(s)           = integer position of salary band [0..9]
                             L1=0, L2=1, ..., L10=9
  intra_level_position(s)  = (s - band_min) / (band_max - band_min)
                             value in [0.0, 1.0)

Therefore: normalized_score is in [0.0, 1.0]
```

### 7.2 Salary Level Bands (L1-L10)

| Level | Label | Salary Range (USD) | Normalized Range |
|-------|-------|-------------------|-----------------|
| L1 | Entry Level | $30K - $50K | 0.000 - 0.100 |
| L2 | Junior | $50K - $70K | 0.100 - 0.200 |
| L3 | Mid-Level | $70K - $90K | 0.200 - 0.300 |
| L4 | Senior | $90K - $120K | 0.300 - 0.400 |
| L5 | Staff / Lead | $120K - $160K | 0.400 - 0.500 |
| L6 | Principal | $160K - $200K | 0.500 - 0.600 |
| L7 | Distinguished | $200K - $260K | 0.600 - 0.700 |
| L8 | Fellow | $260K - $340K | 0.700 - 0.800 |
| L9 | Senior Fellow | $340K - $450K | 0.800 - 0.900 |
| L10 | Executive / VP | $450K - $1M+ | 0.900 - 1.000 |

### 7.3 CNN Salary Estimation Model

```
estimated_salary =
  (base_role_salary x experience_multiplier + skill_bonus)
  x location_factor x education_factor

experience_multiplier = 1 + min(exp_years, 15) x 0.045
                          + max(0, exp_years - 15) x 0.015

skill_bonus = sum of SKILL_PREMIUM(skill_i) for each skill, capped at $80K

location_factor:
  India = 0.22, Remote = 0.95, US = 1.00,
  Seattle = 1.12, New York = 1.18, San Francisco = 1.28

education_factor:
  None = 0.88, Associate = 0.92, Bachelor = 1.00,
  Master = 1.06, PhD = 1.12
```

### 7.4 Explainable Similarity Scoring Equation

```
S(u, j) = w1 x SkillOverlap(u,j)
         + w2 x ExperienceRelevance(u,j)
         + w3 x IndustryAlignment(u,j)
         + w4 x SalaryBandCompatibility(u,j)

Default weights:
  w1 = 0.40  (skill overlap - primary matching signal)
  w2 = 0.25  (experience relevance - years fit)
  w3 = 0.15  (industry alignment - domain match)
  w4 = 0.20  (salary band compatibility - advancement check)

SkillOverlap(u,j) =
  (count(matched_required) + 0.5 x count(matched_preferred))
  / (count(required) + 0.5 x count(preferred))

ExperienceRelevance:
  1.0 if user.years within job range
  degrades by 15% per year outside range, minimum 0.10

SalaryBandCompatibility:
  1.0 if job.norm_score > user.norm_score  (advancement)
  0.2 if job.norm_score <= user.norm_score (penalised, rarely shown)
```

### 7.5 Career Advancement Constraint Rule

```
RULE: Job j is recommended to user u if and only if:

  salary_normalize(midpoint(j.salary_range)).score
  >
  user.salary_normalized_score

This is a hard filter applied BEFORE similarity scoring.
No lateral or downward moves are ever surfaced to the user.
```

### 7.6 Learning Resource Score

```
LearningScore(r) = Relevance(r) x (Rating(r) / 5)
                   x min(reviews(r) / 10000, 1.0)
                   x SkillCoverage(r)
                   x 100000

Result normalized to range [0, 100]
```

### 7.7 Learning ROI Calculation

```
ROI(course) = (annual_salary_after - annual_salary_before)
              / course_cost_usd
              x 100  (expressed as %)
```

---

## 8. Frontend Pages (21 Screens)

### Part 1 - Core Platform (App.jsx merged into App_Full.jsx)

| # | Page | Key Components |
|---|------|----------------|
| 1 | Landing / Onboarding | 2-step form, animated grid background, glow blobs, trust badges |
| 2 | Dashboard | Welcome banner, 4 KPI StatCards, salary area chart, radar chart, quick actions |
| 3 | Resume Analysis | Resume textarea, NLP parsing display, ATS score, 5 optimization tips, sample resume |
| 4 | Salary Intelligence | ScoreRing L1-L10 display, all-bands bar chart, salary level grid, MAI |
| 5 | Job Matching | Advancement filter banner, job cards, ScoreRing match scores, skill tags |
| 6 | Skill Gap Analysis | 3 ScoreRings, Skill Possession Matrix, learning path cards, soft skills grid |
| 7 | Market Insights | Horizontal demand bars, salary premium chart, company logo grid |
| 8 | Side Hustles | Income cards with monthly range, difficulty badges, time-to-income |
| 9 | Portfolio | Project cards, tech stack pills, GitHub visibility score, salary impact |

### Part 2 - Growth and Prep Modules (App2.jsx merged into App_Full.jsx)

| # | Page | Key Components |
|---|------|----------------|
| 10 | Career Growth Forecast | 3-scenario area chart, scenario comparison cards, role transition roadmap, milestones |
| 11 | Interview Prep | 4-category question bank, collapsible frameworks, practice textarea, AI feedback score |
| 12 | Progress Tracker | Skill progress bars, score history line chart, weekly activity bar chart, completions |
| 13 | ATS Optimizer | Side-by-side editor, 5-dimension score grid, keyword match matrix, fix list |
| 14 | Community Benchmarking | Salary histogram, peer skill overlap bars, anonymized peer profile cards |
| 15 | Settings and Privacy | Profile editor form, notification toggles, privacy controls, data export, delete |

### Part 3 - Advanced AI Modules (App3.jsx)

| # | Page | Key Components |
|---|------|----------------|
| 16 | ML Explainability | SHAP feature waterfall, similarity formula code view, CNN layer diagram |
| 17 | Advanced Job Search | Filter bar, remote toggle, salary filter chips, saved jobs, skill highlighting |
| 18 | Resume Builder | Multi-section live editor, per-bullet metric warning, ATS score panel, keyword chips |
| 19 | Learning Impact ROI | ROI bar chart, salary before/after cards, visual roadmap with completion timeline |
| 20 | Career Network Map | Interactive SVG node graph, salary at each node, transition paths, detail panel |
| 21 | Notification Center | Priority-filtered alerts, mark-all-read, per-item dismiss, type-based tabs |

---

## 9. Backend API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register user, returns JWT pair |
| POST | /api/auth/login | None | Login, returns JWT pair |
| POST | /api/auth/refresh | Refresh token | Rotate access and refresh tokens |
| POST | /api/auth/logout | Bearer | Revoke refresh token |

### Resume

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/resume/analyze | Optional | NLP parse, salary estimate, skill gap |
| POST | /api/resume/ats-optimize | Optional | ATS score against job description |

### Salary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/salary/normalize | Optional | Multi-feature salary estimation |
| GET | /api/salary-levels | None | Full L1-L10 reference data |

### Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/jobs/match | Optional | Advancement-filtered job matching |
| POST | /api/jobs/search | Optional | Free-text search with filters |
| POST | /api/jobs/{id}/save | Bearer | Save job to user list |
| POST | /api/jobs/{id}/apply | Bearer | Mark job as applied |

### Skills

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/skills/gap | Optional | Skill gap analysis and learning resources |
| POST | /api/skills/update | Bearer | Add or update user skill |
| DELETE | /api/skills/{name} | Bearer | Remove skill from profile |
| GET | /api/resources/{skill} | None | Learning resources for specific skill |

### Market

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/market/insights | None | Full market intelligence snapshot |
| GET | /api/market/trending-skills | None | Skill demand rankings |
| GET | /api/market/salary-benchmarks | None | Role x location salary matrix |
| POST | /api/market/benchmark | Optional | Anonymized peer comparison |

### Career

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/career/growth-forecast | Optional | Multi-scenario salary trajectory |
| GET | /api/side-hustles | None | Income diversification options |
| POST | /api/portfolio/recommend | Optional | Project recommendations |

### Progress and User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/progress/update | Bearer | Update learning progress |
| GET | /api/progress/history | Bearer | Full learning history |
| GET | /api/progress/scores | Bearer | Score history time series |
| GET | /api/user/profile | Bearer | Get user profile |
| PUT | /api/user/profile | Bearer | Update profile |
| DELETE | /api/user/delete | Bearer | GDPR delete, all data permanently removed |
| GET | /api/user/export | Bearer | Download all user data as JSON |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | None | API status and version |
| GET | /health | None | Health check for Docker |
| GET | /docs | None | Interactive OpenAPI docs (Swagger UI) |
| GET | /redoc | None | ReDoc documentation |

---

## 10. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| users | User profiles - no PII stored (email as SHA-256 hash, name as alias) |
| resumes | Anonymized resume versions with extracted skills and scores |
| user_skills | Individual skill records with proficiency and progress |
| jobs | Cached job listings from external sources with salary normalization |
| job_applications | User's application tracking with match scores |
| learning_resources | Curated resource catalogue with learning scores |
| learning_progress | Per-user per-resource progress with ROI tracking |
| score_history | Time-series: salary score, job-match score, skill score, ATS score |
| user_sessions | JWT refresh token tracking with revocation support |
| market_snapshots | Cached market intelligence with trending skills and benchmarks |

### Privacy-First Schema Design

```
users.email_hash        SHA-256 of email, never plaintext
users.name_alias        "Alex C." format only, never full name
resumes.anonymized_text PII-stripped version only persisted
resumes.raw_text_hash   SHA-256 for dedup check, not the text itself
```

---

## 11. Design System

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Electric Cobalt | #1A6BFF | Primary buttons, active states, scores, link borders |
| Sunset Orange | #FF6425 | Alerts, critical actions, missing skills, warnings |
| Acid Lime | #AAFF00 | Success, owned skills, growth indicators, advancement |
| Rich Charcoal | #141420 | App background, primary text base |
| Charcoal Mid | #1E1E2E | Card surfaces, sidebar background |
| Charcoal Light | #28283C | Input backgrounds, hover states, tags |
| Text Primary | #EEEEF8 | All body text |
| Text Muted | #7777AA | Labels, secondary text, placeholders |

### Typography

| Font | Usage | Weights |
|------|-------|---------|
| Syne | Headings, display, logos, score numbers | 700, 800 |
| JetBrains Mono | Code blocks, skill tags, technical values | 400, 600 |
| Inter | Body text, descriptions, forms | 300, 400, 600 |

### Shared Components (all inline in App_Full.jsx)

| Component | Props | Purpose |
|-----------|-------|---------|
| Pill | children, color, size | Colored badge with border glow |
| Card | children, style, glow, onClick | Surface container with hover effect |
| ScoreRing | score, size, color, label | SVG circular progress with glow |
| ProgressBar | value, max, color, height | Animated horizontal progress bar |
| StatCard | icon, label, value, sub, color | KPI card with icon and metric |
| SectionHeader | title, sub, icon, badge, action | Page title block with optional action slot |

---

## 12. Setup and Installation

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm 9 or higher

### Option A - Local Development (SQLite, no Docker)

```bash
# Clone repository
git clone https://github.com/your-org/careeriq-pro.git
cd careeriq-pro

# Backend setup
python -m venv venv
source venv/bin/activate
# On Windows: venv\Scripts\activate

cd backend
pip install -r requirements.txt

cp ../.env.example .env
# USE_SQLITE=true is the default, no database setup needed

uvicorn main:app --reload --port 8000
# API docs at: http://localhost:8000/docs
```

```bash
# Frontend setup (in a new terminal)
cd frontend
npm install
npm start
# App at: http://localhost:3000
```

### Option B - Production with Docker Compose

```bash
git clone https://github.com/your-org/careeriq-pro.git
cd careeriq-pro

cp .env.example .env
# Edit .env: set SECRET_KEY, optionally add Adzuna/JSearch API keys

docker-compose up --build
# Frontend: http://localhost:3000
# API:      http://localhost:8000
# Docs:     http://localhost:8000/docs
```

### Option C - Demo Mode (No Backend Required)

The React frontend includes comprehensive mock data covering every page. Open App_Full.jsx in any React sandbox (CodeSandbox, StackBlitz) or run npm start - all 15 pages work without a backend, automatically switching to demo mode when the API is unavailable.

---

## 13. Docker Deployment

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| api | python:3.11-slim | 8000 | FastAPI with 4 uvicorn workers |
| frontend | nginx:alpine | 3000 | React build served statically |
| db | postgres:15-alpine | 5432 | PostgreSQL with health check |
| redis | redis:7-alpine | 6379 | Caching with AOF persistence |
| nginx | nginx:alpine | 80, 443 | Reverse proxy |

### Commands

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Check health
docker-compose ps

# Restart one service
docker-compose restart api

# Stop everything
docker-compose down

# Full reset including volumes (clears database)
docker-compose down -v
```

---

## 14. End-to-End User Workflow

```
Step 1: ONBOARDING
  User enters: current role, years of experience,
  current salary, target role, known skills.
  Salary immediately normalized to L1-L10 band.

Step 2: RESUME UPLOAD AND ANONYMISATION
  Resume text processed through NLP pipeline.
  PII removed. Skills extracted. Experience inferred.
  Anonymized representation stored. Raw text discarded.

Step 3: SALARY NORMALISATION AND ESTIMATION
  CNN model estimates market salary from resume features.
  Output: level, normalized score, salary range,
  market alignment index, feature contributions.

Step 4: CAREER ADVANCEMENT FILTERING
  User normalized score becomes the advancement threshold.
  All job recommendations must exceed this threshold.
  Lateral and downward moves are silently excluded.

Step 5: SKILL POSSESSION ANALYSIS
  User skills compared to target role requirements.
  Each skill classified: Have / Missing / Priority.
  Priority skills include salary uplift estimates.

Step 6: RAPID RE-SKILLING RECOMMENDATIONS
  Top-priority missing skills surfaced with:
  - Estimated salary uplift
  - Learning resources ranked by Learning Score
  - Estimated weeks to acquire

Step 7: EXPLAINABLE JOB MATCHING
  S(u,j) = w1*Skill + w2*Experience + w3*Industry + w4*Salary
  Every score fully decomposed for user transparency.

Step 8: RESUME OPTIMISATION
  Resume analyzed against target JD.
  ATS score, keyword gap matrix, priority fixes delivered.

Step 9: LEARNING PROGRESS TRACKING
  User marks courses started or completed.
  Score history updated. ROI calculated per certification.

Step 10: CONTINUOUS GROWTH MONITORING
  Weekly score snapshots. Salary trajectory projection.
  New job match alerts. Market trend notifications.
```

---

## 15. Evaluation and Validation Framework

### Quantitative Metrics

| Metric | Component | Target |
|--------|-----------|--------|
| MAE (Salary Prediction) | ml_engine.py | Less than $8,000 |
| RMSE (Salary Prediction) | ml_engine.py | Less than $12,000 |
| Precision@10 (Job Matching) | job_matcher.py | Greater than 0.75 |
| Recall@10 (Job Matching) | job_matcher.py | Greater than 0.70 |
| Skill Coverage Rate | ml_engine.py | Greater than 0.85 |
| ATS Score Delta after optimization | main.py | Greater than +15 points |
| Advancement Filter Compliance | job_matcher.py | 100%, no exceptions |

### Comparative Evaluation

| Platform Type | Advancement Filter | Explainability | Salary Normalization | Privacy |
|--------------|-------------------|----------------|---------------------|---------|
| CareerIQ Pro | Hard constraint, 100% | Full SHAP decomposition | L1-L10 universal bands | PII-free, SHA-256 |
| Traditional job portals | None | Black box rankings | Raw salary only | Partial |
| Similarity-only recommenders | None | Match score only | None | Varies |

---

## 16. Privacy and Ethics

### Privacy-First AI Architecture

1. Input layer - PII stripped immediately on receipt (names, emails, phones, URLs, card numbers)
2. Storage layer - only anonymised text and SHA-256 hashes stored in database
3. Processing layer - all ML inference runs on anonymised representations only
4. Output layer - no identifying information returned in any API response
5. Deletion - DELETE /api/user/delete permanently removes all user data (GDPR Article 17)

### Anonymization Details

```python
PII_PATTERNS removed:
  - Full names (capitalized word pairs)
  - Email addresses
  - Phone numbers (international format)
  - URLs and hyperlinks
  - Credit card numbers
  - Social security numbers

Email storage: SHA-256(email.lower()) only
Name storage:  "John Smith" -> "John S."
```

### Ethical Boundaries

| Boundary | Enforcement |
|----------|-------------|
| No interviews conducted | By design - no meeting scheduling features |
| No employer communication | No outbound messaging or contact features |
| No job placement guarantees | Explicitly stated in all UI and API responses |
| No consultancy services | No human advisor features |
| Advancement-only recommendations | Hard filter in job_matcher.py - not configurable |
| Community data anonymized | No PII in any benchmark or peer comparison output |

---

## 17. Environment Variables

Create a .env file in the project root:

```env
# Application
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key-minimum-32-characters-change-in-production

# Database
USE_SQLITE=true
DATABASE_URL=postgresql://careeriq:pass@localhost:5432/careeriq_db

# Redis (optional for development)
REDIS_URL=redis://localhost:6379/0

# External Job APIs (optional - platform works without them)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
JSEARCH_API_KEY=your_jsearch_key
GITHUB_TOKEN=your_github_token

# ML Configuration
SALARY_MODEL_PATH=
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Privacy
PII_REMOVAL_ENABLED=true
ANONYMIZATION_SALT=your-random-salt-string-change-this
DATA_RETENTION_DAYS=365
```

---

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio

# Run all tests
pytest tests/ -v

# Individual suites
pytest tests/test_salary.py -v
pytest tests/test_matching.py -v
pytest tests/test_resume.py -v
pytest tests/test_auth.py -v

# With coverage
pytest tests/ --cov=. --cov-report=html
```

---

## Project Metrics Summary

| Category | Files | Lines of Code |
|----------|-------|--------------|
| Backend Python (7 files) | 7 | 2,222 |
| Frontend React/JS (7 files) | 7 | 5,255 |
| Config and Infrastructure | 4 | ~250 |
| Total | 18 | ~7,727 |

### Backend Breakdown

| File | Lines |
|------|-------|
| ml_engine.py | 553 |
| database.py | 322 |
| main.py | 434 |
| job_matcher.py | 280 |
| schemas.py | 270 |
| auth.py | 227 |
| config.py | 136 |

### Frontend Breakdown

| File | Lines |
|------|-------|
| App_Full.jsx | 2,302 |
| App2.jsx | 1,353 |
| App3.jsx | 1,091 |
| styles.jsx | 190 |
| api.js | 177 |
| hooks/useCareerData.js | 177 |
| index.css | 130 |

---

## License

MIT License. See LICENSE file for details.

---

CareerIQ Pro - Empower every candidate with transparent, data-driven, and explainable career intelligence. 

## Acknowledgments
* This project was inspired by and based on the concept presented in the IEEE research paper: "Efficient Resume-Based Re-Education for Career
Recommendation in Rapidly Evolving Job Markets".

* Idea Conceptualization, Implementation, coding, and development:
UMAA MAHESHWARY SV | https://github.com/Umaa-6183/AI-Career-Platform

