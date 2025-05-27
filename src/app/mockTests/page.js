"use client";
import React, { useState } from "react";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (testType === "full") {
      console.log("Creating Full Test: 25 questions per subject, 180 mins");
    } else {
      console.log("Creating Custom Test with settings:", {
        subjects: selectedSubjects,
        topics: selectedTopics,
        customTime,
      });
    }
  };

  return (
    <div>
    <Navbar/>
    
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
              className="mt-8 px-10 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300"
            >
              Create Test
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
