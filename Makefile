# CareerIQ Pro — Developer Convenience Makefile
# Usage: make <target>

.PHONY: help install dev backend frontend test lint clean docker seed

help:
	@echo ""
	@echo "  CareerIQ Pro — Available Commands"
	@echo "  =================================="
	@echo "  make install    Install all backend + frontend dependencies"
	@echo "  make dev        Start both backend and frontend (requires tmux or 2 terminals)"
	@echo "  make backend    Start FastAPI backend (port 8000)"
	@echo "  make frontend   Start React frontend (port 3000)"
	@echo "  make seed       Seed the SQLite dev database with test data"
	@echo "  make test       Run all backend unit tests"
	@echo "  make test-v     Run tests with verbose output"
	@echo "  make lint       Lint Python with flake8 and JS with eslint"
	@echo "  make docker     Start full stack via docker-compose"
	@echo "  make clean      Remove .pyc files, __pycache__, and node_modules"
	@echo "  make train      Train the salary model (synthetic data)"
	@echo "  make migrate    Run Alembic database migrations"
	@echo ""

# ─── Installation ─────────────────────────────────────────────────────────────

install: install-backend install-frontend
	@echo "✅ All dependencies installed"

install-backend:
	@echo "📦 Installing Python dependencies..."
	@cd backend && python -m venv venv 2>/dev/null || true
	@cd backend && . venv/bin/activate && pip install -r requirements.txt -q
	@echo "✅ Backend dependencies installed"

install-frontend:
	@echo "📦 Installing Node dependencies..."
	@cd frontend && npm install --silent
	@echo "✅ Frontend dependencies installed"

# ─── Development ──────────────────────────────────────────────────────────────

backend:
	@echo "🚀 Starting FastAPI on http://localhost:8000"
	@cd backend && . venv/bin/activate && uvicorn main:app --reload --port 8000

frontend:
	@echo "🚀 Starting React on http://localhost:3000"
	@cd frontend && npm start

seed:
	@echo "🌱 Seeding development database..."
	@cd backend && . venv/bin/activate && python seed_data.py

# ─── Testing ──────────────────────────────────────────────────────────────────

test:
	@echo "🧪 Running backend tests..."
	@cd backend && . venv/bin/activate && pytest tests/ -q

test-v:
	@echo "🧪 Running backend tests (verbose)..."
	@cd backend && . venv/bin/activate && pytest tests/ -v

test-coverage:
	@echo "🧪 Running tests with coverage report..."
	@cd backend && . venv/bin/activate && pytest tests/ --cov=. --cov-report=html -q
	@echo "📊 Coverage report: backend/htmlcov/index.html"

# ─── Linting ──────────────────────────────────────────────────────────────────

lint-backend:
	@cd backend && . venv/bin/activate && flake8 . --max-line-length=120 --exclude=venv,tests

lint-frontend:
	@cd frontend && npm run lint 2>/dev/null || echo "Run: npm install eslint"

lint: lint-backend lint-frontend

# ─── ML Training ──────────────────────────────────────────────────────────────

train:
	@echo "🤖 Training salary model (synthetic data — no download needed)..."
	@cd backend && . venv/bin/activate && python ml_training/train_salary_model.py \
		--data-format synthetic --samples 10000 --output salary_model.pkl
	@echo "✅ Model saved to backend/salary_model.pkl"

train-kaggle:
	@echo "🤖 Training salary model (Kaggle ds_salaries.csv)..."
	@cd backend && . venv/bin/activate && python ml_training/train_salary_model.py \
		--data data/ds_salaries.csv --data-format kaggle --output salary_model.pkl

# ─── Database Migrations ──────────────────────────────────────────────────────

migrate:
	@cd backend && . venv/bin/activate && alembic upgrade head

migration:
	@read -p "Migration name: " name; \
	cd backend && . venv/bin/activate && alembic revision --autogenerate -m "$$name"

# ─── Docker ───────────────────────────────────────────────────────────────────

docker:
	@echo "🐳 Starting full stack with docker-compose..."
	@docker-compose up -d
	@echo "✅ App running at http://localhost"
	@echo "   API docs at http://localhost/docs"

docker-down:
	@docker-compose down

docker-logs:
	@docker-compose logs -f

docker-rebuild:
	@docker-compose down && docker-compose up --build -d

# ─── Clean ────────────────────────────────────────────────────────────────────

clean:
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.db" -not -path "*/venv/*" -delete 2>/dev/null || true
	@rm -rf backend/htmlcov backend/.pytest_cache 2>/dev/null || true
	@echo "✅ Cleaned build artifacts"

clean-all: clean
	@rm -rf backend/venv frontend/node_modules frontend/build 2>/dev/null || true
	@echo "✅ Removed venv and node_modules (reinstall with make install)"

# ─── Utilities ────────────────────────────────────────────────────────────────

env:
	@cp -n .env.example .env 2>/dev/null && echo "✅ Created .env from template" || echo "ℹ️  .env already exists"
	@cp -n frontend/.env.example frontend/.env 2>/dev/null && echo "✅ Created frontend/.env" || true
