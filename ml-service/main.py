"""
PathFinder ML Service - FastAPI Matching & Shortlist Prediction Server
======================================================================
Serves real-time resume-internship semantic similarity and ML shortlisting
predictions using all-MiniLM-L6-v2 embeddings and a trained Random Forest classifier.
"""

from contextlib import asynccontextmanager
import logging
import os
import re
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pathfinder-ml")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "shortlist_model.pkl")

# Global model and embedding references
model = None
embedder = None
embedder_error = None


def load_ml_artifacts():
    """Loads the trained Random Forest model and the SentenceTransformer embedder."""
    global model, embedder, embedder_error

    # 1. Load Trained Classifier
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            logger.info("Successfully loaded Random Forest shortlist model from: %s", MODEL_PATH)
        except Exception as e:
            logger.error("Failed to load shortlist model: %s", e)
    else:
        logger.warning("Shortlist model not found at %s. Please run generate_and_train.py first.", MODEL_PATH)

    # 2. Load Sentence Transformer
    try:
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Successfully loaded SentenceTransformer ('all-MiniLM-L6-v2') on device: %s", embedder.device)
    except Exception as e:
        embedder_error = str(e)
        logger.warning("Could not load SentenceTransformer ('all-MiniLM-L6-v2'): %s. Using fallback token similarity.", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for startup and shutdown events."""
    logger.info("Initializing PathFinder ML Matching Service...")
    load_ml_artifacts()
    yield
    logger.info("Shutting down PathFinder ML Matching Service.")


app = FastAPI(
    title="PathFinder ML Matching Service",
    description="Standalone ML inference microservice for semantic CV-job matching and applicant shortlisting.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local and cloud frontends/backends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request and Response Models
class MatchRequest(BaseModel):
    cvText: str = Field(..., description="Full text or summary extracted from candidate's resume/CV")
    jobTitle: Optional[str] = Field("", description="Title of the internship position")
    jobDescription: Optional[str] = Field("", description="Full text of the internship job description")
    requiredSkills: Optional[List[str]] = Field(default_factory=list, description="List of required core technical skills")


class FeatureBreakdown(BaseModel):
    semanticSimilarity: float
    skillOverlapRatio: float
    missingCoreSkills: int
    projectCount: int
    cvCompleteness: float


class MatchResponse(BaseModel):
    shortlistProbability: float = Field(..., description="Predicted shortlist probability (0.0 to 100.0%)")
    semanticScore: float = Field(..., description="Semantic alignment score (0.0 to 100.0%)")
    fitCategory: str = Field(..., description="'Strong Fit', 'Moderate Fit', or 'Low Fit'")
    features: FeatureBreakdown
    matchedSkills: List[str]
    missingSkills: List[str]
    topFactors: List[str]


def compute_semantic_similarity(text1: str, text2: str) -> float:
    """Computes cosine similarity between two texts using SentenceTransformer or fallback token similarity."""
    global embedder

    if not text1.strip() or not text2.strip():
        return 0.35

    if embedder is not None:
        try:
            embeddings = embedder.encode([text1, text2], convert_to_numpy=True, normalize_embeddings=True)
            cos_sim = float(np.dot(embeddings[0], embeddings[1]))
            # Rescale slightly from [-1, 1] to [0, 1]
            return float(np.clip((cos_sim + 1.0) / 2.0, 0.0, 1.0))
        except Exception as e:
            logger.warning("Embedder calculation failed, using token fallback: %s", e)

    # Fallback Jaccard/Token similarity
    words1 = set(re.findall(r"\w+", text1.lower()))
    words2 = set(re.findall(r"\w+", text2.lower()))
    if not words1 or not words2:
        return 0.40
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    jaccard = intersection / union if union > 0 else 0.4
    return float(np.clip(0.35 + jaccard * 1.5, 0.2, 0.95))


def extract_features(request: MatchRequest):
    """Extracts the 5 model features from CV text and internship requirements."""
    cv_lower = request.cvText.lower()

    # 1. Semantic Similarity
    job_full = f"{request.jobTitle}\n{request.jobDescription}".strip()
    semantic_sim = compute_semantic_similarity(request.cvText, job_full)

    # 2. Skill Overlap & Missing Skills
    matched_skills = []
    missing_skills = []
    required = request.requiredSkills or []

    for skill in required:
        skill_clean = skill.strip()
        if not skill_clean:
            continue
        # Use regex pattern to avoid partial word substring bugs (e.g. "C" matching "CSS")
        pattern = r"\b" + re.escape(skill_clean.lower()) + r"\b"
        if re.search(pattern, cv_lower):
            matched_skills.append(skill_clean)
        else:
            missing_skills.append(skill_clean)

    if required:
        skill_overlap = len(matched_skills) / len(required)
        missing_count = len(missing_skills)
    else:
        # If no skills explicitly specified, infer from semantic similarity
        skill_overlap = min(0.9, max(0.4, semantic_sim))
        missing_count = 1 if skill_overlap < 0.6 else 0

    # 3. Project Count Estimation
    # Look for common project header patterns and bullet indicators
    project_indicators = len(re.findall(r"\b(project|projects|github|developed|built|implemented|created)\b", cv_lower))
    if project_indicators >= 8:
        project_count = 4
    elif project_indicators >= 5:
        project_count = 3
    elif project_indicators >= 2:
        project_count = 2
    elif project_indicators >= 1:
        project_count = 1
    else:
        project_count = 0

    # 4. CV Completeness Score (0.0 - 1.0)
    score = 0.20  # Base
    if re.search(r"\b(education|university|college|degree|bachelor|gpa)\b", cv_lower):
        score += 0.20
    if re.search(r"\b(experience|work|intern|internship|employment)\b", cv_lower):
        score += 0.25
    if re.search(r"\b(skills|technologies|proficiencies|languages)\b", cv_lower):
        score += 0.20
    if re.search(r"\b(projects|portfolio|achievements|certifications)\b", cv_lower):
        score += 0.15
    cv_completeness = float(np.clip(score, 0.35, 1.0))

    features = {
        "semantic_similarity": round(float(semantic_sim), 3),
        "skill_overlap_ratio": round(float(skill_overlap), 3),
        "missing_core_skills": int(missing_count),
        "project_count": int(project_count),
        "cv_completeness": round(float(cv_completeness), 3)
    }

    return features, matched_skills, missing_skills


def explain_factors(features: dict, matched: list, missing: list, total_req: int) -> list:
    """Generates explainable rationale statements for the candidate and recruiter."""
    factors = []

    # Skill match explanation
    if total_req > 0:
        match_pct = int(features["skill_overlap_ratio"] * 100)
        factors.append(f"Matched {len(matched)} of {total_req} required skills ({match_pct}%)")
        if missing:
            factors.append(f"Missing core skills: {', '.join(missing[:3])}")
    else:
        factors.append("No explicit skill constraints required by internship posting")

    # Semantic fit explanation
    sem_pct = int(features["semantic_similarity"] * 100)
    if sem_pct >= 80:
        factors.append(f"Strong semantic alignment with role description ({sem_pct}%)")
    elif sem_pct >= 60:
        factors.append(f"Moderate contextual alignment with job expectations ({sem_pct}%)")
    else:
        factors.append(f"Limited contextual overlap with internship requirements ({sem_pct}%)")

    # Projects & completeness
    proj_cnt = features["project_count"]
    if proj_cnt >= 3:
        factors.append(f"Solid practical experience with {proj_cnt}+ documented projects")
    elif proj_cnt >= 1:
        factors.append(f"Documented {proj_cnt} practical software projects")
    else:
        factors.append("Opportunity to highlight more relevant hands-on projects")

    if features["cv_completeness"] >= 0.85:
        factors.append("Comprehensive CV structure across education, experience, and skills")

    return factors[:4]


@app.get("/health")
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "PathFinder ML Matching Service",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "embedder_loaded": embedder is not None,
        "embedder_error": embedder_error
    }


@app.post("/predict-match", response_model=MatchResponse)
def predict_match(request: MatchRequest):
    """Predicts shortlist probability and fit category for a candidate CV against an internship."""
    global model

    if not request.cvText or not request.cvText.strip():
        raise HTTPException(status_code=400, detail="cvText cannot be empty.")

    features, matched_skills, missing_skills = extract_features(request)
    total_required = len(request.requiredSkills or [])

    # Feature vector matching training columns:
    # ['semantic_similarity', 'skill_overlap_ratio', 'missing_core_skills', 'project_count', 'cv_completeness']
    X_input = np.array([[
        features["semantic_similarity"],
        features["skill_overlap_ratio"],
        features["missing_core_skills"],
        features["project_count"],
        features["cv_completeness"]
    ]])

    if model is not None:
        try:
            probabilities = model.predict_proba(X_input)[0]
            prob = float(probabilities[1]) * 100.0
        except Exception as e:
            logger.error("Model prediction failed: %s. Using heuristic fallback.", e)
            prob = (
                features["skill_overlap_ratio"] * 45.0 +
                features["semantic_similarity"] * 35.0 +
                features["cv_completeness"] * 10.0 +
                (features["project_count"] / 5.0) * 10.0
            )
    else:
        # Heuristic fallback if model has not been trained yet
        prob = (
            features["skill_overlap_ratio"] * 45.0 +
            features["semantic_similarity"] * 35.0 +
            features["cv_completeness"] * 10.0 +
            (features["project_count"] / 5.0) * 10.0
        )

    prob = float(np.clip(prob, 5.0, 98.0))
    sem_score = round(features["semantic_similarity"] * 100.0, 1)
    shortlist_prob = round(prob, 1)

    # Determine fit category
    if shortlist_prob >= 75.0:
        fit_category = "Strong Fit"
    elif shortlist_prob >= 50.0:
        fit_category = "Moderate Fit"
    else:
        fit_category = "Low Fit"

    top_factors = explain_factors(features, matched_skills, missing_skills, total_required)

    return MatchResponse(
        shortlistProbability=shortlist_prob,
        semanticScore=sem_score,
        fitCategory=fit_category,
        features=FeatureBreakdown(
            semanticSimilarity=features["semantic_similarity"],
            skillOverlapRatio=features["skill_overlap_ratio"],
            missingCoreSkills=features["missing_core_skills"],
            projectCount=features["project_count"],
            cvCompleteness=features["cv_completeness"]
        ),
        matchedSkills=matched_skills,
        missingSkills=missing_skills,
        topFactors=top_factors
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info("Starting PathFinder ML server on port %d...", port)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
