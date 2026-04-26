# SkillSense AI

AI-powered system that analyzes a candidate’s resume against a job description to identify matched skills, skill gaps, and generate a personalized learning plan.

---

## Overview

SkillSense AI extracts and normalizes skills from both resume and job description, compares them, and provides actionable insights including gaps, interview questions, and learning recommendations.

---

## Features

* Resume & Job Description analysis (text + PDF)
* Matched Skills vs Skill Gaps identification
* AI-generated interview questions
* Answer evaluation with feedback
* Personalized learning plan generation

---

## Tech Stack

**Frontend:** Next.js, React, Tailwind CSS
**Backend:** FastAPI, Python
**AI Integration:** OpenAI / OpenRouter
**Other:** PDFPlumber, Axios

---

## Architecture

* Frontend sends resume/JD to backend APIs
* Backend processes input and calls LLM
* Skills are extracted, normalized, and matched
* Results returned and rendered in UI

---

## Setup Instructions

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create `.env` in backend:

```
OPENAI_API_KEY=your_key
```

---

## Deployment

**Backend (Render)**

* Root: `backend`
* Build: `pip install -r requirements.txt`
* Start: `uvicorn main:app --host 0.0.0.0 --port 10000`

**Frontend (Vercel)**

* Root: `frontend`
* Framework: Next.js

---

## Sample Input / Output

**Input:** Resume + Job Description
**Output:**

* Matched Skills
* Skill Gaps
* Learning Plan

---

## Author

Suchismita Acharya
GitHub: https://github.com/SUCHISMITA-ACHARYA
