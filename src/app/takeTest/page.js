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
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load test data from localStorage
    const storedTest = localStorage.getItem('currentTest');
    if (storedTest) {
      const parsedTest = JSON.parse(storedTest);
      setTestData(parsedTest);
      // Convert minutes to seconds for the timer
      setTimeLeft(parsedTest.timeLimit * 60);
    } else {
      router.push('/mockTests');
    }
  }, [router]);

  useEffect(() => {
    if (timeLeft > 0 && !testCompleted) {
      // Show warning when 5 minutes (300 seconds) are left
      if (timeLeft === 300) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
      
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !testCompleted) {
      // Auto-submit when time runs out
      handleSubmitTest();
    }
  }, [timeLeft, testCompleted]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return "text-red-400"; // Last 5 minutes
    if (timeLeft <= 900) return "text-orange-400"; // Last 15 minutes
    return "text-emerald-400";
  };

  const getQuestionsBySubject = () => {
    if (!testData) return [];
    if (currentSubject === "All") {
      return testData.questions;
    }
    return testData.questions.filter((q) => q.subject === currentSubject);
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
      if (!testData || !testData.questions) {
    console.error("Test data not available");
    return;
  }
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

        // Save test results to MongoDB if user is authenticated
        try {
          await fetch('http://localhost:5000/api/save-test-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'user_id', // Replace with actual user ID from auth
              testId: testData.testId || Date.now().toString(),
              results,
              timeTaken: (testData.timeLimit * 60) - timeLeft,
            }),
          });
        } catch (saveError) {
          console.log('Could not save test result:', saveError);
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

  const getAnsweredCount = () => {
    return Object.keys(userAnswers).length;
  };

  const getSubjectIcon = (subject) => {
    switch (subject) {
      case "Physics": return "⚛️";
      case "Chemistry": return "🧪";
      case "Mathematics": return "📊";
      default: return "📚";
    }
  };

  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading test...</div>
          <div className="text-slate-400 mt-2">Please wait while we prepare your test</div>
        </div>
      </div>
    );
  }

  if (testCompleted && testResults) {
    const subjectStats = getSubjectStats();
    const overallPercentage = ((testResults.score / testResults.total) * 100).toFixed(1);
    const timeTaken = (testData.timeLimit * 60) - timeLeft;
    const timeTakenFormatted = formatTime(timeTaken);

    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4 border border-emerald-500/30">
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Test Completed!
              </h1>
              <p className="text-slate-400 text-lg">Here are your results</p>
            </div>

            {/* Overall Score Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className={`text-7xl font-bold mb-4 ${
                  overallPercentage >= 80 ? 'text-emerald-400' :
                  overallPercentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {testResults.score}/{testResults.total}
                </div>
                <div className="text-3xl font-semibold text-slate-200 mb-2">
                  Overall Score: {overallPercentage}%
                </div>
                <div className="text-slate-400">
                  Time Taken: {timeTakenFormatted} / {formatTime(testData.timeLimit * 60)}
                </div>
              </div>

              {/* Subject-wise Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(subjectStats).map(([subject, stats]) => (
                  <div key={subject} className="bg-slate-700/30 rounded-xl p-6 text-center border border-slate-600/30">
                    <div className="text-3xl mb-3">{getSubjectIcon(subject)}</div>
                    <div className="text-lg font-semibold text-slate-200 mb-2">{subject}</div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {stats.correct}/{stats.total}
                    </div>
                    <div className={`text-lg font-medium ${
                      stats.percentage >= 80 ? 'text-emerald-400' :
                      stats.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {stats.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-x-4">
              <button
                onClick={() => router.push('/mockTests')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create New Test
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-semibold text-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50"
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
  const answeredCount = getAnsweredCount();
  const totalQuestions = testData.questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <div>
      <Navbar />
      
      {/* Time Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 border border-red-500/50 shadow-2xl max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Time Warning!</h3>
              <p className="text-slate-300">Only 5 minutes remaining!</p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white">
        {/* Top Header with Timer and Progress */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-400 font-medium">Time Left:</span>
                </div>
                <div className={`text-2xl font-bold ${getTimeColor()} ${timeLeft <= 300 ? 'animate-pulse' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Subject Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentSubject("All")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    currentSubject === "All" 
                      ? "bg-white text-slate-900 shadow-lg" 
                      : "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50"
                  }`}
                >
                  All ({testData.questions.length})
                </button>
                {testData.subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setCurrentSubject(subject);
                      setCurrentQuestionIndex(0);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      currentSubject === subject 
                        ? "bg-white text-slate-900 shadow-lg" 
                        : "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50"
                    }`}
                  >
                    <span>{getSubjectIcon(subject)}</span>
                    {subject} ({testData.questions.filter(q => q.subject === subject).length})
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitTest}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>{currentSubject === "All" ? "📚" : getSubjectIcon(currentSubject)}</span>
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
                      className={`aspect-square rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                        isCurrent
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : isAnswered
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 hover:border-slate-500/50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-slate-400">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                  <span className="text-slate-400">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-700 border border-slate-600 rounded"></div>
                  <span className="text-slate-400">Not Answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
              {currentQuestion ? (
                <>
                  {/* Question Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSubjectIcon(currentQuestion.subject)}</span>
                      <span className="text-sm bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600/30">
                        {currentQuestion.subject}
                      </span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="mb-8">
                    <h2 className="text-xl font-medium mb-6 text-slate-200 leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                    {currentQuestion.image_data && (
                      <div className="mb-6 bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                        <img
                          src={currentQuestion.image_data}
                          alt="Question diagram"
                          className="max-w-full h-auto rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-4 mb-8">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const optionLabel = String.fromCharCode(65 + optionIndex);
                      const globalIndex =
                        currentSubject === "All"
                          ? currentQuestionIndex
                          : testData.questions.findIndex((q) => q === currentQuestion);
                      const isSelected = userAnswers[globalIndex] === optionLabel;
                      
                      return (
                        <label
                          key={optionIndex}
                          className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "bg-blue-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10"
                              : "bg-slate-700/30 hover:bg-slate-600/30 border-2 border-slate-600/30 hover:border-slate-500/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${globalIndex}`}
                            value={optionLabel}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, optionLabel)}
                            className="mt-1 accent-blue-500 scale-125"
                          />
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <span className={`font-bold text-lg ${
                                isSelected ? 'text-blue-400' : 'text-slate-400'
                              }`}>
                                {optionLabel}.
                              </span>
                              <span className="text-slate-200 leading-relaxed">{option}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30 hover:border-slate-500/50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex(
                          Math.min(currentQuestions.length - 1, currentQuestionIndex + 1)
                        )
                      }
                      disabled={currentQuestionIndex === currentQuestions.length - 1}
                      className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30 hover:border-slate-500/50 flex items-center gap-2"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <div className="text-xl text-slate-300">No questions available for {currentSubject}</div>
                  <div className="text-slate-400 mt-2">Please select a different subject</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}