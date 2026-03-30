"""
CareerIQ Pro — Job Matching Model Training
Trains a TF-IDF + cosine similarity model for semantic resume-job matching.

REAL DATASETS TO USE:
  1. Kaggle Resume Dataset:  https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset
  2. Kaggle Job Postings:    https://www.kaggle.com/datasets/arshkon/linkedin-job-postings
  3. Adzuna API:             https://api.adzuna.com (live job listings)
  4. EMSI Burning Glass:     https://www.economicmodeling.com (paid, academic access)

HOW TO RUN:
  pip install scikit-learn pandas scipy joblib
  python train_job_matcher.py --resumes resume_dataset.csv --jobs job_postings.csv
"""

import argparse
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split


# ── Precision/Recall Evaluation ───────────────────────────────────────────────

def evaluate_matching(model_path: str, test_pairs: list, top_k: int = 10) -> dict:
    """
    Evaluate job matching precision and recall.
    test_pairs: list of (resume_text, relevant_job_ids) tuples.
    """
    with open(model_path, "rb") as f:
        artifact = pickle.load(f)

    vectorizer = artifact["vectorizer"]
    job_vectors = artifact["job_vectors"]
    job_ids = artifact["job_ids"]

    precisions, recalls = [], []

    for resume_text, relevant_ids in test_pairs:
        resume_vec = vectorizer.transform([resume_text])
        similarities = cosine_similarity(resume_vec, job_vectors)[0]
        top_indices = np.argsort(similarities)[::-1][:top_k]
        retrieved_ids = [job_ids[i] for i in top_indices]

        hits = len(set(retrieved_ids) & set(relevant_ids))
        precision = hits / top_k
        recall = hits / len(relevant_ids) if relevant_ids else 0

        precisions.append(precision)
        recalls.append(recall)

    return {
        f"precision_at_{top_k}": round(np.mean(precisions), 4),
        f"recall_at_{top_k}": round(np.mean(recalls), 4),
        "f1_score": round(2 * np.mean(precisions) * np.mean(recalls)
                          / max(np.mean(precisions) + np.mean(recalls), 1e-8), 4),
    }


def build_tfidf_matcher(jobs_df: pd.DataFrame, output_path: str = "job_matcher.pkl"):
    """
    Build TF-IDF job matching model.
    jobs_df must have columns: id, title, description, required_skills
    """
    print(f"Building TF-IDF matcher from {len(jobs_df)} job listings...")

    # Combine job text features
    job_texts = (
        jobs_df["title"].fillna("") + " " +
        jobs_df.get("required_skills", pd.Series([""] * len(jobs_df))).fillna("") + " " +
        jobs_df["description"].fillna("")
    ).tolist()

    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=2,
        sublinear_tf=True,
    )

    job_vectors = vectorizer.fit_transform(job_texts)

    artifact = {
        "vectorizer": vectorizer,
        "job_vectors": job_vectors,
        "job_ids": jobs_df["id"].tolist(),
        "jobs_df": jobs_df,
        "n_jobs": len(jobs_df),
    }

    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)

    print(f"Job matcher saved: {output_path}")
    print(f"  Vocabulary size: {len(vectorizer.vocabulary_):,}")
    print(f"  Job vectors shape: {job_vectors.shape}")
    return artifact


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", type=str, help="Path to jobs CSV")
    parser.add_argument("--output", type=str, default="job_matcher.pkl")
    args = parser.parse_args()

    if args.jobs:
        df = pd.read_csv(args.jobs)
        # Ensure required columns exist
        if "id" not in df.columns:
            df["id"] = [str(i) for i in range(len(df))]
        build_tfidf_matcher(df, args.output)
    else:
        print("Usage: python train_job_matcher.py --jobs job_postings.csv")
        print("Download dataset from: https://www.kaggle.com/datasets/arshkon/linkedin-job-postings")
