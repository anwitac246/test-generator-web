"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { auth } from "../lib/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import clsx from "clsx";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [testId, setTestId] = useState(null);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const response = await fetch("http://localhost:5000/api/test-history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          const data = await response.json();
          if (response.ok) {
            setTestHistory(data.tests || []);
          } else {
            console.error("Failed to fetch test history:", data.error);
          }
        } catch (error) {
          console.error("Error fetching test history:", error);
        }
      } else {
        setIsAuthenticated(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

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
      const response = await fetch("http://localhost:5000/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
          count: count,
          topics: topics || [],
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
      if (testType === "custom" && (!customTime || customTime < 10 || customTime > 180)) {
        alert("Please enter a valid duration between 10 and 180 minutes.");
        setIsLoading(false);
        return;
      }

      let allQuestions = [];
      let timeLimit = 180;

      if (testType === "full") {
        const physicsQuestions = await generateQuestionsForSubject("Physics", [], 25);
        const chemistryQuestions = await generateQuestionsForSubject("Chemistry", [], 25);
        const mathQuestions = await generateQuestionsForSubject("Mathematics", [], 25);

        allQuestions = [
          ...physicsQuestions.map((q) => ({ ...q, subject: "Physics" })),
          ...chemistryQuestions.map((q) => ({ ...q, subject: "Chemistry" })),
          ...mathQuestions.map((q) => ({ ...q, subject: "Mathematics" })),
        ];
      } else {
        timeLimit = parseInt(customTime);
        const questionsPerSubject = Math.ceil(25 / selectedSubjects.length);

        for (const subject of selectedSubjects) {
          const topicsForSubject = selectedTopics[subject] || [];
          const questions = await generateQuestionsForSubject(subject, topicsForSubject, questionsPerSubject);
          allQuestions = [...allQuestions, ...questions.map((q) => ({ ...q, subject }))];
        }
      }

      const testConfig = {
        questions: allQuestions,
        timeLimit: timeLimit,
        testType: testType,
        subjects: testType === "full" ? ["Physics", "Chemistry", "Mathematics"] : selectedSubjects,
        totalQuestions: allQuestions.length,
      };

      const user = auth.currentUser;
      if (user) {
        const response = await fetch("http://localhost:5000/api/save-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            testConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTestId(data.testId);
          setTestHistory([
            {
              testId: data.testId,
              testType: testConfig.testType,
              subjects: testConfig.subjects,
              totalQuestions: testConfig.totalQuestions,
              timeLimit: testConfig.timeLimit,
              questions: testConfig.questions,
              createdAt: new Date().toISOString(),
            },
            ...testHistory,
          ]);
        } else {
          console.error("Failed to save test:", await response.json());
        }
      }

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
    localStorage.setItem("currentTest", JSON.stringify({ ...testData, testId }));
    router.push("/takeTest");
  };

  const handleRetakeTest = (test) => {
    const testData = {
      testId: test.testId,
      questions: test.questions,
      timeLimit: test.timeLimit,
      testType: test.testType,
      subjects: test.subjects,
      totalQuestions: test.totalQuestions,
    };
    localStorage.setItem("currentTest", JSON.stringify(testData));
    router.push("/takeTest");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (testCreated && testData) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-white p-6 text-black">
          <div className="max-w-4xl mx-auto">
            {/* Success Animation */}
            <div className="text-center mb-8 animate-bounce">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-300 rounded-full mb-4 border border-magenta-500">
                <svg className="w-10 h-10 text-magenta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-magenta-500 mb-2">Test Created Successfully!</h1>
              <p className="text-black text-lg">Your mock test is ready to begin</p>
            </div>

            {/* Test Details Card */}
            <div className="bg-white rounded-2xl border border-magenta-300 p-8 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold mb-6 text-black flex items-center gap-3">
                <div className="w-8 h-8 bg-magenta-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-magenta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                Test Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-magenta-500 rounded-full"></div>
                    <span className="text-black">Type:</span>
                    <span className="text-black font-medium">{testType === "full" ? "Full Test" : "Custom Test"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-black">Questions:</span>
                    <span className="text-black font-medium">{testData.totalQuestions}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-white rounded-full border border-magenta-500"></div>
                    <span className="text-black">Duration:</span>
                    <span className="text-black font-medium">{testData.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-magenta-500 rounded-full"></div>
                    <span className="text-black">Subjects:</span>
                    <span className="text-black font-medium">{testData.subjects.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <button
                onClick={handleTakeTest}
                className="group relative px-8 py-4 bg-magenta-500 rounded-xl font-semibold text-lg text-gray-900 shadow-lg hover:shadow-magenta-600 transform hover:scale-105 transition-all duration-300"
                aria-label="Start the created mock test"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 000-5H9v5zm0 0H7.5a2.5 2.5 0 000 5H9v-5z"
                    />
                  </svg>
                  Begin Test
                </span>
                <div className="absolute inset-0 bg-magenta-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => {
                  setTestCreated(false);
                  setTestData(null);
                  setTestId(null);
                }}
                className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 rounded-lg text-black font-medium transition-all duration-300 border border-magenta-300 hover:border-magenta-500"
                aria-label="Create another mock test"
              >
                Create Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-white p-6 text-black">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-magenta-500 mb-4">Create Your Mock Test</h1>
            <p className="text-black text-lg max-w-2xl mx-auto">
              Build a personalized practice test tailored to your needs with our comprehensive question bank.
            </p>
          </div>

          {/* Test Type Selection */}
          <div className="flex justify-center gap-4 mb-12">
            {["full", "custom"].map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={clsx(
                  "group relative px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300",
                  testType === type
                    ? "bg-magenta-500 text-gray-900 shadow-lg scale-105"
                    : "bg-yellow-300 text-black hover:bg-yellow-400 border border-magenta-300",
                )}
                aria-label={`Select ${type === "full" ? "Full" : "Custom"} Test`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {type === "full" ? (
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  )}
                  {type === "full" ? "Full Test" : "Custom Test"}
                </span>
                <div
                  className={clsx(
                    "absolute inset-0 bg-magenta-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    testType === type && "opacity-100",
                  )}
                ></div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-magenta-300 p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-8">
              {testType === "full" ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-100 rounded-2xl p-8 border border-magenta-300">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-magenta-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 text-black">Complete JEE Mock Test</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="bg-white rounded-xl p-4">
                        <div className="text-3xl font-bold text-magenta-500 mb-2">25</div>
                        <div className="text-black">Physics Questions</div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">25</div>
                        <div className="text-black">Chemistry Questions</div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="text-3xl font-bold text-black mb-2">25</div>
                        <div className="text-black">Mathematics Questions</div>
                      </div>
                    </div>
                    <div className="mt-6 text-black">
                      <span className="text-lg">Total Duration: </span>
                      <span className="text-xl font-semibold text-magenta-500">3 Hours</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Subject Selection */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                      <div className="w-8 h-8 bg-magenta-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-magenta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      Select Subjects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.keys(subjects).map((subject) => (
                        <label
                          key={subject}
                          className={clsx(
                            "group cursor-pointer transition-all duration-300",
                            selectedSubjects.includes(subject) ? "scale-105" : "hover:scale-102",
                          )}
                        >
                          <div
                            className={clsx(
                              "relative p-6 rounded-xl border-2 transition-all duration-300",
                              selectedSubjects.includes(subject)
                                ? "bg-magenta-100 border-magenta-500 shadow-lg shadow-magenta-500/25"
                                : "bg-white border-magenta-300 hover:border-magenta-500 hover:bg-yellow-100",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              className="absolute top-4 right-4 w-5 h-5 accent-magenta-500"
                            />
                            <div className="text-center">
                              <div
                                className={clsx(
                                  "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center",
                                  selectedSubjects.includes(subject)
                                    ? "bg-magenta-500"
                                    : "bg-yellow-300 group-hover:bg-yellow-400",
                                )}
                              >
                                <span className={clsx("text-2xl", selectedSubjects.includes(subject) ? "text-gray-900" : "text-black")}>
                                  {subject === "Physics" ? "⚛" : subject === "Chemistry" ? "🧪" : "📊"}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-black">{subject}</h3>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Topic Selection */}
                  {selectedSubjects.map((subject) => (
                    <div key={subject} className="space-y-4">
                      <h3 className="text-xl font-semibold text-black flex items-center gap-3">
                        <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        </div>
                        Topics for {subject}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subjects[subject].map((topic) => (
                          <label
                            key={topic}
                            className={clsx(
                              "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                              selectedTopics[subject]?.includes(topic)
                                ? "bg-magenta-100 border border-magenta-500 text-black"
                                : "bg-white border border-magenta-300 text-black hover:bg-yellow-100 hover:border-magenta-500",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTopics[subject]?.includes(topic) || false}
                              onChange={() => handleTopicToggle(subject, topic)}
                              className="w-4 h-4 accent-magenta-500"
                            />
                            <span className="text-sm font-medium">{topic}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Time Selection */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="w-full px-4 py-3 bg-white border border-magenta-300 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-magenta-500 transition-all duration-300"
                          min="10"
                          max="180"
                          placeholder="Enter duration in minutes"
                          aria-label="Test duration in minutes"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black text-sm">minutes</div>
                      </div>
                      <div className="mt-2 text-black text-sm">Duration range: 10-180 minutes</div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={isLoading || (testType === "custom" && selectedSubjects.length === 0)}
                  className={clsx(
                    "group relative px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
                    isLoading || (testType === "custom" && selectedSubjects.length === 0)
                      ? "bg-yellow-200 text-magenta-300 cursor-not-allowed"
                      : "bg-magenta-500 text-gray-900 shadow-lg hover:shadow-magenta-600 transform hover:scale-105",
                  )}
                  aria-label="Create the mock test"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Test...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Test
                      </>
                    )}
                  </span>
                  <div
                    className={clsx(
                      "absolute inset-0 bg-magenta-600 rounded-xl opacity-0 transition-opacity duration-300",
                      !(isLoading || (testType === "custom" && selectedSubjects.length === 0)) && "group-hover:opacity-100",
                    )}
                  ></div>
                </button>
                {testType === "custom" && selectedSubjects.length === 0 && (
                  <p className="mt-3 text-black text-sm">Please select at least one subject to continue</p>
                )}
              </div>
            </form>
          </div>

          {/* Previous Tests Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-magenta-500">Previous Tests</h2>
            {(!testHistory || testHistory.length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-magenta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-black text-lg">No tests created yet.</p>
              </div>
            )}
            {testHistory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testHistory.map((test) => (
                  <div
                    key={test.testId}
                    className="bg-white rounded-2xl border border-magenta-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          test.testType === "full" ? "bg-magenta-100 text-magenta-500" : "bg-yellow-100 text-yellow-400",
                        )}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-black">{test.testType === "full" ? "Full Test" : "Custom Test"}</h3>
                    </div>
                    <div className="space-y-2 text-sm text-black mb-4">
                      <p>
                        <span className="text-black font-medium">Subjects:</span> {test.subjects.join(", ")}
                      </p>
                      <p>
                        <span className="text-black font-medium">Questions:</span> {test.totalQuestions}
                      </p>
                      <p>
                        <span className="text-black font-medium">Duration:</span> {test.timeLimit} minutes
                      </p>
                      <p>
                        <span className="text-black font-medium">Created:</span> {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                      {test.score !== undefined && test.total !== undefined && (
                        <p>
                          <span className="text-black font-medium">Score:</span> {test.score}/{test.total}{" "}
                          ({test.percentage ?? ((test.score / test.total) * 100).toFixed(2)}%)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRetakeTest(test)}
                      className="w-full px-4 py-2 bg-magenta-500 hover:bg-magenta-600 rounded-lg font-semibold text-gray-900 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-magenta-600"
                      aria-label={`Retake ${test.testType === "full" ? "Full" : "Custom"} Test created on ${new Date(
                        test.createdAt,
                      ).toLocaleDateString()}`}
                    >
                      Retake Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}