# Software Design Document (SDD) — PathFinder

## 1. System Overview
PathFinder is an intelligent career and internship matching system designed to connect students with relevant industrial internships by analyzing skills, academic backgrounds, projects, and CVs using an AI/ML pipeline.

---

## 2. Architectural Design
The system follows a decoupled monorepo architecture consisting of three core tiers:
* **Frontend Client (`frontend/`)**: Built with React / Next.js and Tailwind CSS. Provides role-based portals for students and recruiters.
* **Backend API (`backend/`)**: Built with Java and Spring Boot 3.x. Handles business logic, stateless JWT authentication, role authorization, and database persistence.
* **Machine Learning Service (`ml-service/`)**: Built with Python and FastAPI. Responsible for CV skill extraction (NLP) and compatibility match score calculation.
* **Database Layer**: Cloud PostgreSQL instance managed via Supabase.

```text
[ React / Next.js Client ]
            │ (REST / HTTPS)
            ▼
[ Spring Boot Backend (Port 8080) ] ◄───► [ PostgreSQL (Supabase) ]
            │ (Internal REST)
            ▼
[ FastAPI ML Service (Port 8000) ]