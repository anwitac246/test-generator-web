"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";

const subjects = {
  Physics: [
    "Units and Measurements",
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Rotational Motion",
    "Gravitation",
    "Properties of Solids and Liquids",
    "Thermodynamics",
    "Kinetic Theory of Gases",
    "Oscillations and Waves",
    "Electrostatics",
    "Current Electricity",
    "Magnetic Effects of Current and Magnetism",
    "Electromagnetic Induction and Alternating Currents",
    "Electromagnetic Waves",
    "Optics",
    "Dual Nature of Matter and Radiation",
    "Atoms and Nuclei",
    "Electronic Devices",
    "Experimental Skills",
  ],
  Chemistry: [
    "Some Basic Concepts in Chemistry",
    "Atomic Structure",
    "Chemical Bonding and Molecular Structure",
    "Chemical Thermodynamics",
    "Solutions",
    "Equilibrium",
    "Redox Reactions and Electrochemistry",
    "Chemical Kinetics",
    "Classification of Elements and Periodicity",
    "The p-Block Elements",
    "The d- and f-Block Elements",
    "Coordination Compounds",
    "Purification and Characterisation of Organic Compounds",
    "Some Basic Principles of Organic Chemistry",
    "Hydrocarbons",
    "Organic Compounds Containing Halogens",
    "Organic Compounds Containing Oxygen",
    "Organic Compounds Containing Nitrogen",
    "Biomolecules",
    "Principles Related to Practical Chemistry",
  ],
  Mathematics: [
    "Sets, Relations and Functions",
    "Complex Numbers and Quadratic Equations",
    "Matrices and Determinants",
    "Permutations and Combinations",
    "Binomial Theorem and Its Simple Applications",
    "Sequence and Series",
    "Limit, Continuity and Differentiability",
    "Integral Calculus",
    "Differential Equations",
    "Coordinate Geometry",
    "Three Dimensional Geometry",
    "Vector Algebra",
    "Statistics and Probability",
    "Trigonometry",
  ],
};

export default function CreateMockTest() {
  const [testType, setTestType] = useState("full");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState({});
  const [customTime, setCustomTime] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [testCreated, setTestCreated] = useState(false);
  const [testData, setTestData] = useState(null);
  const router = useRouter();

  const handleSubjectToggle = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
      const updatedTopics = { ...selectedTopics };
      delete updatedTopics[subject];
      setSelectedTopics(updatedTopics);
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleTopicToggle = (subject, topic) => {
    const subjectTopics = selectedTopics[subject] || [];
    if (subjectTopics.includes(topic)) {
      setSelectedTopics({
        ...selectedTopics,
        [subject]: subjectTopics.filter((t) => t !== topic),
      });
    } else {
      setSelectedTopics({
        ...selectedTopics,
        [subject]: [...subjectTopics, topic],
      });
    }
  };

  const generateQuestionsForSubject = async (subject, topics, count) => {
    try {
      const response = await fetch('http://localhost:5000/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject,
          count: count,
          topics: topics || []
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions for ${subject}`);
      }

      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error(`Error generating questions for ${subject}:`, error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let allQuestions = [];
      let timeLimit = 180; // Default 3 hours for full test

      if (testType === "full") {
        // Generate 25 questions each for Physics, Chemistry, and Mathematics
        const physicsQuestions = await generateQuestionsForSubject("Physics", [], 25);
        const chemistryQuestions = await generateQuestionsForSubject("Chemistry", [], 25);
        const mathQuestions = await generateQuestionsForSubject("Mathematics", [], 25);

        allQuestions = [
          ...physicsQuestions.map(q => ({ ...q, subject: "Physics" })),
          ...chemistryQuestions.map(q => ({ ...q, subject: "Chemistry" })),
          ...mathQuestions.map(q => ({ ...q, subject: "Mathematics" }))
        ];
      } else {
        // Custom test
        timeLimit = parseInt(customTime);
        const questionsPerSubject = Math.ceil(25 / selectedSubjects.length);

        for (const subject of selectedSubjects) {
          const topicsForSubject = selectedTopics[subject] || [];
          const questions = await generateQuestionsForSubject(subject, topicsForSubject, questionsPerSubject);
          allQuestions = [...allQuestions, ...questions.map(q => ({ ...q, subject }))];
        }
      }

      const testConfig = {
        questions: allQuestions,
        timeLimit: timeLimit,
        testType: testType,
        subjects: testType === "full" ? ["Physics", "Chemistry", "Mathematics"] : selectedSubjects,
        totalQuestions: allQuestions.length
      };

      setTestData(testConfig);
      setTestCreated(true);
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeTest = () => {
    // Store test data in localStorage for the test page
    localStorage.setItem('currentTest', JSON.stringify(testData));
    router.push('/takeTest');
  };

  if (testCreated && testData) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            {/* Success Animation */}
            <div className="text-center mb-8 animate-pulse">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4 border border-emerald-500/30">
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Test Created Successfully!
              </h1>
              <p className="text-slate-400 text-lg">Your mock test is ready to begin</p>
            </div>
            
            {/* Test Details Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Test Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white font-medium">{testType === "full" ? "Full Test" : "Custom Test"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-slate-400">Questions:</span>
                    <span className="text-white font-medium">{testData.totalQuestions}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white font-medium">{testData.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-slate-400">Subjects:</span>
                    <span className="text-white font-medium">{testData.subjects.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <button
                onClick={handleTakeTest}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg text-white shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 hover:from-emerald-600 hover:to-cyan-600"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 000-5H9v5zm0 0H7.5a2.5 2.5 0 000 5H9v-5z" />
                  </svg>
                  Begin Test
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <div>
                <button
                  onClick={() => {
                    setTestCreated(false);
                    setTestData(null);
                  }}
                  className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white font-medium transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50"
                >
                  Create Another Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Create Mock Test
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Design your personalized practice test with our comprehensive question bank
            </p>
          </div>

          {/* Test Type Selection */}
          <div className="flex justify-center gap-4 mb-12">
            {["full", "custom"].map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={`group relative px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  testType === type
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {type === "full" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  )}
                  {type === "full" ? "Full Test" : "Custom Test"}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {testType === "full" ? (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 text-slate-200">Complete JEE Mock Test</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="bg-slate-700/30 rounded-xl p-4">
                        <div className="text-3xl font-bold text-blue-400 mb-2">25</div>
                        <div className="text-slate-400">Physics Questions</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-4">
                        <div className="text-3xl font-bold text-purple-400 mb-2">25</div>
                        <div className="text-slate-400">Chemistry Questions</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-4">
                        <div className="text-3xl font-bold text-cyan-400 mb-2">25</div>
                        <div className="text-slate-400">Mathematics Questions</div>
                      </div>
                    </div>
                    <div className="mt-6 text-slate-300">
                      <span className="text-lg">Total Duration: </span>
                      <span className="text-xl font-semibold text-emerald-400">3 Hours</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Subject Selection */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      Select Subjects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.keys(subjects).map((subject) => (
                        <label
                          key={subject}
                          className={`group cursor-pointer transition-all duration-300 ${
                            selectedSubjects.includes(subject) ? "scale-105" : "hover:scale-102"
                          }`}
                        >
                          <div className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                            selectedSubjects.includes(subject)
                              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50 shadow-lg shadow-blue-500/25"
                              : "bg-slate-700/30 border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/50"
                          }`}>
                            <input
                              type="checkbox"
                              checked={selectedSubjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              className="absolute top-4 right-4 w-5 h-5 accent-blue-500"
                            />
                            <div className="text-center">
                              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                selectedSubjects.includes(subject)
                                  ? "bg-blue-500/30"
                                  : "bg-slate-600/30 group-hover:bg-slate-500/30"
                              }`}>
                                <span className="text-2xl">
                                  {subject === "Physics" ? "⚛️" : subject === "Chemistry" ? "🧪" : "📊"}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-slate-200">{subject}</h3>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Topic Selection */}
                  {selectedSubjects.map((subject) => (
                    <div key={subject} className="space-y-4">
                      <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        </div>
                        Topics for {subject}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subjects[subject].map((topic) => (
                          <label
                            key={topic}
                            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedTopics[subject]?.includes(topic)
                                ? "bg-purple-500/20 border border-purple-500/30 text-white"
                                : "bg-slate-700/30 border border-slate-600/30 text-slate-300 hover:bg-slate-600/30 hover:text-white hover:border-slate-500/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTopics[subject]?.includes(topic) || false}
                              onChange={() => handleTopicToggle(subject, topic)}
                              className="w-4 h-4 accent-purple-500"
                            />
                            <span className="text-sm font-medium">{topic}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Time Selection */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Test Duration
                    </h2>
                    <div className="max-w-md">
                      <div className="relative">
                        <input
                          type="number"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                          min="10"
                          max="180"
                          placeholder="Enter duration in minutes"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                          minutes
                        </div>
                      </div>
                      <div className="mt-2 text-slate-400 text-sm">
                        Duration range: 10-180 minutes
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={isLoading || (testType === "custom" && selectedSubjects.length === 0)}
                  className={`group relative px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    isLoading || (testType === "custom" && selectedSubjects.length === 0)
                      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Test...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Test
                      </>
                    )}
                  </span>
                </button>
                
                {testType === "custom" && selectedSubjects.length === 0 && (
                  <p className="mt-3 text-slate-400 text-sm">
                    Please select at least one subject to continue
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>   
  );
}