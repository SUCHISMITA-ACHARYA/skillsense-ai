"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";
import axios from "axios";
import { useRef } from "react";

function formatSkill(skill: string) {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

export default function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

const resumeInputRef = useRef<HTMLInputElement>(null);
const jdInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null); // ✅ NEW
  const [jdFile, setJdFile] = useState<File | null>(null); // ✅ NEW

  const [currentSkill, setCurrentSkill] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);

  const [learningPlan, setLearningPlan] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);

  // ✅ UPDATED (auto-detect text vs pdf)
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      let res;

      if (resumeFile && jdFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("job_description", jdFile);

        res = await axios.post(
          "http://127.0.0.1:8000/analyze-pdf",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        res = await axios.post("http://127.0.0.1:8000/analyze", {
          resume,
          job_description: jd,
        });
      }

      setResult(res.data);

      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch {
      alert("Backend not connected or missing input");
    }
    setLoading(false);
  };

  const handleAsk = async (skill: string) => {
    setCurrentSkill(skill);
    setEvaluation(null);
    setAnswer("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        skill,
      });
      setQuestion(res.data.question);
    } catch {
      alert("Error generating question");
    }
  };

  const handleEvaluate = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/evaluate", {
        skill: currentSkill,
        answer,
      });
      setEvaluation(res.data);
    } catch {
      alert("Evaluation failed");
    }
  };

  const handleLearningPlan = async () => {
  setLoadingPlan(true);
  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/learning-plan",
      {
        skills: result.skill_gaps,
      }
    );

    setLearningPlan(res.data.plan);

    // ✅ AUTO SCROLL
    setTimeout(() => {
      document
        .getElementById("learning-plan")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);

  } catch {
    alert("Failed to generate learning plan");
  }
  setLoadingPlan(false);
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-white to-purple-200 p-6">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center gap-3">
  
  <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
    SkillSense AI
  </span>

  <span className="text-4xl md:text-5xl">
    📄💼
  </span>

</h1>


        <p className="block text-3xl font-semibold mb-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-wide">
    <br></br>
     AI-powered skill assessment & personalized learning agent
</p>
      </div>

      {/* INPUT */}
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-white via-blue-50 to-cyan-100 p-8 rounded-3xl shadow-xl border border-gray-200">  <h2 className="text-3xl font-bold mb-6 text-indigo-900 tracking-tight">
    Enter Details
  </h2>

  {/* RESUME TEXT */}
  <label className="block text-lg font-semibold mb-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-wide">
    Resume (Paste Text)
  </label>
  <textarea
    placeholder="Paste your resume here..."
    className="border border-gray-300 p-4 w-full mb-4 rounded-xl placeholder-gray-500 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
    rows={5}
    onChange={(e) => setResume(e.target.value)}
  />

  {/* RESUME FILE UPLOAD */}
 {/* RESUME FILE UPLOAD */}
<div className="border-2 border-dashed border-indigo-300 p-5 rounded-xl mb-6 text-center bg-indigo-50">

  {!resumeFile ? (
    <button
      onClick={() => resumeInputRef.current?.click()}
      className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
    >
      Upload Resume PDF
    </button>
  ) : (
    <div className="flex items-center justify-center gap-3">
      <span className="text-indigo-800 font-semibold text-base">
        {resumeFile.name}
      </span>

      <button
        onClick={() => setResumeFile(null)}
        className="text-red-600 font-bold text-lg hover:text-red-800"
      >
        ✕
      </button>
    </div>
  )}

  <input
    type="file"
    accept="application/pdf"
    ref={resumeInputRef}
    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
    className="hidden"
  />
</div>

  {/* JD TEXT */}
  <label className="block text-lg font-semibold mb-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-wide">
    Job Description (Paste Text)
  </label>
  <textarea
    placeholder="Paste the job description here..."
    className="border border-gray-300 p-4 w-full mb-4 rounded-xl placeholder-gray-500 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
    rows={5}
    onChange={(e) => setJd(e.target.value)}
  />


  {/* JD FILE UPLOAD */}
<div className="border-2 border-dashed border-purple-300 p-5 rounded-xl mb-6 text-center bg-purple-50">

  {!jdFile ? (
    <button
      onClick={() => jdInputRef.current?.click()}
      className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
    >
      Upload Job Description PDF
    </button>
  ) : (
    <div className="flex items-center justify-center gap-3">
      <span className="text-purple-800 font-semibold text-base">
        {jdFile.name}
      </span>

      <button
        onClick={() => setJdFile(null)}
        className="text-red-600 font-bold text-lg hover:text-red-800"
      >
        ✕
      </button>
    </div>
  )}

  <input
    type="file"
    accept="application/pdf"
    ref={jdInputRef}
    onChange={(e) => setJdFile(e.target.files?.[0] || null)}
    className="hidden"
  />
</div>

  <button
    onClick={handleAnalyze}
    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl w-full font-semibold text-lg shadow-md hover:scale-[1.02] transition-transform"
  >
    {loading ? "Analyzing..." : "Analyze Skills"}
  </button>

</div>

      {/* RESULTS */}
      {result && (
        <div
          id="results"
          className="max-w-5xl mx-auto mt-10 grid md:grid-cols-2 gap-6"
        >

          {/* MATCHED */}
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              ✅ Matched Skills
            </h2>

            <ul className="space-y-2">
              {result.matched_skills.map((skill: string) => (
                <li
                  key={skill}
                  className="bg-green-300 text-green-900 px-4 py-2 rounded-lg font-medium"
                >
                  {formatSkill(skill)}
                </li>
              ))}
            </ul>
          </div>

          {/* GAPS */}
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="text-xl font-semibold mb-4 text-red-800">
              ❌ Skill Gaps
            </h2>

            <ul className="space-y-3">
              {result.skill_gaps.map((skill: string) => (
                <li
                  key={skill}
                  className="bg-red-300 px-4 py-3 rounded-lg text-red-900"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {formatSkill(skill)}
                    </span>

                    <button
                      onClick={() => handleAsk(skill)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Test
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* INTERVIEW */}
      {question && (
        <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold mb-2 text-indigo-800 text-lg">
            🧠 Skill Assessment: {formatSkill(currentSkill)}
          </h2>

          <p className="mb-4 text-black">{question}</p>

          <textarea
            placeholder="Type your answer..."
            className="border p-3 w-full mb-3 rounded text-black"
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="flex justify-center">
            <button
              onClick={handleEvaluate}
              className="bg-indigo-700 text-white px-6 py-2 rounded font-semibold"
            >
              Submit Answer
            </button>
          </div>

          {evaluation && (
            <div className="mt-4 p-4 bg-gray-200 rounded text-black">
              <p><strong>Score:</strong> {evaluation.score}/10</p>
              <p><strong>Level:</strong> {evaluation.level}</p>
              <p><strong>Feedback:</strong> {evaluation.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* LEARNING PLAN BUTTON */}
      {result && (
        <div className="max-w-5xl mx-auto mt-6 text-center">
          <button
            onClick={handleLearningPlan}
            className="bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {loadingPlan ? "Generating..." : "Generate Learning Plan"}
          </button>
        </div>
      )}

      {/* LEARNING PLAN */}
{learningPlan && (
  <div
  id="learning-plan"
  className="max-w-5xl mx-auto mt-6 bg-white p-6 rounded-xl shadow border"
>
    <h2 className="font-semibold mb-3 text-purple-800 text-lg">
      📚 Learning Plan
    </h2>

    <div className="prose max-w-none text-black leading-relaxed text-justify">
  <ReactMarkdown
    components={{
      h2: ({ children }) => (
        <h2 className="font-bold text-xl mt-6 mb-3 text-indigo-800">
          {children}
        </h2>
      ),
      strong: ({ children }) => (
        <strong className="text-purple-800 font-semibold">
          {children}
        </strong>
      ),
      ul: ({ children }) => (
        <ul className="ml-5 mb-3 space-y-1 list-disc">
          {children}
        </ul>
      ),
      p: ({ children }) => (
        <p className="mb-3">{children}</p>
      ),
    }}
  >
    {learningPlan}
  </ReactMarkdown>
</div>

  </div>
)}
   </div>
  );
}