"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";

export default function TakeTest() {
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [currentSubject, setCurrentSubject] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load test data from localStorage
    const storedTest = localStorage.getItem('currentTest');
    if (storedTest) {
      const parsedTest = JSON.parse(storedTest);
      setTestData(parsedTest);
      setTimeLeft(parsedTest.timeLimit * 60);
    } else {
      router.push('/mockTests');
    }
  }, [router]);

  useEffect(() => {
    if (timeLeft > 0 && !testCompleted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !testCompleted) {
      handleSubmitTest();
    }
  }, [timeLeft, testCompleted]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionsBySubject = () => {
    if (!testData) return [];
    if (currentSubject === "All") {
      return testData.questions;
    }
    return testData.questions.filter((q) => q.subject === currentSubject);
  };

  const getSubjectWiseQuestions = () => {
    if (!testData) return {};
    const subjectWise = {};
    const subjects = [...new Set(testData.questions.map((q) => q.subject))];
    subjects.forEach((subject) => {
      subjectWise[subject] = testData.questions.filter((q) => q.subject === subject);
    });
    return subjectWise;
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    const globalIndex =
      currentSubject === "All"
        ? questionIndex
        : testData.questions.findIndex((q) => q === getQuestionsBySubject()[questionIndex]);
    setUserAnswers({
      ...userAnswers,
      [globalIndex]: answer,
    });
  };

  const handleSubmitTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: testData.questions,
          userAnswers: testData.questions.map((_, index) => userAnswers[index] || ""),
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);

        // Save test results to MongoDB
        const user = auth.currentUser;
        if (user && testData.testId) {
          await fetch('http://localhost:5000/api/save-test-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.uid,
              testId: testData.testId,
              results,
            }),
          });
        }
      } else {
        throw new Error('Failed to evaluate test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
    } finally {
      setIsLoading(false);
      setTestCompleted(true);
    }
  };

  const getSubjectStats = () => {
    if (!testResults || !testData) return {};
    const subjectStats = {};
    const subjects = [...new Set(testData.questions.map((q) => q.subject))];
    subjects.forEach((subject) => {
      const subjectQuestions = testData.questions
        .map((q, index) => ({ question: q, index }))
        .filter((item) => item.question.subject === subject);
      const correctAnswers = subjectQuestions.filter(
        (item) => testResults.details[item.index]?.is_correct
      ).length;
      subjectStats[subject] = {
        total: subjectQuestions.length,
        correct: correctAnswers,
        percentage: ((correctAnswers / subjectQuestions.length) * 100).toFixed(1),
      };
    });
    return subjectStats;
  };

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading test...</div>
      </div>
    );
  }

  if (testCompleted && testResults) {
    const subjectStats = getSubjectStats();
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-400 p-6 text-white">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl">
            <h1 className="text-4xl font-extrabold text-center mb-8">Test Results</h1>
            <div className="bg-white/20 rounded-2xl p-6 mb-6">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-green-300 mb-2">
                  {testResults.score}/{testResults.total}
                </div>
                <div className="text-2xl">
                  Overall Score: {((testResults.score / testResults.total) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(subjectStats).map(([subject, stats]) => (
                  <div key={subject} className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold mb-2">{subject}</div>
                    <div className="text-2xl font-bold">{stats.correct}/{stats.total}</div>
                    <div className="text-sm">{stats.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center space-x-4">
              <button
                onClick={() => router.push('/mockTests')}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
              >
                Create New Test
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestions = getQuestionsBySubject();
  const currentQuestion = currentQuestions[currentQuestionIndex];

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-400 p-4 text-white">
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex justify-between items-center">
            <div className="text-xl font-semibold">
              Time Left: <span className="text-red-300">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentSubject("All")}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentSubject === "All" ? "bg-white text-indigo-700" : "bg-white/20"
                }`}
              >
                All
              </button>
              {testData.subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => {
                    setCurrentSubject(subject);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentSubject === subject ? "bg-white text-indigo-700" : "bg-white/20"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitTest}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">
                {currentSubject} Questions ({currentQuestions.length})
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                {currentQuestions.map((_, index) => {
                  const globalIndex =
                    currentSubject === "All"
                      ? index
                      : testData.questions.findIndex((q) => q === currentQuestions[index]);
                  const isAnswered = userAnswers.hasOwnProperty(globalIndex);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        isCurrent
                          ? "bg-blue-500 text-white"
                          : isAnswered
                          ? "bg-green-500 text-white"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              {currentQuestion ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {currentQuestion.subject}
                    </span>
                    <span className="text-sm">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </span>
                  </div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>
                    {currentQuestion.image_data && (
                      <div className="mb-4">
                        <img
                          src={currentQuestion.image_data}
                          alt="Question diagram"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const optionLabel = String.fromCharCode(65 + optionIndex);
                      const globalIndex =
                        currentSubject === "All"
                          ? currentQuestionIndex
                          : testData.questions.findIndex((q) => q === currentQuestion);
                      return (
                        <label
                          key={optionIndex}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            userAnswers[globalIndex] === optionLabel
                              ? "bg-blue-500/50 border-2 border-blue-400"
                              : "bg-white/10 hover:bg-white/20 border-2 border-transparent"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${globalIndex}`}
                            value={optionLabel}
                            checked={userAnswers[globalIndex] === optionLabel}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, optionLabel)}
                            className="mr-3 accent-blue-500"
                          />
                          <span className="font-medium mr-2">{optionLabel}.</span>
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex(
                          Math.min(currentQuestions.length - 1, currentQuestionIndex + 1)
                        )
                      }
                      disabled={currentQuestionIndex === currentQuestions.length - 1}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-xl">No questions available for {currentSubject}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}