"""
CareerIQ Pro — Salary Model Training Pipeline
Replace synthetic data with real datasets from Kaggle / Adzuna / LinkedIn.

DATASETS TO USE:
  1. Kaggle DS/ML Salary Survey: https://www.kaggle.com/datasets/ruchi798/data-science-job-salaries
  2. Levels.fyi dataset:         https://www.levels.fyi/js/salaryData.json
  3. Stack Overflow Survey:      https://survey.stackoverflow.co/
  4. Adzuna API job listings

HOW TO RUN:
  pip install scikit-learn pandas numpy joblib xgboost
  python train_salary_model.py --data kaggle_salaries.csv --output salary_model.pkl
"""

import argparse
import json
import math
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer


# ── Feature Engineering ────────────────────────────────────────────────────────

SKILL_LIST = [
    "python", "javascript", "java", "go", "rust", "scala", "typescript",
    "tensorflow", "pytorch", "keras", "scikit-learn", "mlops", "llm",
    "kubernetes", "docker", "aws", "gcp", "azure", "terraform",
    "spark", "kafka", "airflow", "dbt", "sql", "postgresql",
    "react", "fastapi", "flask", "django",
]

ROLE_MAP = {
    "software engineer": 0, "data scientist": 1, "ml engineer": 2,
    "data engineer": 3, "devops engineer": 4, "product manager": 5,
    "cloud architect": 6, "frontend developer": 7, "backend developer": 8,
    "full stack developer": 9, "sre": 10, "ai engineer": 11,
}

LOCATION_MAP = {
    "us": 1.00, "san francisco": 1.28, "new york": 1.18, "seattle": 1.12,
    "austin": 1.05, "london": 0.88, "uk": 0.85, "canada": 0.80,
    "germany": 0.78, "india": 0.22, "singapore": 0.92, "remote": 0.95,
}

EDU_MAP = {"none": 0, "high school": 1, "associate": 2, "bachelor": 3, "master": 4, "phd": 5}


def build_feature_vector(row: dict) -> np.ndarray:
    """
    Convert a raw salary record into a numeric feature vector.
    Features: [role_encoded, years_exp, location_factor, education_level,
               skill_1, skill_2, ..., skill_N, company_size, remote_flag]
    """
    role_key = str(row.get("job_title", "")).lower()
    role_idx = next((v for k, v in ROLE_MAP.items() if k in role_key), -1)

    years = min(float(row.get("experience_years", 0) or 0), 25)

    loc_raw = str(row.get("location", "us")).lower()
    loc_factor = next((v for k, v in LOCATION_MAP.items() if k in loc_raw), 0.85)

    edu_raw = str(row.get("education_level", "bachelor")).lower()
    edu_level = next((v for k, v in EDU_MAP.items() if k in edu_raw), 3)

    skills_raw = str(row.get("skills", "")).lower()
    skill_flags = [1.0 if s in skills_raw else 0.0 for s in SKILL_LIST]

    company_size = {"startup": 0, "small": 1, "medium": 2, "large": 3, "enterprise": 4}.get(
        str(row.get("company_size", "medium")).lower(), 2
    )
    remote_flag = 1.0 if str(row.get("remote", "")).lower() in ["yes", "true", "1", "remote"] else 0.0

    return np.array([role_idx, years, loc_factor, edu_level, *skill_flags, company_size, remote_flag])


# ── Dataset Loaders ────────────────────────────────────────────────────────────

def load_kaggle_dataset(filepath: str) -> pd.DataFrame:
    """
    Load Kaggle DS/ML Salary dataset.
    Download from: https://www.kaggle.com/datasets/ruchi798/data-science-job-salaries
    Expected columns: job_title, salary_in_usd, experience_level, company_location, ...
    """
    df = pd.read_csv(filepath)

    # Normalize column names
    df = df.rename(columns={
        "salary_in_usd": "salary",
        "job_title": "job_title",
        "experience_level": "experience_label",
        "company_location": "location",
        "employment_type": "employment_type",
        "company_size": "company_size",
        "remote_ratio": "remote",
    })

    # Map experience labels to years
    exp_map = {"EN": 1, "MI": 3, "SE": 7, "EX": 15}  # Entry/Mid/Senior/Expert
    df["experience_years"] = df["experience_label"].map(exp_map).fillna(3)
    df["education_level"] = "bachelor"  # Kaggle dataset doesn't include education
    df["skills"] = ""  # Kaggle dataset doesn't include skills

    # Filter: only USD salaries, reasonable range
    df = df[(df["salary"] >= 20_000) & (df["salary"] <= 800_000)]
    df = df[df["location"] == "US"]  # focus on US market

    print(f"Kaggle dataset loaded: {len(df)} records")
    return df[["job_title", "salary", "experience_years", "location", "education_level",
               "skills", "company_size", "remote"]]


def load_stackoverflow_dataset(filepath: str) -> pd.DataFrame:
    """
    Load Stack Overflow Annual Developer Survey.
    Download from: https://survey.stackoverflow.co/
    Expected: ConvertedCompYearly, DevType, YearsCodePro, Country, EdLevel, ...
    """
    df = pd.read_csv(filepath, low_memory=False)

    df = df.rename(columns={
        "ConvertedCompYearly": "salary",
        "DevType": "job_title",
        "YearsCodePro": "experience_years",
        "Country": "location",
        "EdLevel": "education_level",
    })

    # Clean up
    df["salary"] = pd.to_numeric(df["salary"], errors="coerce")
    df["experience_years"] = pd.to_numeric(df["experience_years"], errors="coerce")
    df = df.dropna(subset=["salary", "experience_years"])
    df = df[(df["salary"] > 15_000) & (df["salary"] < 600_000)]
    df = df[df["location"] == "United States"]

    df["skills"] = ""
    df["company_size"] = "medium"
    df["remote"] = "no"

    print(f"Stack Overflow dataset loaded: {len(df)} records")
    return df[["job_title", "salary", "experience_years", "location", "education_level",
               "skills", "company_size", "remote"]]


def load_levels_fyi_dataset(filepath: str) -> pd.DataFrame:
    """
    Load Levels.fyi dataset (tech company compensation).
    Download from: https://www.levels.fyi/js/salaryData.json
    or use their public API.
    """
    with open(filepath) as f:
        data = json.load(f)

    records = []
    for row in data:
        total = float(row.get("totalyearlycompensation", 0) or 0)
        if total < 50_000 or total > 2_000_000:
            continue
        records.append({
            "job_title": row.get("title", "Software Engineer"),
            "salary": total,
            "experience_years": float(row.get("yearsofexperience", 3) or 3),
            "location": row.get("location", "United States"),
            "education_level": row.get("Masters_Degree", "") and "master" or "bachelor",
            "skills": "",
            "company_size": "large",  # Levels.fyi = big tech
            "remote": "no",
        })

    df = pd.DataFrame(records)
    print(f"Levels.fyi dataset loaded: {len(df)} records")
    return df


def create_synthetic_dataset(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generate a synthetic training dataset based on market research.
    Use ONLY if you cannot access real datasets.
    """
    np.random.seed(42)
    records = []

    roles = list(ROLE_MAP.keys())
    locations = ["us", "san francisco", "new york", "seattle", "austin", "remote", "london"]
    educations = ["bachelor", "master", "phd", "associate"]
    company_sizes = ["startup", "small", "medium", "large", "enterprise"]

    BASE_SALARIES = {
        "software engineer": 105000, "data scientist": 118000, "ml engineer": 132000,
        "data engineer": 112000, "devops engineer": 110000, "product manager": 125000,
        "cloud architect": 145000, "frontend developer": 98000, "backend developer": 108000,
        "full stack developer": 106000, "sre": 120000, "ai engineer": 138000,
    }
    HIGH_VALUE_SKILLS = [
        "kubernetes", "tensorflow", "pytorch", "mlops", "aws", "kafka", "spark", "llm"
    ]

    for _ in range(n_samples):
        role = np.random.choice(roles)
        base = BASE_SALARIES.get(role, 95000)
        exp = np.random.randint(0, 20)
        loc = np.random.choice(locations, p=[0.35, 0.15, 0.15, 0.10, 0.05, 0.10, 0.10])
        edu = np.random.choice(educations, p=[0.55, 0.30, 0.10, 0.05])
        num_skills = np.random.randint(2, 10)
        skills = np.random.choice(SKILL_LIST, size=num_skills, replace=False).tolist()
        hv_count = sum(1 for s in skills if s in HIGH_VALUE_SKILLS)
        comp_size = np.random.choice(company_sizes)
        remote = np.random.choice(["yes", "no"], p=[0.35, 0.65])

        loc_factor = LOCATION_MAP.get(loc, 0.85)
        edu_factor = {"none": 0.88, "associate": 0.92, "bachelor": 1.00, "master": 1.06, "phd": 1.12}[edu]
        exp_mult = 1 + min(exp, 15) * 0.045 + max(0, exp - 15) * 0.015
        skill_bonus = min(hv_count * 15000, 80000)
        size_mult = {"startup": 0.92, "small": 0.95, "medium": 1.00, "large": 1.10, "enterprise": 1.15}[comp_size]

        salary = (base * exp_mult + skill_bonus) * loc_factor * edu_factor * size_mult
        salary = max(25000, salary + np.random.normal(0, salary * 0.08))

        records.append({
            "job_title": role, "salary": salary, "experience_years": exp,
            "location": loc, "education_level": edu, "skills": " ".join(skills),
            "company_size": comp_size, "remote": remote,
        })

    df = pd.DataFrame(records)
    print(f"Synthetic dataset generated: {len(df)} records")
    return df


# ── Model Training ─────────────────────────────────────────────────────────────

def train_model(df: pd.DataFrame, output_path: str = "salary_model.pkl"):
    """
    Train a Gradient Boosting salary regression model.
    Saves model, scaler, and metadata to output_path.
    """
    print(f"\nTraining on {len(df)} records...")

    # Build feature matrix
    X = np.array([build_feature_vector(row) for row in df.to_dict("records")])
    y = df["salary"].values

    # Remove rows with NaN features
    valid_mask = ~np.isnan(X).any(axis=1)
    X, y = X[valid_mask], y[valid_mask]
    print(f"Valid samples after cleaning: {len(X)}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Pipeline: impute → scale → model
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", GradientBoostingRegressor(
            n_estimators=300, max_depth=5, learning_rate=0.08,
            subsample=0.8, random_state=42, verbose=1,
        )),
    ])

    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = math.sqrt(mean_squared_error(y_test, y_pred))
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="neg_mean_absolute_error")

    print(f"\n{'='*50}")
    print(f"Test MAE:         ${mae:,.0f}")
    print(f"Test RMSE:        ${rmse:,.0f}")
    print(f"CV MAE (5-fold):  ${-cv_scores.mean():,.0f} ± ${cv_scores.std():,.0f}")
    print(f"{'='*50}")

    # Feature importance
    model = pipeline.named_steps["model"]
    feature_names = ["role", "years_exp", "location_factor", "education"] + SKILL_LIST + ["company_size", "remote"]
    importances = sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1])
    print("\nTop 10 Feature Importances:")
    for name, imp in importances[:10]:
        print(f"  {name:<30} {imp:.4f}")

    # Save model + metadata
    artifact = {
        "pipeline": pipeline,
        "feature_names": feature_names,
        "skill_list": SKILL_LIST,
        "metrics": {"mae": mae, "rmse": rmse, "cv_mae": float(-cv_scores.mean())},
        "n_training_samples": len(X_train),
        "version": "1.0.0",
    }
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)
    print(f"\nModel saved to: {output_path}")
    return artifact


# ── Inference ──────────────────────────────────────────────────────────────────

def predict_salary(model_path: str, role: str, years_exp: int,
                   skills: list, location: str = "US", education: str = "bachelor") -> dict:
    """Load trained model and make a salary prediction."""
    with open(model_path, "rb") as f:
        artifact = pickle.load(f)

    pipeline = artifact["pipeline"]
    row = {
        "job_title": role, "experience_years": years_exp,
        "location": location, "education_level": education,
        "skills": " ".join(skills), "company_size": "medium", "remote": "no",
    }
    X = build_feature_vector(row).reshape(1, -1)
    pred = pipeline.predict(X)[0]

    return {
        "estimated_salary": round(pred, 0),
        "low_range": round(pred * 0.85, 0),
        "high_range": round(pred * 1.18, 0),
        "confidence": 0.82,
        "model_version": artifact.get("version"),
        "training_samples": artifact.get("n_training_samples"),
        "mae": artifact["metrics"]["mae"],
    }


# ── CLI Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CareerIQ Salary Model")
    parser.add_argument("--data", type=str, help="Path to CSV dataset (Kaggle/StackOverflow)")
    parser.add_argument("--data-format", choices=["kaggle", "stackoverflow", "levels", "synthetic"],
                        default="synthetic", help="Dataset format")
    parser.add_argument("--output", type=str, default="salary_model.pkl", help="Output model path")
    parser.add_argument("--samples", type=int, default=5000, help="Synthetic samples to generate")
    args = parser.parse_args()

    if args.data_format == "kaggle" and args.data:
        df = load_kaggle_dataset(args.data)
    elif args.data_format == "stackoverflow" and args.data:
        df = load_stackoverflow_dataset(args.data)
    elif args.data_format == "levels" and args.data:
        df = load_levels_fyi_dataset(args.data)
    else:
        print("No dataset provided — using synthetic data for demonstration.")
        print("For real results, download a dataset and use --data flag.")
        df = create_synthetic_dataset(args.samples)

    artifact = train_model(df, args.output)

    # Quick test
    result = predict_salary(
        args.output, "machine learning engineer", 5,
        ["Python", "TensorFlow", "MLOps", "Kubernetes"], "US", "master"
    )
    print(f"\nSample prediction for ML Engineer (5y, Master):")
    print(f"  Estimated: ${result['estimated_salary']:,.0f}")
    print(f"  Range:     ${result['low_range']:,.0f} - ${result['high_range']:,.0f}")
    print(f"  MAE:       ${result['mae']:,.0f}")
