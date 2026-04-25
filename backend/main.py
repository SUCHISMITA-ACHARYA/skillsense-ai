from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import re
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from fastapi import UploadFile, File

# ----------- LOAD ENV -----------

load_dotenv()
print("OPENROUTER KEY:", os.getenv("OPENROUTER_API_KEY"))

# ----------- CLIENT -----------

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

MODEL = "mistralai/mixtral-8x7b-instruct"

# ----------- APP -----------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- MODELS -----------

class InputData(BaseModel):
    resume: str
    job_description: str

class SkillRequest(BaseModel):
    skill: str

class AnswerRequest(BaseModel):
    skill: str
    answer: str

class LearningRequest(BaseModel):
    skills: list[str]

# ----------- HELPERS -----------

def extract_json(text):
    text = re.sub(r"```(?:json)?", "", text)
    text = text.replace("```", "")
    match = re.search(r"\{.*\}", text, re.DOTALL)
    return match.group(0) if match else text

def generate(prompt):
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return extract_json(response.choices[0].message.content)

# ----------- FALLBACK SKILLS -----------

COMMON_SKILLS = [
    "python","java","javascript","html","css",
    "react","node","django","flask",
    "sql","postgresql","mongodb","database",
    "api","microservices","system design",
    "docker","aws","azure","gcp","git",
    "communication","teamwork","leadership",
    "problem solving","time management",
    "stakeholder management"
]
def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def fallback_extract(text):
    found = set()
    text_lower = text.lower()
    for skill in COMMON_SKILLS:
        if skill in text_lower:
            found.add(skill)
    return list(found)

# ----------- NORMALIZATION -----------

def normalize(skill):
    return skill.lower().strip()

# ----------- CLEAN SKILLS -----------
def clean_skills(skills):
    cleaned = []

    for s in skills:
        s = normalize(s)

        # ✅ allow up to 3 words (important for soft skills)
        if len(s.split()) > 4:
            continue

        # ❌ remove only clear junk
        if any(x in s for x in ["experience with", "knowledge of", "understanding of"]):
            continue

        if not s or len(s) < 2:
            continue

        cleaned.append(s)

    return list(set(cleaned))
# ----------- MATCHING -----------

def smart_match(required, candidate):
    required_set = set(required)
    candidate_set = set(candidate)

    matched = required_set.intersection(candidate_set)
    gaps = required_set - matched

    return sorted(matched), sorted(gaps)
@app.get("/")
def root():
    return {"message": "SkillSense AI Running 🚀"}

# ----------- ANALYZE -----------

@app.post("/analyze")
def analyze(data: InputData):
    try:
        prompt = f"""
You are an expert recruiter.

Extract ALL skills from the job description and resume.

CRITICAL RULES:
- Return ONLY canonical skill names (no sentences)
- Map soft skills EXACTLY to:
  communication
  teamwork
  leadership
  problem solving
  stakeholder management
  time management
- Map technical skills to standard names:
  python, django, sql, postgresql, mongodb, api, aws, docker, etc.

EXAMPLES:
- "worked in teams" → teamwork
- "collaborated with others" → teamwork
- "led a team" → leadership
- "mentored juniors" → leadership
- "handled databases" → sql
- "strong communication skills" → communication

Return STRICT JSON:
{{
  "required_skills": [],
  "candidate_skills": []
}}

Job Description:
{data.job_description}

Resume:
{data.resume}
"""

        content = generate(prompt)

        try:
            parsed = json.loads(content)
            required_llm = parsed.get("required_skills", [])
            candidate_llm = parsed.get("candidate_skills", [])
        except:
            required_llm = []
            candidate_llm = []

        # fallback
        required = required_llm + fallback_extract(data.job_description)
        candidate = candidate_llm + fallback_extract(data.resume)

        # clean everything
        required = clean_skills(required)
        candidate = clean_skills(candidate)
        matched, gaps = smart_match(required, candidate)

        return {
            "status": "success",
            "required_skills": required,
            "candidate_skills": candidate,
            "matched_skills": matched,
            "skill_gaps": gaps
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ----------- PDF ANALYZE -----------

@app.post("/analyze-pdf")
async def analyze_pdf(
    resume: UploadFile = File(...),
    job_description: UploadFile = File(...)
):
    try:
        resume_text = extract_text_from_pdf(resume.file)
        jd_text = extract_text_from_pdf(job_description.file)

        return analyze(InputData(
            resume=resume_text,
            job_description=jd_text
        ))

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ----------- ASK -----------

@app.post("/ask")
def ask(data: SkillRequest):
    prompt = f"Ask one practical interview question for {data.skill}"
    return {"question": generate(prompt)}

# ----------- EVALUATE -----------

@app.post("/evaluate")
def evaluate(data: AnswerRequest):
    try:
        prompt = f"""
Evaluate this answer.

Skill: {data.skill}
Answer: {data.answer}

Return ONLY JSON:
{{
 "score": number (0-10),
 "level": "Beginner" or "Intermediate" or "Strong",
 "feedback": "short explanation"
}}
"""
        content = generate(prompt)
        return json.loads(content)
    except:
        return {
            "score": 6,
            "level": "Intermediate",
            "feedback": "Basic understanding detected."
        }



# ----------- LEARNING PLAN -----------
@app.post("/learning-plan")
def learning(data: LearningRequest):
    prompt = f"""
You MUST generate output in STRICT MARKDOWN format.

If you do not follow the format EXACTLY, the output is INVALID.

-------------------------------------
EXAMPLE (FOLLOW EXACTLY):

## Django

**Resources:**
- Django Documentation
- Django Girls Tutorial

**Time Estimate:**
- 4–6 weeks

**Why Important:**
Django helps build secure and scalable web applications.

**Adjacent Skills:**
- Python
- SQL

-------------------------------------

STRICT RULES:
- Generate a separate section for EACH skill
- Every skill MUST start with: ## Skill Name
- Skill name must be ONLY the skill (no sentences)
- Use **bold labels EXACTLY**:
  **Resources**
  **Time Estimate**
  **Why Important**
  **Adjacent Skills**
- Use "-" for ALL bullet points
- Leave ONE blank line after each section
- Leave ONE blank line between skills
- DO NOT merge multiple skills into one section
- DO NOT write plain paragraphs
- DO NOT skip any section

-------------------------------------

Generate a learning roadmap for EACH of these skills:

{data.skills}

Return ONLY markdown.
"""
    return {"plan": generate(prompt)}