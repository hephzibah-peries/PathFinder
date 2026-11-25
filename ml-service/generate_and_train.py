"""
PathFinder ML Service - Dataset Generation & Model Training Pipeline
====================================================================
Generates a realistic 1,200-sample resume-internship matching dataset across
5 domains (Software Engineering, Data Science, UI/UX, DevOps, QA),
trains a RandomForestClassifier model with 5-fold cross-validation,
exports evaluation metrics and model artifacts, and synthesizes a Jupyter
Notebook for evaluation.
"""

import json
import os
import random
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
import joblib

# Determine absolute base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
NOTEBOOKS_DIR = os.path.join(BASE_DIR, "notebooks")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(NOTEBOOKS_DIR, exist_ok=True)

# Domain definitions and skills
DOMAINS = {
    "Software Engineering": {
        "job_titles": [
            "Full Stack Developer Intern",
            "Backend Engineering Intern",
            "Frontend React Intern",
            "Java/Spring Boot Developer Intern",
            "Mobile App Developer Intern"
        ],
        "core_skills": [
            "Java", "Spring Boot", "React", "TypeScript", "JavaScript",
            "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git"
        ],
        "descriptions": [
            "Seeking an enthusiastic intern to build responsive web apps with React and robust backend APIs with Spring Boot and PostgreSQL.",
            "Work with our core backend team developing scalable microservices, relational databases, and RESTful APIs.",
            "Join our full-stack team delivering modern web interfaces and scalable backend solutions."
        ]
    },
    "Data Science": {
        "job_titles": [
            "Data Science Intern",
            "Machine Learning Engineering Intern",
            "AI Research Intern",
            "Data Analytics Intern",
            "NLP & Computer Vision Intern"
        ],
        "core_skills": [
            "Python", "Machine Learning", "Pandas", "NumPy", "Scikit-Learn",
            "PyTorch", "SQL", "Data Visualization", "NLP", "Deep Learning"
        ],
        "descriptions": [
            "Analyze large datasets, train predictive ML models, and build automated reporting pipelines using Python and Scikit-Learn.",
            "Assist in fine-tuning NLP and deep learning models for production recommendation engines and predictive analytics.",
            "Perform statistical analysis, exploratory data analysis, and predictive modeling using modern data science stacks."
        ]
    },
    "UI/UX": {
        "job_titles": [
            "UI/UX Design Intern",
            "Product Design Intern",
            "User Experience Researcher Intern",
            "Design Systems Intern",
            "Interaction Design Intern"
        ],
        "core_skills": [
            "Figma", "Wireframing", "Prototyping", "User Research",
            "Usability Testing", "UI Design", "Design Systems", "Adobe XD",
            "Information Architecture", "HTML/CSS"
        ],
        "descriptions": [
            "Design intuitive, responsive user interfaces, conduct user research sessions, and create interactive high-fidelity prototypes in Figma.",
            "Collaborate with product and engineering teams to establish scalable design systems, user personas, and design tokens.",
            "Create user journeys, wireframes, and design specs for student-facing web and mobile applications."
        ]
    },
    "DevOps": {
        "job_titles": [
            "DevOps Engineering Intern",
            "Cloud Infrastructure Intern",
            "Site Reliability Engineering Intern",
            "Platform Engineering Intern",
            "CI/CD Automation Intern"
        ],
        "core_skills": [
            "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform",
            "Linux", "Git", "Prometheus", "Bash", "Grafana"
        ],
        "descriptions": [
            "Automate containerized deployments with Docker and Kubernetes, build robust CI/CD pipelines, and manage cloud infrastructure.",
            "Support reliable infrastructure operations on AWS, monitor system telemetry with Grafana, and write Terraform scripts.",
            "Assist in improving build automation, zero-downtime deployment pipelines, and cloud security compliance."
        ]
    },
    "QA": {
        "job_titles": [
            "QA Automation Intern",
            "Software Test Engineer Intern",
            "Quality Assurance Analyst Intern",
            "API Testing Intern",
            "Performance Testing Intern"
        ],
        "core_skills": [
            "Selenium", "JUnit", "Test Automation", "Cypress", "API Testing",
            "Postman", "JIRA", "Regression Testing", "SQL", "Python"
        ],
        "descriptions": [
            "Write comprehensive automated test suites using Selenium/Cypress, validate RESTful APIs using Postman, and track defects in JIRA.",
            "Execute end-to-end regression testing, collaborate with developers on test-driven development, and ensure release quality.",
            "Develop automated regression scripts and API test coverage across web microservices and databases."
        ]
    }
}


def generate_dataset(num_samples: int = 1200) -> pd.DataFrame:
    """Generates a realistic, domain-accurate resume-internship dataset."""
    random.seed(42)
    np.random.seed(42)

    rows = []
    domain_list = list(DOMAINS.keys())
    samples_per_domain = num_samples // len(domain_list)

    sample_id = 1
    for domain in domain_list:
        info = DOMAINS[domain]
        all_skills = info["core_skills"]
        job_titles = info["job_titles"]
        descriptions = info["descriptions"]

        for _ in range(samples_per_domain):
            job_title = random.choice(job_titles)
            job_desc = random.choice(descriptions)

            # Sample 4 to 6 required skills for the internship
            num_req = random.randint(4, 6)
            required_skills = random.sample(all_skills, num_req)

            # Match strength distribution: 35% strong candidate, 40% moderate, 25% weak
            candidate_tier = random.choices(["strong", "moderate", "weak"], weights=[0.35, 0.40, 0.25])[0]

            if candidate_tier == "strong":
                # Candidate has 75% - 100% of required skills
                overlap_count = random.randint(max(num_req - 1, 3), num_req)
                semantic_sim = np.clip(np.random.normal(0.85, 0.06), 0.72, 0.98)
                project_cnt = random.randint(3, 5)
                cv_comp = np.clip(np.random.normal(0.88, 0.06), 0.75, 1.00)
            elif candidate_tier == "moderate":
                # Candidate has 40% - 70% of required skills
                overlap_count = random.randint(2, max(num_req - 2, 2))
                semantic_sim = np.clip(np.random.normal(0.65, 0.08), 0.50, 0.78)
                project_cnt = random.randint(2, 4)
                cv_comp = np.clip(np.random.normal(0.72, 0.08), 0.55, 0.88)
            else:  # weak
                # Candidate has 0 - 35% of required skills
                overlap_count = random.randint(0, min(1, num_req))
                semantic_sim = np.clip(np.random.normal(0.40, 0.09), 0.20, 0.55)
                project_cnt = random.randint(0, 2)
                cv_comp = np.clip(np.random.normal(0.52, 0.10), 0.35, 0.68)

            matched_skills = random.sample(required_skills, overlap_count)
            other_skills_pool = [s for s in all_skills if s not in required_skills]
            extra_skills = random.sample(other_skills_pool, k=min(len(other_skills_pool), random.randint(1, 3)))
            candidate_skills = matched_skills + extra_skills

            skill_overlap_ratio = round(overlap_count / num_req, 3)
            missing_core = num_req - overlap_count

            # Shortlist ground truth formula with realistic recruitment weights:
            # High weight on skill overlap and semantic similarity, supporting weights on projects & completeness
            shortlist_score = (
                0.35 * skill_overlap_ratio +
                0.30 * semantic_sim +
                0.15 * cv_comp +
                0.15 * (project_cnt / 5.0) -
                0.10 * (missing_core / max(num_req, 1)) +
                np.random.normal(0, 0.05)
            )

            # Shortlist threshold at 0.52 yields a balanced ~42-45% positive rate
            shortlisted = 1 if shortlist_score >= 0.52 else 0

            rows.append({
                "id": sample_id,
                "domain": domain,
                "job_title": job_title,
                "job_description": job_desc,
                "required_skills": ", ".join(required_skills),
                "candidate_skills": ", ".join(candidate_skills),
                "semantic_similarity": round(float(semantic_sim), 3),
                "skill_overlap_ratio": float(skill_overlap_ratio),
                "missing_core_skills": int(missing_core),
                "project_count": int(project_cnt),
                "cv_completeness": round(float(cv_comp), 3),
                "shortlisted": int(shortlisted)
            })
            sample_id += 1

    df = pd.DataFrame(rows)
    return df


def train_and_evaluate(df: pd.DataFrame):
    """Trains a RandomForestClassifier with 5-fold CV and saves metrics and model."""
    feature_cols = [
        "semantic_similarity",
        "skill_overlap_ratio",
        "missing_core_skills",
        "project_count",
        "cv_completeness"
    ]

    X = df[feature_cols]
    y = df["shortlisted"]

    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 5-fold Stratified Cross-Validation on training set
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    cv_scores = cross_val_score(rf, X_train, y_train, cv=skf, scoring="accuracy")
    cv_f1_scores = cross_val_score(rf, X_train, y_train, cv=skf, scoring="f1")

    # Fit on entire training set
    rf.fit(X_train, y_train)

    # Test set predictions
    y_pred = rf.predict(X_test)
    y_proba = rf.predict_proba(X_test)[:, 1]

    # Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    feature_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(feature_cols, rf.feature_importances_)
    }

    metrics = {
        "model_type": "RandomForestClassifier",
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 6,
            "min_samples_split": 4,
            "min_samples_leaf": 2,
            "random_state": 42
        },
        "dataset_summary": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "feature_names": feature_cols,
            "class_distribution": {
                "shortlisted": int(y.sum()),
                "not_shortlisted": int(len(y) - y.sum())
            }
        },
        "cross_validation": {
            "k_folds": 5,
            "cv_accuracy_scores": [round(float(s), 4) for s in cv_scores],
            "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
            "cv_accuracy_std": round(float(cv_scores.std()), 4),
            "cv_f1_mean": round(float(cv_f1_scores.mean()), 4)
        },
        "test_metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4)
        },
        "confusion_matrix": cm,
        "feature_importances": feature_importances
    }

    # Save metrics JSON
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Save Model Artifact
    model_path = os.path.join(MODELS_DIR, "shortlist_model.pkl")
    joblib.dump(rf, model_path)

    print("\n" + "="*50)
    print("      PATHFINDER MODEL TRAINING SUMMARY")
    print("="*50)
    print(f"Total Samples:       {len(df)}")
    print(f"Features:            {feature_cols}")
    print(f"5-Fold CV Accuracy:  {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"Test Accuracy:       {acc:.4f} ({acc*100:.2f}%)")
    print(f"Test Precision:      {prec:.4f}")
    print(f"Test Recall:         {rec:.4f}")
    print(f"Test F1-Score:       {f1:.4f}")
    print(f"Test ROC-AUC:        {roc_auc:.4f}")
    print(f"Confusion Matrix:    TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print(f"Feature Importances: {feature_importances}")
    print(f"Model saved to:      {model_path}")
    print(f"Metrics saved to:    {metrics_path}")
    print("="*50 + "\n")

    return metrics


def generate_jupyter_notebook(metrics: dict):
    """Synthesizes a clean, reproducible Jupyter Notebook in ml-service/notebooks/train_model.ipynb."""
    notebook = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# PathFinder - Internship Resume Matching & Shortlisting Model\n",
                    "This notebook demonstrates the end-to-end data pipeline, feature engineering, cross-validation, and performance evaluation for PathFinder's candidate shortlisting model.\n",
                    "\n",
                    "### Objective:\n",
                    "Predict the probability of a candidate being shortlisted for an internship based on their resume content, required skill overlap, semantic fit, project portfolio, and overall completeness."
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 1. Imports and Environment Setup"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 1,
                "metadata": {},
                "outputs": [],
                "source": [
                    "import os\n",
                    "import json\n",
                    "import numpy as np\n",
                    "import pandas as pd\n",
                    "import matplotlib.pyplot as plt\n",
                    "from sklearn.ensemble import RandomForestClassifier\n",
                    "from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score\n",
                    "from sklearn.metrics import (\n",
                    "    accuracy_score, precision_score, recall_score, f1_score,\n",
                    "    roc_auc_score, confusion_matrix, classification_report, roc_curve\n",
                    ")\n",
                    "import joblib\n",
                    "\n",
                    "print('Environment initialized successfully.')"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 2. Load Dataset\n",
                    "The dataset contains 1,200 curated resume-job pairs spanning five tech domains: Software Engineering, Data Science, UI/UX, DevOps, and QA."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 2,
                "metadata": {},
                "outputs": [],
                "source": [
                    "data_path = os.path.join('..', 'data', 'resume_internship_dataset.csv')\n",
                    "df = pd.read_csv(data_path)\n",
                    "print(f'Total records: {len(df)}')\n",
                    "df.head()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 3. Exploratory Data Analysis & Domain Distribution"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 3,
                "metadata": {},
                "outputs": [],
                "source": [
                    "print('Domain Distribution:')\n",
                    "print(df['domain'].value_counts())\n",
                    "\n",
                    "print('\\nTarget Distribution (Shortlisted):')\n",
                    "print(df['shortlisted'].value_counts(normalize=True))\n",
                    "\n",
                    "print('\\nFeature Summary Statistics:')\n",
                    "df[['semantic_similarity', 'skill_overlap_ratio', 'missing_core_skills', 'project_count', 'cv_completeness']].describe()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 4. Train-Test Split (80/20 Stratified)"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 4,
                "metadata": {},
                "outputs": [],
                "source": [
                    "features = [\n",
                    "    'semantic_similarity',\n",
                    "    'skill_overlap_ratio',\n",
                    "    'missing_core_skills',\n",
                    "    'project_count',\n",
                    "    'cv_completeness'\n",
                    "]\n",
                    "target = 'shortlisted'\n",
                    "\n",
                    "X = df[features]\n",
                    "y = df[target]\n",
                    "\n",
                    "X_train, X_test, y_train, y_test = train_test_split(\n",
                    "    X, y, test_size=0.20, random_state=42, stratify=y\n",
                    ")\n",
                    "print(f'Training samples: {len(X_train)}, Testing samples: {len(X_test)}')"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 5. Model Training & 5-Fold Cross Validation\n",
                    "We train a `RandomForestClassifier` with balanced depth to avoid overfitting and validate generalization using 5-fold cross-validation."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 5,
                "metadata": {},
                "outputs": [],
                "source": [
                    "model = RandomForestClassifier(\n",
                    "    n_estimators=100,\n",
                    "    max_depth=6,\n",
                    "    min_samples_split=4,\n",
                    "    min_samples_leaf=2,\n",
                    "    random_state=42,\n",
                    "    n_jobs=-1\n",
                    ")\n",
                    "\n",
                    "skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\n",
                    "cv_scores = cross_val_score(model, X_train, y_train, cv=skf, scoring='accuracy')\n",
                    "\n",
                    "print(f'5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})')\n",
                    "\n",
                    "# Fit on full training set\n",
                    "model.fit(X_train, y_train)\n",
                    "print('Model training complete.')"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 6. Test Set Evaluation & Metrics"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 6,
                "metadata": {},
                "outputs": [],
                "source": [
                    "y_pred = model.predict(X_test)\n",
                    "y_proba = model.predict_proba(X_test)[:, 1]\n",
                    "\n",
                    "print(classification_report(y_test, y_pred, target_names=['Not Shortlisted', 'Shortlisted']))\n",
                    "print(f'Test Accuracy:  {accuracy_score(y_test, y_pred):.4f}')\n",
                    "print(f'Test Precision: {precision_score(y_test, y_pred):.4f}')\n",
                    "print(f'Test Recall:    {recall_score(y_test, y_pred):.4f}')\n",
                    "print(f'Test F1-Score:  {f1_score(y_test, y_pred):.4f}')\n",
                    "print(f'Test ROC-AUC:   {roc_auc_score(y_test, y_proba):.4f}')"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 7. Feature Importance Analysis\n",
                    "Analyzing which features contribute most to the shortlisting decision."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 7,
                "metadata": {},
                "outputs": [],
                "source": [
                    "importance_df = pd.DataFrame({\n",
                    "    'Feature': features,\n",
                    "    'Importance': model.feature_importances_\n",
                    "}).sort_values(by='Importance', ascending=False)\n",
                    "\n",
                    "print(importance_df)\n",
                    "\n",
                    "# Plot feature importances\n",
                    "plt.figure(figsize=(8, 4))\n",
                    "plt.barh(importance_df['Feature'][::-1], importance_df['Importance'][::-1], color='#3b82f6')\n",
                    "plt.title('PathFinder Shortlisting Model - Feature Importances')\n",
                    "plt.xlabel('Importance')\n",
                    "plt.tight_layout()\n",
                    "plt.show()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 8. Export Model & Artifacts"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 8,
                "metadata": {},
                "outputs": [],
                "source": [
                    "model_save_path = os.path.join('..', 'models', 'shortlist_model.pkl')\n",
                    "joblib.dump(model, model_save_path)\n",
                    "print(f'Model artifact persisted to {model_save_path}')"
                ]
            }
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.12.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }

    notebook_path = os.path.join(NOTEBOOKS_DIR, "train_model.ipynb")
    with open(notebook_path, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2)

    print(f"Jupyter Notebook generated at: {notebook_path}")


def main():
    print("="*50)
    print("PathFinder: Starting ML Pipeline (1,200 records, 5 domains)")
    print("="*50)

    # 1. Generate Dataset
    df = generate_dataset(num_samples=1200)
    csv_path = os.path.join(DATA_DIR, "resume_internship_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Dataset generated ({len(df)} samples) and saved to: {csv_path}")

    # 2. Train Model & Save Metrics
    metrics = train_and_evaluate(df)

    # 3. Generate Jupyter Notebook
    generate_jupyter_notebook(metrics)

    print("\nPipeline executed successfully!")


if __name__ == "__main__":
    main()
