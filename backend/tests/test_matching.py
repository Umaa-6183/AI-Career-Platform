"""
Unit Tests — Explainable Similarity Scoring Engine
Tests the 4-factor weighted matching formula and advancement constraint.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from ml_engine import compute_similarity_score, analyze_skill_gap


SAMPLE_JOB = {
    "required_skills": ["Python", "TensorFlow", "MLOps", "Kubernetes"],
    "preferred_skills": ["JAX", "Distributed Training"],
    "experience_years_min": 3,
    "experience_years_max": 10,
    "salary_range": [160_000, 200_000],
}


# ── Similarity Scoring ────────────────────────────────────────────────────────

class TestSimilarityScoring:

    def test_perfect_skill_match(self):
        result = compute_similarity_score(
            user_skills=["Python", "TensorFlow", "MLOps", "Kubernetes", "JAX"],
            user_years=5,
            user_salary_norm=0.45,
            job=SAMPLE_JOB,
        )
        assert result["skill_overlap_pct"] > 90

    def test_zero_skill_match(self):
        result = compute_similarity_score(
            user_skills=["Excel", "PowerPoint", "Word"],
            user_years=5,
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        assert result["skill_overlap_pct"] == 0.0

    def test_advancement_constraint_enforced(self):
        # User salary norm (0.70) exceeds job mid salary norm (~0.55)
        # Job salary range $160K-$200K => mid $180K => L6 => norm ~0.55
        result = compute_similarity_score(
            user_skills=["Python", "TensorFlow"],
            user_years=5,
            user_salary_norm=0.70,  # higher than job
            job=SAMPLE_JOB,
        )
        assert result["advancement_guaranteed"] is False
        assert result["salary_compatibility"] < 50  # penalised

    def test_advancement_guaranteed_when_lower(self):
        result = compute_similarity_score(
            user_skills=["Python"],
            user_years=5,
            user_salary_norm=0.30,  # user is L3, job is L6
            job=SAMPLE_JOB,
        )
        assert result["advancement_guaranteed"] is True
        assert result["salary_compatibility"] == 100.0

    def test_composite_score_range(self):
        result = compute_similarity_score(
            user_skills=["Python", "TensorFlow"],
            user_years=5,
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        assert 0 <= result["composite_score"] <= 100

    def test_missing_skills_identified(self):
        result = compute_similarity_score(
            user_skills=["Python"],  # missing TensorFlow, MLOps, Kubernetes
            user_years=5,
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        assert "TensorFlow" in result["missing_skills"]
        assert "MLOps" in result["missing_skills"]

    def test_preferred_skills_count_as_partial(self):
        result_with_preferred = compute_similarity_score(
            user_skills=["Python", "TensorFlow", "MLOps", "Kubernetes", "JAX"],
            user_years=5,
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        result_without_preferred = compute_similarity_score(
            user_skills=["Python", "TensorFlow", "MLOps", "Kubernetes"],
            user_years=5,
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        assert result_with_preferred["skill_overlap_pct"] > result_without_preferred["skill_overlap_pct"]

    def test_output_keys_present(self):
        result = compute_similarity_score(["Python"], 5, 0.35, SAMPLE_JOB)
        required = ["composite_score", "skill_overlap_pct", "matched_required",
                    "matched_preferred", "missing_skills", "experience_relevance",
                    "industry_alignment", "salary_compatibility",
                    "advancement_guaranteed", "score_weights", "explainability"]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_weights_sum_to_one(self):
        result = compute_similarity_score(["Python"], 5, 0.35, SAMPLE_JOB)
        weights = result["score_weights"]
        total = sum(weights.values())
        assert total == pytest.approx(1.0, abs=0.001)

    def test_overqualified_experience_not_excluded(self):
        result = compute_similarity_score(
            user_skills=["Python", "TensorFlow", "MLOps", "Kubernetes"],
            user_years=25,  # significantly over max of 10
            user_salary_norm=0.35,
            job=SAMPLE_JOB,
        )
        # Overqualified but should still get a score, not be excluded
        assert result["composite_score"] > 0


# ── Skill Gap Analysis ────────────────────────────────────────────────────────

class TestSkillGapAnalysis:

    def test_basic_gap_analysis(self):
        result = analyze_skill_gap(
            current_skills=["Python", "SQL"],
            target_role="machine learning engineer"
        )
        assert "skills_have" in result
        assert "skills_missing" in result
        assert "skills_priority" in result

    def test_have_skills_correctly_classified(self):
        result = analyze_skill_gap(
            current_skills=["Python", "TensorFlow", "NumPy"],
            target_role="machine learning engineer"
        )
        have_lower = [s.lower() for s in result["skills_have"]]
        assert "python" in have_lower
        assert "tensorflow" in have_lower

    def test_match_score_range(self):
        result = analyze_skill_gap(["Python"], "software engineer")
        assert 0 <= result["match_score"] <= 100

    def test_full_match_score(self):
        ml_reqs = ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas",
                   "MLOps", "Kubernetes", "Docker", "Apache Spark"]
        result = analyze_skill_gap(ml_reqs, "machine learning engineer")
        assert result["match_score"] > 70

    def test_priority_skills_count(self):
        result = analyze_skill_gap([], "machine learning engineer")
        # Priority = top 4 missing core skills
        assert len(result["skills_priority"]) <= 4

    def test_salary_uplift_in_priority(self):
        result = analyze_skill_gap([], "machine learning engineer")
        for skill in result["skills_priority_detailed"]:
            assert skill["estimated_salary_impact"] > 0

    def test_unknown_role_falls_back(self):
        # Unknown role should fall back to software engineer
        result = analyze_skill_gap(["Python"], "quantum computing wizard")
        assert result["match_score"] is not None

    def test_completeness_label(self):
        strong = analyze_skill_gap(
            ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas",
             "MLOps", "Kubernetes", "Docker"],
            "machine learning engineer"
        )
        assert strong["completeness_level"] in ["Strong", "Moderate", "Needs Work"]
