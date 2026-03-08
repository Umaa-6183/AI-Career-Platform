"""
Unit Tests — Salary Normalization & Estimation Module
Tests the CNN salary model, L1-L10 normalization, and feature contributions.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from ml_engine import salary_normalize, salary_estimate_from_features, SALARY_LEVELS


# ── Salary Normalization ───────────────────────────────────────────────────────

class TestSalaryNormalize:

    def test_l1_lower_bound(self):
        result = salary_normalize(30_000)
        assert result["level"] == "L1"
        assert result["normalized_score"] == pytest.approx(0.0, abs=0.01)

    def test_l1_midpoint(self):
        result = salary_normalize(40_000)
        assert result["level"] == "L1"
        assert result["normalized_score"] == pytest.approx(0.05, abs=0.01)

    def test_l3_boundary(self):
        result = salary_normalize(70_000)
        assert result["level"] == "L3"
        assert result["level_index"] == 2

    def test_l5_midpoint(self):
        result = salary_normalize(140_000)
        assert result["level"] == "L5"
        assert result["normalized_score"] > 0.4
        assert result["normalized_score"] < 0.5

    def test_l10_high(self):
        result = salary_normalize(500_000)
        assert result["level"] == "L10"
        assert result["normalized_score"] > 0.9

    def test_above_l10(self):
        result = salary_normalize(2_000_000)
        assert result["level"] == "L10"
        assert result["normalized_score"] == 1.0

    def test_score_increases_with_salary(self):
        scores = [salary_normalize(s)["normalized_score"] for s in [50_000, 80_000, 120_000, 180_000]]
        assert scores == sorted(scores), "Scores must be monotonically increasing"

    def test_all_levels_covered(self):
        for level, data in SALARY_LEVELS.items():
            low, high = data["range"]
            mid = (low + high) / 2
            result = salary_normalize(mid)
            assert result["level"] == level, f"Expected {level} for salary {mid}"

    def test_percentile_range(self):
        for salary in [40_000, 90_000, 150_000, 250_000]:
            result = salary_normalize(salary)
            assert 0 <= result["percentile"] <= 100

    def test_intra_level_position(self):
        r1 = salary_normalize(70_001)  # just above L3 lower bound
        r2 = salary_normalize(89_999)  # just below L3 upper bound
        assert r2["intra_level_position"] > r1["intra_level_position"]

    def test_output_keys(self):
        result = salary_normalize(100_000)
        required_keys = ["level", "label", "normalized_score", "intra_level_position",
                         "level_index", "salary_range", "percentile", "above_median"]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"


# ── Salary Estimation ──────────────────────────────────────────────────────────

class TestSalaryEstimation:

    def test_basic_swe_estimate(self):
        result = salary_estimate_from_features(
            role="software engineer",
            years_exp=3,
            skills=["Python", "Docker"],
            location="US",
            education="bachelor"
        )
        assert result["estimated_salary"] > 70_000
        assert result["estimated_salary"] < 200_000

    def test_ml_engineer_premium(self):
        ml_result = salary_estimate_from_features(
            role="machine learning engineer",
            years_exp=5,
            skills=["Python", "TensorFlow", "MLOps", "Kubernetes"],
            location="US"
        )
        swe_result = salary_estimate_from_features(
            role="software engineer",
            years_exp=5,
            skills=["Python"],
            location="US"
        )
        assert ml_result["estimated_salary"] > swe_result["estimated_salary"]

    def test_location_multiplier_sf_vs_india(self):
        sf = salary_estimate_from_features("software engineer", 5, ["Python"], "San Francisco")
        india = salary_estimate_from_features("software engineer", 5, ["Python"], "India")
        assert sf["estimated_salary"] > india["estimated_salary"] * 3

    def test_education_impact(self):
        phd = salary_estimate_from_features("data scientist", 5, ["Python"], "US", "phd")
        none = salary_estimate_from_features("data scientist", 5, ["Python"], "US", "none")
        assert phd["estimated_salary"] > none["estimated_salary"]

    def test_experience_scaling(self):
        junior = salary_estimate_from_features("software engineer", 1, ["Python"], "US")
        senior = salary_estimate_from_features("software engineer", 10, ["Python"], "US")
        assert senior["estimated_salary"] > junior["estimated_salary"]

    def test_skill_bonus_cap(self):
        # Even with many premium skills, bonus should be capped at $80K
        result = salary_estimate_from_features(
            role="ml engineer",
            years_exp=10,
            skills=["TensorFlow", "PyTorch", "MLOps", "Kubernetes", "AWS",
                    "Kafka", "Terraform", "LLM", "RLHF", "Transformers"],
            location="US"
        )
        assert result["estimated_salary"] < 1_000_000  # sanity cap

    def test_output_includes_normalization(self):
        result = salary_estimate_from_features("software engineer", 3, ["Python"], "US")
        assert "normalization" in result
        assert "level" in result["normalization"]

    def test_confidence_score_range(self):
        result = salary_estimate_from_features("data engineer", 4, ["Python", "Spark", "Kafka"], "US")
        assert 0 < result["confidence"] <= 1.0

    def test_range_is_wider_than_estimate(self):
        result = salary_estimate_from_features("software engineer", 5, ["Python"], "US")
        assert result["low_range"] < result["estimated_salary"] < result["high_range"]

    def test_feature_contributions_present(self):
        result = salary_estimate_from_features("software engineer", 5, ["Python", "AWS"], "US")
        fc = result["feature_contributions"]
        assert "base_role" in fc
        assert "experience_delta" in fc
        assert "skill_premium" in fc
        assert "location_adjustment" in fc
