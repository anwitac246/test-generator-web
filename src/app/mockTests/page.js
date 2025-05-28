"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [testId, setTestId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const response = await fetch('http://localhost:5000/api/test-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          const data = await response.json();
          if (response.ok) {
            setTestHistory(data.tests);
          } else {
            console.error('Failed to fetch test history:', data.error);
          }
        } catch (error) {
          console.error('Error fetching test history:', error);
        }
      } else {
        setIsAuthenticated(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

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
        const response = await fetch('http://localhost:5000/api/save-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          console.error('Failed to save test:', await response.json());
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
    localStorage.setItem('currentTest', JSON.stringify({ ...testData, testId }));
    router.push('/takeTest');
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
    localStorage.setItem('currentTest', JSON.stringify(testData));
    router.push('/takeTest');
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (testCreated && testData) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-400 dark:from-gray-900 dark:to-gray-800 p-6 text-white font-sans">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-white/20">
            <h1 className="text-5xl font-extrabold text-center text-white mb-8">
              Test Created Successfully!
            </h1>
            <div className="bg-white/20 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Test Details:</h2>
              <div className="space-y-2 text-lg">
                <p><strong>Type:</strong> {testType === "full" ? "Full Test" : "Custom Test"}</p>
                <p><strong>Total Questions:</strong> {testData.totalQuestions}</p>
                <p><strong>Time Limit:</strong> {testData.timeLimit} minutes</p>
                <p><strong>Subjects:</strong> {testData.subjects.join(", ")}</p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <button
                onClick={handleTakeTest}
                className="px-10 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                Take Test
              </button>
              <div>
                <button
                  onClick={() => {
                    setTestCreated(false);
                    setTestData(null);
                    setTestId(null);
                  }}
                  className="px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-all duration-300"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-400 dark:from-gray-900 dark:to-gray-800 p-6 text-white font-sans">
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-white/20">
          <h1 className="text-5xl font-extrabold text-center text-white mb-8">
            Create a Mock Test
          </h1>
          <div className="flex justify-center gap-6 mb-10">
            {["full", "custom"].map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  testType === type
                    ? "bg-white text-indigo-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {type === "full" ? "Full Test" : "Custom Test"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-8 text-white">
            {testType === "full" ? (
              <div className="text-center text-xl font-medium">
                <p>
                  You will receive <strong>25 questions</strong> each from{" "}
                  <strong>Physics, Chemistry, and Mathematics</strong>.
                </p>
                <p className="mt-2">Time allotted: <strong>3 hours</strong></p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-2xl font-bold mb-3">
                    Select Subjects
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {Object.keys(subjects).map((subject) => (
                      <label
                        key={subject}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full cursor-pointer transition-all duration-300 ${
                          selectedSubjects.includes(subject)
                            ? "bg-white text-indigo-700 shadow-lg"
                            : "bg-white/20 hover:bg-white/30 text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="accent-indigo-600 w-4 h-4"
                        />
                        <span className="text-lg">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {selectedSubjects.map((subject) => (
                  <div key={subject}>
                    <label className="block mt-6 text-xl font-semibold mb-2">
                      Select Topics for {subject}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {subjects[subject].map((topic) => (
                        <label
                          key={topic}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                            selectedTopics[subject]?.includes(topic)
                              ? "bg-white text-indigo-700 shadow"
                              : "bg-white/20 hover:bg-white/30 text-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedTopics[subject]?.includes(topic) || false
                            }
                            onChange={() => handleTopicToggle(subject, topic)}
                            className="accent-indigo-500"
                          />
                          <span className="text-sm">{topic}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <label className="block mt-6 text-xl font-semibold mb-2">
                    Custom Time (in minutes):
                  </label>
                  <input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/70"
                    min="10"
                    max="180"
                  />
                </div>
              </>
            )}
            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading || (testType === "custom" && selectedSubjects.length === 0)}
                className={`mt-8 px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 ${
                  isLoading || (testType === "custom" && selectedSubjects.length === 0)
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-white text-indigo-700 hover:scale-105 hover:shadow-2xl"
                }`}
              >
                {isLoading ? "Creating Test..." : "Create Test"}
              </button>
            </div>
          </form>

          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center text-white mb-6">Previous Tests</h2>
            {testHistory.length === 0 ? (
              <p className="text-center text-lg">No tests taken yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {testHistory.map((test) => (
                  <div
                    key={test.testId}
                    className="bg-white/20 rounded-2xl p-4 text-white"
                  >
                    <h3 className="text-lg font-semibold">
                      {test.testType === "full" ? "Full Test" : "Custom Test"}
                    </h3>
                    <p><strong>Subjects:</strong> {test.subjects.join(", ")}</p>
                    <p><strong>Total Questions:</strong> {test.totalQuestions}</p>
                    <p><strong>Time Limit:</strong> {test.timeLimit} minutes</p>
                    <p><strong>Created:</strong> {new Date(test.createdAt).toLocaleDateString()}</p>
                    {test.score !== undefined && (
                      <p><strong>Score:</strong> {test.score}/{test.total} ({test.percentage}%)</p>
                    )}
                    <button
                      onClick={() => handleRetakeTest(test)}
                      className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-all"
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