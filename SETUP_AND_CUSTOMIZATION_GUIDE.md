# CareerIQ Pro — Complete Setup, Customization & ML Training Guide

---

## Table of Contents

1. [All Remaining Files & Folders](#1-all-remaining-files--folders)
2. [Required Tools — Install These First](#2-required-tools--install-these-first)
3. [All Libraries & Dependencies](#3-all-libraries--dependencies)
4. [Favicon — What to Download & How](#4-favicon--what-to-download--how)
5. [How to Change Colors & Theme](#5-how-to-change-colors--theme)
6. [How to Change Fonts](#6-how-to-change-fonts)
7. [How to Replace Dummy Data with Real Datasets](#7-how-to-replace-dummy-data-with-real-datasets)
8. [How to Train & Test the ML Models](#8-how-to-train--test-the-ml-models)
9. [Complete Installation Walk-through](#9-complete-installation-walk-through)

---

## 1. All Remaining Files & Folders

Here is the complete final project structure with every file now present:

```
careeriq-pro/
|
|-- README.md
|-- SETUP_AND_CUSTOMIZATION_GUIDE.md     <- this file
|-- LICENSE
|-- .env.example                         <- copy to .env, fill in values
|-- .gitignore
|-- docker-compose.yml
|-- nginx.conf
|
|-- backend/
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- alembic.ini                      <- DB migration config
|   |-- init.sql
|   |-- main.py
|   |-- config.py
|   |-- database.py
|   |-- auth.py
|   |-- schemas.py
|   |-- ml_engine.py
|   |-- job_matcher.py
|   |-- seed_data.py                     <- run once to populate dev DB
|   |
|   |-- alembic/                         <- database migration system
|   |   |-- env.py
|   |   |-- script.py.mako
|   |   `-- versions/
|   |       `-- .gitkeep
|   |
|   |-- ml_training/                     <- model training scripts
|   |   |-- __init__.py
|   |   |-- train_salary_model.py        <- train salary CNN/GBM model
|   |   `-- train_job_matcher.py         <- train TF-IDF job matcher
|   |
|   `-- tests/
|       |-- __init__.py
|       |-- test_salary.py
|       |-- test_matching.py
|       |-- test_resume.py
|       `-- test_auth.py
|
`-- frontend/
    |-- Dockerfile
    |-- nginx-frontend.conf
    |-- package.json
    |-- .env.example                     <- copy to .env, set API URL
    `-- src/
        |-- index.js
        |-- index.css                    <- EDIT THIS for global colors/fonts
        |-- App_Full.jsx                 <- PRODUCTION ENTRY (15 pages)
        |-- App2.jsx
        |-- App3.jsx
        |-- App.jsx
        |-- api.js
        |-- styles.jsx                   <- EDIT THIS for color tokens
        `-- hooks/
            `-- useCareerData.js
```

---

## 2. Required Tools — Install These First

Install all of these tools before running the project.

### 2.1 Python 3.11+

**Download:** https://www.python.org/downloads/

Choose Python 3.11 or 3.12. During installation on Windows, check the box
"Add Python to PATH". After installation, verify:

```bash
python --version
# Expected: Python 3.11.x or Python 3.12.x

pip --version
# Expected: pip 23.x or higher
```

### 2.2 Node.js 18+ and npm 9+

**Download:** https://nodejs.org/en/download/

Download the LTS version (18.x or 20.x). npm is included automatically.

```bash
node --version
# Expected: v18.x.x or v20.x.x

npm --version
# Expected: 9.x.x or 10.x.x
```

### 2.3 Git

**Download:** https://git-scm.com/downloads

```bash
git --version
# Expected: git version 2.x.x
```

### 2.4 Docker Desktop (for containerized deployment only)

**Download:** https://www.docker.com/products/docker-desktop/

Only needed if you want to run with docker-compose. Not needed for local development.

```bash
docker --version
# Expected: Docker version 24.x.x

docker-compose --version
# Expected: Docker Compose version 2.x.x
```

### 2.5 VS Code (recommended editor)

**Download:** https://code.visualstudio.com/

Recommended extensions:
- Python (Microsoft)
- Pylance
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- REST Client (for testing APIs)
- GitLens

### 2.6 PostgreSQL (for production database)

**Download:** https://www.postgresql.org/download/

Only needed for production. Development uses SQLite automatically (no setup needed).

---

## 3. All Libraries & Dependencies

### 3.1 Backend Python Libraries

Run this command after activating your virtual environment:

```bash
cd backend
pip install -r requirements.txt
```

Here is every library and why it is needed:

```
fastapi==0.111.0
  The web framework. Handles HTTP routing, request parsing,
  OpenAPI documentation generation, and dependency injection.
  Docs: https://fastapi.tiangolo.com

uvicorn[standard]==0.29.0
  The ASGI server that runs FastAPI. The [standard] extras
  include websocket support and faster event loops.
  Docs: https://www.uvicorn.org

python-multipart==0.0.9
  Required for file upload handling (resume PDF uploads).

httpx==0.27.0
  Async HTTP client used to call external job APIs (Adzuna, JSearch).

pydantic==2.7.1
  Data validation library. All request/response models use this.

pydantic-settings==2.2.1
  Reads config.py settings from environment variables and .env files.

email-validator==2.1.1
  Validates email format in RegisterRequest schema.

sqlalchemy==2.0.30
  The ORM (Object-Relational Mapper). Defines all database models
  and generates SQL queries.

psycopg2-binary==2.9.9
  PostgreSQL adapter for SQLAlchemy. The -binary version includes
  all C dependencies pre-compiled (no local build needed).
  Only active when USE_SQLITE=false.

alembic==1.13.1
  Database migration tool. Generates and applies schema changes
  without dropping and recreating the database.
  Usage: alembic revision --autogenerate -m "add column"
         alembic upgrade head

python-jose[cryptography]==3.3.0
  JWT (JSON Web Token) encoding and decoding for authentication.
  The [cryptography] extras enable RS256 if needed.

passlib[bcrypt]==1.7.4
  Password hashing using bcrypt. Handles salting automatically.

numpy==1.26.4
  Numerical arrays. Used in the salary estimation feature vector.

scikit-learn==1.4.2
  Used for: GradientBoostingRegressor (salary model training),
  TfidfVectorizer (job matching), cosine_similarity,
  train_test_split, cross_val_score.

redis==5.0.4
  Redis client for caching API responses.
  Only needed if REDIS_URL is configured.

pypdf2==3.0.1
  Extracts text from PDF resume uploads.

python-docx==1.1.0
  Extracts text from .docx resume uploads.

python-dotenv==1.0.1
  Loads .env file into environment variables at startup.

loguru==0.7.2
  Better structured logging with colors and rotation.
```

**Optional ML libraries** (install separately for advanced model training):

```bash
pip install xgboost lightgbm sentence-transformers spacy torch pandas joblib
```

```
xgboost, lightgbm     -> Faster, more accurate salary models than sklearn
sentence-transformers -> BERT-based semantic similarity for job matching
spacy                 -> Production NLP pipeline for skill extraction
torch                 -> Required by sentence-transformers
pandas                -> Data loading and cleaning for training scripts
joblib                -> Parallel processing during model training
```

### 3.2 Frontend JavaScript Libraries

Run this command in the frontend folder:

```bash
cd frontend
npm install
```

Here is every library and why it is needed:

```
react@18.2.0
  The core UI framework. All components are React function components.

react-dom@18.2.0
  React's browser renderer. Mounts the React tree to #root in index.html.

react-scripts@5.0.1
  Create React App toolchain. Provides:
  - Webpack bundler
  - Babel transpiler (converts JSX and modern JS to browser-compatible code)
  - Development server with hot reload
  - Production build optimization

recharts@2.10.3
  All charts in the application: AreaChart (salary trajectory),
  BarChart (market insights), RadarChart (dashboard),
  LineChart (score history), ScatterChart (benchmarking).
  Docs: https://recharts.org

lucide-react@0.263.1
  The icon library. Provides 40+ icons used across all pages:
  Brain, TrendingUp, Target, Search, Shield, etc.
  Docs: https://lucide.dev

react-router-dom@6.22.0
  Client-side routing (if you add multi-URL navigation in future).
  Currently the app uses tab-based navigation, but this enables
  browser back/forward button support.

axios@1.6.7
  Alternative HTTP client to the built-in fetch. Better error handling,
  automatic JSON parsing, request/response interceptors.
  The api.js file uses fetch but you can swap to axios if preferred.

date-fns@3.3.1
  Date formatting utilities. Used for displaying "2 days ago" style timestamps.

clsx@2.1.0
  Utility for conditional CSS class names (useful if you add Tailwind CSS).
```

---

## 4. Favicon — What to Download & How

The favicon.ico is the small icon shown in the browser tab.

### Option A: Generate Online (Easiest)

1. Go to https://favicon.io/favicon-generator/
2. Set:
   - Text: CQ (or any initials)
   - Background Shape: Rounded
   - Background Color: #1A6BFF (Electric Cobalt)
   - Font Color: #FFFFFF
   - Font: Any bold font
3. Click "Download"
4. Extract the ZIP file
5. Copy favicon.ico to: frontend/public/favicon.ico

### Option B: Convert an Image to ICO

1. Create or download any logo PNG (512x512 pixels recommended)
2. Go to https://convertio.co/png-ico/
3. Upload your PNG
4. Download the .ico file
5. Place it at: frontend/public/favicon.ico

### Option C: Use an Emoji Favicon (Already Working)

The current index.html already uses an SVG emoji favicon in the <head>:

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>" />
```

This shows 🧠 as the tab icon and works in all modern browsers without any file.
If you want a proper .ico file (required for some older browsers and PWA support),
use Options A or B above, then update index.html:

```html
<!-- Replace the SVG favicon line with: -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/logo192.png" />
```

### Option D: Create Multiple Sizes (For PWA / Mobile Icons)

```
frontend/public/
  favicon.ico         (16x16, 32x32 multi-size ICO file)
  logo192.png         (192x192 PNG — Android home screen)
  logo512.png         (512x512 PNG — PWA splash screen)
```

Download all three sizes from https://favicon.io and update index.html to reference them.

---

## 5. How to Change Colors & Theme

All colors are defined in a single location. Change one file to retheme the entire application.

### Primary Color File: frontend/src/styles.jsx

Open this file and find the color constants object at the very top:

```javascript
// FIND THIS in styles.jsx (around line 5-20):
export const C = {
  cobalt:      "#1A6BFF",    // <- PRIMARY color (buttons, active states, scores)
  cobaltDark:  "#0047CC",    // <- Hover state of primary
  cobaltGlow:  "rgba(26,107,255,0.18)",   // <- Primary glow effect
  cobaltBorder:"rgba(26,107,255,0.35)",   // <- Primary border color

  orange:      "#FF6425",    // <- ALERT color (warnings, missing skills)
  orangeGlow:  "rgba(255,100,37,0.18)",

  lime:        "#AAFF00",    // <- SUCCESS color (owned skills, advancement)
  limeGlow:    "rgba(170,255,0,0.15)",
  limeBorder:  "rgba(170,255,0,0.30)",

  charcoal:    "#1C1C28",    // <- Main background
  charcoalMid: "#252535",    // <- Card background
  charcoalLight:"#2F2F45",   // <- Input background
  charcoalDeep: "#111118",   // <- Darkest surface

  text:        "#EEEEF8",    // <- Primary text color
  textMuted:   "#7777AA",    // <- Secondary/label text
  border:      "rgba(255,255,255,0.07)",  // <- Subtle border
};
```

Change any hex code here and it propagates everywhere automatically.

### Secondary Color Files

The same C object is also defined inline in:
- frontend/src/App_Full.jsx  (line ~15)
- frontend/src/App2.jsx      (line ~15)
- frontend/src/App3.jsx      (line ~15)

If you change colors in styles.jsx, also update those three files to match.
Or do a find-and-replace across all files:

```
Find:    #1A6BFF
Replace: #YOUR_NEW_COLOR
```

### Example: Change to a Purple Theme

```javascript
export const C = {
  cobalt:       "#7C3AED",    // Purple primary
  cobaltDark:   "#5B21B6",
  cobaltGlow:   "rgba(124,58,237,0.18)",
  cobaltBorder: "rgba(124,58,237,0.35)",

  orange:       "#F59E0B",    // Amber for alerts
  lime:         "#10B981",    // Emerald for success

  charcoal:     "#0F0F1A",    // Slightly darker background
  charcoalMid:  "#1A1A2E",
  charcoalLight:"#252540",
  charcoalDeep: "#080810",

  text:         "#F0F0FF",
  textMuted:    "#8888BB",
  border:       "rgba(255,255,255,0.07)",
};
```

### Example: Change to a Light Mode Theme

```javascript
export const C = {
  cobalt:       "#1A6BFF",
  cobaltGlow:   "rgba(26,107,255,0.10)",
  cobaltBorder: "rgba(26,107,255,0.25)",

  orange:       "#E55A00",
  lime:         "#2D9F00",

  charcoal:     "#F5F5F5",    // Light background
  charcoalMid:  "#FFFFFF",    // White cards
  charcoalLight:"#EBEBEB",    // Light input background
  charcoalDeep: "#E0E0E0",

  text:         "#111111",    // Dark text
  textMuted:    "#666666",
  border:       "rgba(0,0,0,0.08)",
};
```

### Also update index.css body background:

```css
/* frontend/src/index.css — around line 15 */
body {
  background: #F5F5F5;   /* Change this to match charcoal */
  color: #111111;         /* Change this to match text */
}
```

---

## 6. How to Change Fonts

### Step 1: Choose Your Font on Google Fonts

Go to https://fonts.google.com and pick:
- A display/heading font (replaces Syne)
- A monospace font (replaces JetBrains Mono)
- A body font (replaces Inter)

Popular alternatives:
```
Display:   Space Grotesk, Outfit, Manrope, DM Sans, Plus Jakarta Sans
Monospace: Fira Code, Source Code Pro, Roboto Mono, IBM Plex Mono
Body:      Nunito, Poppins, Rubik, Work Sans, DM Sans
```

### Step 2: Update the Google Fonts Import

Find and update the import in these two files:

File 1: frontend/src/index.css (line ~5)
```css
/* BEFORE */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');

/* AFTER — example with Space Grotesk + Fira Code + Poppins */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&family=Poppins:wght@300;400;500;600&display=swap');
```

File 2: frontend/src/App_Full.jsx (around line 8, in the <style> tag inside LandingPage)
Same font import URL update.

### Step 3: Replace Font Names in styles.jsx

```javascript
// In the GlobalStyles component or CSS string in styles.jsx:

// BEFORE
font-family: 'Inter', sans-serif;     // body
font-family: 'Syne', sans-serif;      // headings
font-family: 'JetBrains Mono', monospace;  // code

// AFTER (example)
font-family: 'Poppins', sans-serif;
font-family: 'Space Grotesk', sans-serif;
font-family: 'Fira Code', monospace;
```

### Step 4: Update All Inline Font References in App_Full.jsx

Do a find-and-replace in App_Full.jsx, App2.jsx, App3.jsx:
```
Find:    'Syne', sans-serif
Replace: 'Space Grotesk', sans-serif

Find:    'JetBrains Mono', monospace
Replace: 'Fira Code', monospace

Find:    'Inter', sans-serif
Replace: 'Poppins', sans-serif
```

### Step 5: Change Font Sizes

Font sizes are scattered inline. The most common ones:

```javascript
// Page headings (SectionHeader component)
fontSize: "22px"    // h2 page titles
fontSize: "16px"    // card titles
fontSize: "13px"    // body/description
fontSize: "11px"    // labels, tags
fontSize: "24px"    // KPI values
fontSize: "32px"    // score numbers

// To make everything larger, do a search and scale up:
// 22px -> 24px, 16px -> 18px, 13px -> 14px, 11px -> 12px
```

---

## 7. How to Replace Dummy Data with Real Datasets

### 7.1 Where Dummy Data Currently Lives

The dummy/mock data is in these locations:

```
backend/main.py
  - MOCK_JOBS list (~line 40)          <- Replace with real job API
  - LEARNING_RESOURCES dict (~line 80) <- Replace with real course API
  - SIDE_HUSTLES list (~line 120)      <- Replace with curated real data
  - MARKET_DATA dict (~line 150)       <- Replace with real market API

backend/job_matcher.py
  - INTERNAL_JOB_DATASET list          <- Replace with database of real jobs

frontend/src/App_Full.jsx
  - const MOCK object (~line 50)       <- Frontend fallback, update after backend is real
```

### 7.2 Real Datasets to Download

#### Salary Data

| Dataset | Source | Format | Size | Free? |
|---------|--------|--------|------|-------|
| Data Science Job Salaries | https://www.kaggle.com/datasets/ruchi798/data-science-job-salaries | CSV | 3,700 rows | Yes |
| Stack Overflow Survey | https://survey.stackoverflow.co | CSV | 90,000+ rows | Yes |
| Levels.fyi Salary Data | https://www.levels.fyi/js/salaryData.json | JSON | 30,000+ rows | Yes |
| H1B Salary Database | https://www.kaggle.com/datasets/whenamancodes/h-1b-visa-petitions-2012-2016 | CSV | 3M rows | Yes |
| US BLS Occupational Employment | https://www.bls.gov/oes/tables.htm | XLS | Official | Yes |

**Download Kaggle dataset:**
```bash
pip install kaggle
kaggle datasets download ruchi798/data-science-job-salaries
unzip data-science-job-salaries.zip -d backend/data/
```

#### Job Listings Data

| Dataset | Source | Notes |
|---------|--------|-------|
| LinkedIn Job Postings | https://www.kaggle.com/datasets/arshkon/linkedin-job-postings | 33,000 postings |
| Indeed Job Postings | https://www.kaggle.com/datasets/promptcloud/indeed-usa-job-dataset | 22,000 postings |
| Adzuna Live API | https://developer.adzuna.com | Free tier: 100 req/day |
| JSearch API | https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch | Free tier available |

**Sign up for Adzuna API (free):**
1. Go to https://developer.adzuna.com
2. Register for a free account
3. Get your App ID and API Key
4. Add to .env:
   ```
   ADZUNA_APP_ID=your_id
   ADZUNA_API_KEY=your_key
   ```

#### Resume Data

| Dataset | Source | Notes |
|---------|--------|-------|
| Resume Dataset | https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset | 2,400 resumes, 25 categories |
| Resume Entities | https://www.kaggle.com/datasets/dataturks/resume-entities-for-ner | NER-labeled |

### 7.3 Step-by-Step: Replace Salary Data

1. Download the Kaggle salary CSV.

2. Create a data directory:
   ```bash
   mkdir -p backend/data
   cp ds_salaries.csv backend/data/
   ```

3. In ml_training/train_salary_model.py, run:
   ```bash
   cd backend
   python ml_training/train_salary_model.py \
     --data data/ds_salaries.csv \
     --data-format kaggle \
     --output salary_model.pkl
   ```

4. Update backend/ml_engine.py to load the trained model:
   ```python
   # At the top of ml_engine.py, add:
   import pickle
   import os

   _TRAINED_MODEL = None

   def _load_model():
       global _TRAINED_MODEL
       path = os.getenv("SALARY_MODEL_PATH", "salary_model.pkl")
       if path and os.path.exists(path):
           with open(path, "rb") as f:
               _TRAINED_MODEL = pickle.load(f)
       return _TRAINED_MODEL

   def salary_estimate_from_features(role, years_exp, skills, location, education):
       model = _load_model()
       if model:
           # Use trained model
           from ml_training.train_salary_model import build_feature_vector, predict_salary
           return predict_salary("salary_model.pkl", role, years_exp, skills, location, education)
       else:
           # Fall back to rule-based estimation (existing code)
           ... (existing function body)
   ```

5. Set the path in .env:
   ```
   SALARY_MODEL_PATH=salary_model.pkl
   ```

### 7.4 Step-by-Step: Replace Job Data with Live Adzuna API

In backend/job_matcher.py, find the fetch_external_jobs method and update:

```python
async def fetch_external_jobs(self, query: str, location: str = "us") -> list:
    """Fetch live jobs from Adzuna API"""
    if not self.api_adzuna:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://api.adzuna.com/v1/api/jobs/{location}/search/1",
                params={
                    "app_id":  self.api_adzuna,          # from .env
                    "app_key": self.api_key_adzuna,      # from .env
                    "results_per_page": 20,
                    "what": query,
                    "content-type": "application/json",
                    "full_time": 1,
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return self._normalize_adzuna(data.get("results", []))
    except Exception as e:
        print(f"Adzuna API error: {e}")
        return []
```

Then in config.py update the job_matcher initialization in main.py:
```python
job_matcher = JobMatcherService(
    api_key_adzuna=settings.ADZUNA_APP_ID,
    api_key_jsearch=settings.JSEARCH_API_KEY,
)
```

### 7.5 Step-by-Step: Replace Learning Resources with Udemy / Coursera Data

Udemy has a public course catalog. Coursera has an API.

```python
# In backend/main.py, replace the LEARNING_RESOURCES dict with:

async def fetch_udemy_courses(skill: str) -> list:
    """Fetch real courses from Udemy Affiliate API"""
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.udemy.com/api-2.0/courses/",
                params={"search": skill, "page_size": 10, "ordering": "highest-rated"},
                headers={
                    "Authorization": f"Basic {os.getenv('UDEMY_API_KEY')}",
                    "Accept": "application/json",
                }
            )
            courses = resp.json().get("results", [])
            return [
                {
                    "title": c["title"],
                    "platform": "Udemy",
                    "url": f"https://udemy.com{c['url']}",
                    "rating": c.get("rating", 0),
                    "price": c.get("price", "Free"),
                    "num_reviews": c.get("num_reviews", 0),
                }
                for c in courses
            ]
    except Exception:
        return []
```

---

## 8. How to Train & Test the ML Models

### 8.1 Salary Prediction Model

The model uses Gradient Boosting Regression (GBR) — more interpretable and
accurate than a pure CNN for tabular salary data.

**Step 1: Install ML dependencies**
```bash
pip install scikit-learn numpy pandas xgboost joblib
```

**Step 2: Download dataset**
```bash
# Option A: Kaggle (requires kaggle CLI)
pip install kaggle
kaggle datasets download ruchi798/data-science-job-salaries
unzip data-science-job-salaries.zip -d backend/data/

# Option B: Levels.fyi (public JSON)
curl https://www.levels.fyi/js/salaryData.json -o backend/data/levels_salaries.json

# Option C: Stack Overflow Survey
# Download manually from: https://survey.stackoverflow.co/
```

**Step 3: Train the model**
```bash
cd backend

# Using Kaggle dataset
python ml_training/train_salary_model.py \
  --data data/ds_salaries.csv \
  --data-format kaggle \
  --output salary_model.pkl

# Using Levels.fyi
python ml_training/train_salary_model.py \
  --data data/levels_salaries.json \
  --data-format levels \
  --output salary_model.pkl

# Using synthetic data (no download needed, for testing)
python ml_training/train_salary_model.py \
  --data-format synthetic \
  --samples 10000 \
  --output salary_model.pkl
```

**Step 4: Expected output**
```
Training on 3,755 records...
Valid samples after cleaning: 3,620

Iteration 1, loss = 12456.23
...
Iteration 300, loss = 4821.11

==================================================
Test MAE:         $7,842
Test RMSE:        $11,204
CV MAE (5-fold):  $8,103 ± $921
==================================================

Top 10 Feature Importances:
  location_factor                0.2814
  years_exp                      0.2341
  role                           0.1823
  mlops                          0.0534
  kubernetes                     0.0412
  ...

Model saved to: salary_model.pkl
```

**Step 5: Connect model to the API**

In your .env file:
```
SALARY_MODEL_PATH=salary_model.pkl
```

The api will automatically load and use it on startup.

**Step 6: Run evaluation tests**
```bash
cd backend
pytest tests/test_salary.py -v

# Expected output:
# test_salary.py::TestSalaryNormalize::test_l1_lower_bound   PASSED
# test_salary.py::TestSalaryNormalize::test_score_increases  PASSED
# ... (20 tests, all PASSED)
```

### 8.2 Job Matching Model (TF-IDF Semantic Matcher)

**Step 1: Download job dataset**
```bash
# LinkedIn job postings from Kaggle
kaggle datasets download arshkon/linkedin-job-postings
unzip linkedin-job-postings.zip -d backend/data/
```

**Step 2: Train the matcher**
```bash
cd backend
python ml_training/train_job_matcher.py \
  --jobs data/linkedin_job_postings.csv \
  --output job_matcher_model.pkl
```

**Step 3: Evaluate precision and recall**
```bash
cd backend
python -c "
from ml_training.train_job_matcher import evaluate_matching

# Create test pairs: (resume_text, list_of_relevant_job_ids)
test_pairs = [
    ('Python machine learning engineer TensorFlow MLOps', ['j001', 'j004']),
    ('React frontend developer JavaScript CSS', ['j007', 'j008']),
]

results = evaluate_matching('job_matcher_model.pkl', test_pairs, top_k=10)
print(results)
# Expected: {'precision_at_10': 0.75, 'recall_at_10': 0.80, 'f1_score': 0.77}
"
```

### 8.3 NLP Resume Skill Extraction

The NLP parser uses regex pattern matching (no model training needed).
To improve it, you can train a spaCy NER model on a labeled resume dataset:

**Step 1: Install spaCy**
```bash
pip install spacy
python -m spacy download en_core_web_sm
```

**Step 2: Use advanced extraction**

In ml_engine.py, add spaCy for entity recognition:
```python
import spacy
nlp = spacy.load("en_core_web_sm")

def extract_skills_advanced(text: str) -> list:
    doc = nlp(text)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    # Combine entity extraction with existing regex patterns
    regex_skills = extract_skills(text)
    return regex_skills  # extend as needed
```

### 8.4 Run All Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests with coverage
pytest tests/ -v --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html
```

**Target coverage:**
- test_salary.py    — 30 assertions
- test_matching.py  — 24 assertions
- test_resume.py    — 26 assertions
- test_auth.py      — 20 assertions

---

## 9. Complete Installation Walk-through

Follow these steps in order for a first-time setup.

### Step 1: Install tools

- Python 3.11+  from https://python.org
- Node.js 18+   from https://nodejs.org
- Git           from https://git-scm.com
- VS Code       from https://code.visualstudio.com (optional)

### Step 2: Get the project files

```bash
# If cloning from git
git clone https://github.com/your-org/careeriq-pro.git
cd careeriq-pro

# Or if you have the files already, just cd into the folder
cd careeriq-pro
```

### Step 3: Set up backend

```bash
cd backend

# Create isolated Python environment
python -m venv venv

# Activate it:
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Copy environment file
cp ../.env.example ../.env

# Start the API server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Open http://localhost:8000/docs to see the API explorer.

### Step 4: Seed the database (optional)

```bash
# With venv still active, in the backend folder:
python seed_data.py

# Expected output:
# ✅ Seeded 3 users, 9 skills, 6 score history entries, 4 learning resources
```

### Step 5: Set up frontend

Open a new terminal window:

```bash
cd frontend
npm install

# Create local env file
cp .env.example .env

# Start the React dev server
npm start
```

Your browser will automatically open http://localhost:3000

### Step 6: Verify everything works

- Frontend loads at http://localhost:3000
- You can navigate all 15+ pages
- API responds at http://localhost:8000
- API docs available at http://localhost:8000/docs

If the frontend shows "Demo Mode" in the top bar, the backend is not reachable.
Check that the backend is running and that REACT_APP_API_URL=http://localhost:8000 is in frontend/.env

### Step 7: Run tests

```bash
cd backend
pytest tests/ -v
# Expected: all tests pass
```

---

### Quick Reference — Files to Edit for Common Customizations

| What you want to change | File to edit | What to look for |
|------------------------|--------------|------------------|
| All colors / theme | frontend/src/styles.jsx | export const C = { ... } |
| Background color | frontend/src/index.css | body { background: } |
| Fonts | frontend/src/index.css | @import url('fonts.googleapis...') |
| Font sizes | frontend/src/App_Full.jsx | fontSize: "14px" (inline styles) |
| App name "CareerIQ Pro" | frontend/public/index.html | <title> tag |
| Tab icon (favicon) | frontend/public/favicon.ico | Replace the file |
| API base URL | frontend/src/api.js | const BASE_URL = ... |
| Salary bands L1-L10 | backend/ml_engine.py | SALARY_LEVELS dict |
| Skill taxonomy | backend/ml_engine.py | SKILL_TAXONOMY dict |
| Job listings | backend/job_matcher.py | INTERNAL_JOB_DATASET list |
| Learning resources | backend/main.py | LEARNING_RESOURCES dict |
| Similarity weights | backend/ml_engine.py | SIMILARITY_WEIGHTS dict |
| Database | backend/.env | DATABASE_URL |
