"""
CareerIQ Pro — Database Seed Script
Populates the database with realistic sample data for development and testing.
Run: python seed_data.py
"""

import uuid
from datetime import datetime, timedelta
from database import SessionLocal, init_db, User, UserSkill, LearningResource, Job, ScoreHistory


def seed():
    init_db()
    db = SessionLocal()

    try:
        # ── Sample Users ────────────────────────────────────────────────────────
        users_data = [
            {
                "current_role": "Software Engineer", "target_role": "ML Engineer",
                "experience_years": 4, "current_salary": 88000, "salary_level": "L3",
                "salary_norm_score": 0.34, "location": "US", "name_alias": "Alex C.",
            },
            {
                "current_role": "Data Analyst", "target_role": "Data Scientist",
                "experience_years": 2, "current_salary": 65000, "salary_level": "L2",
                "salary_norm_score": 0.225, "location": "US", "name_alias": "Sam P.",
            },
            {
                "current_role": "DevOps Engineer", "target_role": "Cloud Architect",
                "experience_years": 6, "current_salary": 125000, "salary_level": "L5",
                "salary_norm_score": 0.412, "location": "San Francisco", "name_alias": "Jordan M.",
            },
        ]

        created_users = []
        for u in users_data:
            user = User(
                id=str(uuid.uuid4()),
                email_hash="sample_hash_" + str(uuid.uuid4())[:8],
                hashed_password="$2b$12$placeholder",
                **u
            )
            db.add(user)
            created_users.append(user)
        db.commit()

        # ── Sample Skills for first user ───────────────────────────────────────
        user = created_users[0]
        skills = [
            ("Python", "languages", "have", 85),
            ("Docker", "devops_cloud", "have", 70),
            ("Kubernetes", "devops_cloud", "have", 55),
            ("AWS", "devops_cloud", "have", 60),
            ("SQL", "data", "have", 80),
            ("React", "frontend", "have", 65),
            ("TensorFlow", "ml_ai", "missing", 0),
            ("MLOps", "ml_ai", "priority", 0),
            ("PyTorch", "ml_ai", "priority", 0),
        ]
        for skill_name, category, status, proficiency in skills:
            db.add(UserSkill(
                id=str(uuid.uuid4()), user_id=user.id,
                skill_name=skill_name, category=category,
                status=status, proficiency=proficiency,
                source="resume",
            ))

        # ── Sample Score History ───────────────────────────────────────────────
        for i in range(6):
            db.add(ScoreHistory(
                id=str(uuid.uuid4()), user_id=user.id,
                salary_score=30 + i * 2.5,
                job_match_score=55 + i * 3,
                skill_score=48 + i * 4,
                ats_score=62 + i * 3,
                skills_count=6 + i,
                jobs_matched=3 + i,
                recorded_at=datetime.utcnow() - timedelta(weeks=5 - i),
            ))

        # ── Sample Learning Resources ──────────────────────────────────────────
        resources = [
            {
                "title": "TensorFlow Developer Certificate",
                "platform": "Google", "resource_type": "certification",
                "url": "https://www.tensorflow.org/certificate",
                "skill_tags": ["TensorFlow", "Deep Learning", "ML"],
                "rating": 4.8, "review_count": 12400, "duration_hours": 60,
                "price_usd": 100, "is_free": False, "salary_uplift": 18000,
                "relevance_score": 0.95, "learning_score": 88.2,
            },
            {
                "title": "MLOps Specialization",
                "platform": "Coursera", "resource_type": "course",
                "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops",
                "skill_tags": ["MLOps", "Kubernetes", "CI/CD", "Model Serving"],
                "rating": 4.7, "review_count": 8900, "duration_hours": 80,
                "price_usd": 399, "is_free": False, "salary_uplift": 28000,
                "relevance_score": 0.98, "learning_score": 91.4,
            },
            {
                "title": "AWS Solutions Architect – Associate",
                "platform": "AWS", "resource_type": "certification",
                "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
                "skill_tags": ["AWS", "Cloud Architecture", "Infrastructure"],
                "rating": 4.6, "review_count": 45000, "duration_hours": 40,
                "price_usd": 300, "is_free": False, "salary_uplift": 22000,
                "relevance_score": 0.90, "learning_score": 85.6,
            },
            {
                "title": "Docker and Kubernetes: The Complete Guide",
                "platform": "Udemy", "resource_type": "course",
                "url": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/",
                "skill_tags": ["Docker", "Kubernetes", "DevOps"],
                "rating": 4.7, "review_count": 72000, "duration_hours": 22,
                "price_usd": 15, "is_free": False, "salary_uplift": 12000,
                "relevance_score": 0.85, "learning_score": 79.3,
            },
        ]
        for r in resources:
            db.add(LearningResource(id=str(uuid.uuid4()), **r))

        db.commit()
        print(f"✅ Seeded {len(created_users)} users, {len(skills)} skills, "
              f"6 score history entries, {len(resources)} learning resources")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
