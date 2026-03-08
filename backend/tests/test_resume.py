"""
Unit Tests — Resume Parsing & NLP Anonymization Module
Tests PII removal, skill extraction, experience inference, and ATS scoring.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from ml_engine import anonymize_text, extract_skills, extract_experience_years, parse_resume


SAMPLE_RESUME = """
John Smith
john.smith@gmail.com
+1 (415) 555-0123
https://github.com/johnsmith

Senior Software Engineer — 6 years of experience

Skills: Python, Docker, Kubernetes, AWS, PostgreSQL, React, TensorFlow

Experience:
2018–2024  TechCorp — Led migration to Kubernetes, reducing costs by 30%
            Built ML pipelines processing 10M events/day using Apache Spark
            Designed distributed systems serving 500K concurrent users

Education:
B.S. Computer Science — MIT, 2018
"""

MINIMAL_RESUME = "Python developer with 2 years experience. Skills: Python, SQL."


# ── PII Anonymization ─────────────────────────────────────────────────────────

class TestAnonymization:

    def test_email_removed(self):
        anon, _ = anonymize_text(SAMPLE_RESUME)
        assert "john.smith@gmail.com" not in anon
        assert "EMAIL REDACTED" in anon

    def test_phone_removed(self):
        anon, _ = anonymize_text(SAMPLE_RESUME)
        assert "555-0123" not in anon
        assert "PHONE REDACTED" in anon

    def test_url_removed(self):
        anon, _ = anonymize_text(SAMPLE_RESUME)
        assert "github.com/johnsmith" not in anon
        assert "URL REDACTED" in anon

    def test_name_removed(self):
        anon, _ = anonymize_text("Jane Doe is a software engineer")
        assert "Jane Doe" not in anon

    def test_pii_count_returned(self):
        _, removed = anonymize_text(SAMPLE_RESUME)
        assert len(removed) >= 3  # at least name, email, phone

    def test_safe_content_preserved(self):
        anon, _ = anonymize_text(SAMPLE_RESUME)
        assert "Python" in anon
        assert "Kubernetes" in anon
        assert "TensorFlow" in anon

    def test_ssn_removed(self):
        text = "SSN: 123-45-6789"
        anon, _ = anonymize_text(text)
        assert "123-45-6789" not in anon
        assert "SSN REDACTED" in anon

    def test_empty_text_safe(self):
        anon, removed = anonymize_text("")
        assert anon == ""
        assert removed == []


# ── Skill Extraction ──────────────────────────────────────────────────────────

class TestSkillExtraction:

    def test_python_detected(self):
        skills = extract_skills("Experienced Python developer")
        skill_names = [s["skill"].lower() for s in skills]
        assert "python" in skill_names

    def test_multiple_skills_detected(self):
        skills = extract_skills("Python, Docker, Kubernetes, TensorFlow, PostgreSQL")
        assert len(skills) >= 5

    def test_skill_category_assigned(self):
        skills = extract_skills("Python and TensorFlow experience")
        for s in skills:
            assert "category" in s
            assert s["category"] in ["languages", "ml_ai", "data", "devops_cloud",
                                     "frontend", "backend", "soft_technical"]

    def test_case_insensitive(self):
        skills_lower = extract_skills("python developer")
        skills_upper = extract_skills("PYTHON DEVELOPER")
        names_lower = [s["skill"].lower() for s in skills_lower]
        names_upper = [s["skill"].lower() for s in skills_upper]
        assert set(names_lower) == set(names_upper)

    def test_no_false_positives(self):
        skills = extract_skills("I enjoy hiking and cooking on weekends")
        # Should return empty or very few results
        assert len(skills) <= 1

    def test_compound_skills(self):
        # Test multi-word skills
        skills = extract_skills("Apache Spark experience required")
        skill_names = [s["skill"].lower() for s in skills]
        assert "apache spark" in skill_names or "spark" in skill_names


# ── Experience Extraction ─────────────────────────────────────────────────────

class TestExperienceExtraction:

    def test_explicit_years(self):
        years = extract_experience_years("5 years of experience in Python")
        assert years == 5

    def test_years_plus_notation(self):
        years = extract_experience_years("8+ years of experience")
        assert years == 8

    def test_date_range_inference(self):
        years = extract_experience_years("Worked at TechCorp from 2018 to 2024")
        assert years >= 5

    def test_no_experience_mention(self):
        years = extract_experience_years("Python developer skilled in ML")
        # Should return 0 or inferred minimum
        assert years >= 0

    def test_max_cap(self):
        # Sanity cap at 30 years
        years = extract_experience_years("2 years experience at company from 1980 to 2024")
        assert years <= 30


# ── Full Resume Parsing Pipeline ──────────────────────────────────────────────

class TestResumeParser:

    def test_basic_parse_success(self):
        result = parse_resume(SAMPLE_RESUME)
        assert "extracted_skills" in result
        assert "ats_score" in result
        assert "anonymized" in result

    def test_pii_anonymized_flag(self):
        result = parse_resume(SAMPLE_RESUME)
        assert result["anonymized"] is True

    def test_skills_extracted(self):
        result = parse_resume(SAMPLE_RESUME)
        assert len(result["extracted_skills"]) >= 5

    def test_ats_score_range(self):
        result = parse_resume(SAMPLE_RESUME)
        assert 0 <= result["ats_score"] <= 100

    def test_good_resume_scores_higher(self):
        good = parse_resume(SAMPLE_RESUME)
        bad = parse_resume(MINIMAL_RESUME)
        assert good["ats_score"] > bad["ats_score"]

    def test_metrics_detected(self):
        result = parse_resume(SAMPLE_RESUME)
        # Resume contains "30%", "10M", "500K"
        assert result["has_metrics"] is True

    def test_word_count_tracked(self):
        result = parse_resume(SAMPLE_RESUME)
        assert result["word_count"] > 0

    def test_education_inferred(self):
        result = parse_resume(SAMPLE_RESUME)
        assert result["education_level"] in ["phd", "master", "bachelor", "associate", "none"]

    def test_experience_years_inferred(self):
        result = parse_resume(SAMPLE_RESUME)
        assert result["estimated_experience_years"] >= 0

    def test_all_required_keys(self):
        result = parse_resume(MINIMAL_RESUME)
        required = ["anonymized_text", "pii_removed_count", "anonymized",
                    "extracted_skills", "skill_count", "estimated_experience_years",
                    "education_level", "word_count", "ats_score", "quality_score",
                    "has_metrics", "action_verb_count"]
        for key in required:
            assert key in result, f"Missing key: {key}"
