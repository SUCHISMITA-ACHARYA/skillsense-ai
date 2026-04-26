"use client";

import ReactMarkdown from "react-markdown";
import { useState, useRef } from "react";
import axios from "axios";

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);

  const [currentSkill, setCurrentSkill] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);

  const [learningPlan, setLearningPlan] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);

  const API_BASE = "https://skillsense-ai-63zl.onrender.com";

  const handleAnalyze = async () => {
    setLoading(true);

    const makeRequest = async () => {
      if (resumeFile && jdFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("job_description", jdFile);

        return axios.post(`${API_BASE}/analyze-pdf`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        return axios.post(`${API_BASE}/analyze`, {
          resume: resume || "",
          job_description: jd || "",
        });
      }
    };

    try {
      let res = await makeRequest();

      console.log("API RESPONSE:", res.data);

      if (res?.data) {
        setResult({
          matched_skills: res.data.matched_skills || res.data.matched || [],
          skill_gaps: res.data.skill_gaps || res.data.gaps || [],
        });
      } else {
        alert("Invalid response from server");
      }

    } catch (error: any) {
      console.log("First attempt failed:", error);

      try {
        await new Promise((r) => setTimeout(r, 4000));
        let res = await makeRequest();

        console.log("Retry RESPONSE:", res.data);

        if (res?.data) {
          setResult({
            matched_skills: res.data.matched_skills || res.data.matched || [],
            skill_gaps: res.data.skill_gaps || res.data.gaps || [],
          });
        } else {
          alert("Invalid response from server");
        }

      } catch (error2: any) {
        console.log("Second attempt failed:", error2);

        if (error2.response) {
          alert(
            "Backend error: " +
              (error2.response.data?.detail || "Check backend logs")
          );
        } else {
          alert(
            "Server is waking up. Wait 20–30 seconds and try again."
          );
        }
      }
    }

    setTimeout(() => {
      document
        .getElementById("results")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 200);

    setLoading(false);
  };

  const handleAsk = async (skill: string) => {
    setCurrentSkill(skill);
    setEvaluation(null);
    setAnswer("");

    try {
      const res = await axios.post(`${API_BASE}/ask`, { skill });
      setQuestion(res.data.question);
    } catch {
      alert("Error generating question");
    }
  };

  const handleEvaluate = async () => {
    try {
      const res = await axios.post(`${API_BASE}/evaluate`, {
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
      const res = await axios.post(`${API_BASE}/learning-plan`, {
        skills: result?.skill_gaps || [],
      });

      setLearningPlan(res.data.plan);

      setTimeout(() => {
        document
          .getElementById("learning-plan")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch {
      alert("Failed to generate learning plan");
    }
    setLoadingPlan(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-white to-purple-200 p-6">

      {/* RESULTS */}
      {result && (
        <div id="results" className="max-w-5xl mx-auto mt-10 grid md:grid-cols-2 gap-6">

          {/* MATCHED */}
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              ✅ Matched Skills
            </h2>

            <ul className="space-y-2">
              {(result?.matched_skills || []).map((skill: string) => (
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
              {(result?.skill_gaps || []).map((skill: string) => (
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
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold"
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
    </div>
  );
}