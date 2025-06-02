"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase-config"; 
import { onAuthStateChanged } from "firebase/auth";
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
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true); 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        router.push('/login'); 
        return;
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
   
    if (!authLoading && user) {
    
      const storedTest = localStorage.getItem('currentTest');
      if (storedTest) {
        const parsedTest = JSON.parse(storedTest);
        setTestData(parsedTest);
       
        setTimeLeft(parsedTest.timeLimit * 60);
      } else {
        router.push('/mockTests');
      }
    }
  }, [router, authLoading, user]);

  useEffect(() => {
    if (timeLeft > 0 && !testCompleted) {
     
      if (timeLeft === 300) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
      
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

  const getTimeColor = () => {
    if (timeLeft <= 300) return "text-red-500"; 
    if (timeLeft <= 900) return "text-orange-500"; 
    return "text-green-600";
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

    if (!user) {
      console.error("User not authenticated");
      alert("Please login to submit the test");
      return;
    }

    // Step 1: Evaluate the test
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

      try {
        // Step 2: Save test result to database
        console.log("Saving test results...");
        console.log("Test ID:", testData.testId);
        console.log("User ID:", user.uid);
        console.log("Results:", results);

        const testResultData = {
          userId: user.uid,
          userEmail: user.email,
          testId: testData.testId || `test_${Date.now()}`, // Generate test ID if not available
          testName: testData.testName || 'Custom Test',
          testType: testData.testType || 'custom',
          subjects: testData.subjects || [],
          totalQuestions: testData.questions.length,
          results: {
            score: results.score,
            total: results.total,
            percentage: ((results.score / results.total) * 100).toFixed(1),
            details: results.details,
            subjectWiseResults: getSubjectStats(results)
          },
          timeTaken: (testData.timeLimit * 60) - timeLeft,
          timeLimit: testData.timeLimit * 60,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        const saveResponse = await fetch('http://localhost:5000/api/save-test-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify(testResultData),
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log('Test result saved successfully:', saveResult);
        } else {
          const errorData = await saveResponse.json();
          console.error('Failed to save test result:', errorData);
          // Don't show error to user, just log it
        }
      } catch (saveError) {
        console.error('Could not save test result:', saveError);
        // Continue with showing results even if save fails
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

  const getSubjectStats = (results = testResults) => {
    if (!results || !testData) return {};
    const subjectStats = {};
    const subjects = [...new Set(testData.questions.map((q) => q.subject))];
    subjects.forEach((subject) => {
      const subjectQuestions = testData.questions
        .map((q, index) => ({ question: q, index }))
        .filter((item) => item.question.subject === subject);
      const correctAnswers = subjectQuestions.filter(
        (item) => results.details[item.index]?.is_correct
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta-200 border-t-magenta-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl font-semibold">Checking authentication...</div>
          <div className="text-gray-600 mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta-200 border-t-magenta-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl font-semibold">Loading test...</div>
          <div className="text-gray-600 mt-2">Please wait while we prepare your test</div>
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
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-6 text-gray-800">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 border-2 border-green-200 shadow-lg">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-magenta-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Test Completed!
              </h1>
              <p className="text-gray-600 text-lg">Here are your results</p>
              {user && (
                <p className="text-gray-500 text-sm mt-2">
                  Results saved for {user.email}
                </p>
              )}
            </div>

            {/* Overall Score Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 mb-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className={`text-7xl font-bold mb-4 ${
                  overallPercentage >= 80 ? 'text-green-600' :
                  overallPercentage >= 60 ? 'text-yellow-600' : 'text-red-500'
                }`}>
                  {testResults.score}/{testResults.total}
                </div>
                <div className="text-3xl font-semibold text-gray-800 mb-2">
                  Overall Score: {overallPercentage}%
                </div>
                <div className="text-gray-600">
                  Time Taken: {timeTakenFormatted} / {formatTime(testData.timeLimit * 60)}
                </div>
              </div>

              {/* Subject-wise Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(subjectStats).map(([subject, stats]) => (
                  <div key={subject} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 text-center border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-3xl mb-3">{getSubjectIcon(subject)}</div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">{subject}</div>
                    <div className="text-3xl font-bold text-magenta-600 mb-2">
                      {stats.correct}/{stats.total}
                    </div>
                    <div className={`text-lg font-medium ${
                      stats.percentage >= 80 ? 'text-green-600' :
                      stats.percentage >= 60 ? 'text-yellow-600' : 'text-red-500'
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
                className="px-8 py-3 bg-gradient-to-r from-magenta-500 to-purple-500 hover:from-magenta-600 hover:to-purple-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Create New Test
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-2xl font-semibold text-lg transition-all duration-300 border border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-2xl max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-500 mb-2">Time Warning!</h3>
              <p className="text-gray-700">Only 5 minutes remaining!</p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-4 text-gray-800">
        {/* Top Header with Timer and Progress */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600 font-medium">Time Left:</span>
                </div>
                <div className={`text-2xl font-bold ${getTimeColor()} ${timeLeft <= 300 ? 'animate-pulse' : ''} bg-white px-4 py-2 rounded-2xl shadow-md border`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-magenta-500 to-purple-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Subject Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentSubject("All")}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                    currentSubject === "All" 
                      ? "bg-gradient-to-r from-magenta-500 to-purple-500 text-white" 
                      : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
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
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg ${
                      currentSubject === subject 
                        ? "bg-gradient-to-r from-magenta-500 to-purple-500 text-white" 
                        : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
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
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-xl"
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
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
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
                      className={`aspect-square rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg ${
                        isCurrent
                          ? "bg-gradient-to-r from-magenta-500 to-purple-500 text-white"
                          : isAnswered
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                          : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
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
                  <div className="w-4 h-4 bg-gradient-to-r from-magenta-500 to-purple-500 rounded-lg"></div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded-lg"></div>
                  <span className="text-gray-600">Not Answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-8 shadow-xl">
              {currentQuestion ? (
                <>
                  {/* Question Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSubjectIcon(currentQuestion.subject)}</span>
                      <span className="text-sm bg-gradient-to-r from-magenta-100 to-purple-100 text-magenta-700 px-3 py-1 rounded-full border border-magenta-200">
                        {currentQuestion.subject}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border border-gray-200">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="mb-8">
                    <h2 className="text-xl font-medium mb-6 text-gray-800 leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                    {currentQuestion.image_data && (
                      <div className="mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <img
                          src={currentQuestion.image_data}
                          alt="Question diagram"
                          className="max-w-full h-auto rounded-xl mx-auto shadow-md"
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
                          className={`group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                            isSelected
                              ? "bg-gradient-to-r from-magenta-50 to-purple-50 border-2 border-magenta-300"
                              : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${globalIndex}`}
                            value={optionLabel}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, optionLabel)}
                            className="mt-1 accent-magenta-500 scale-125"
                          />
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <span className={`font-bold text-lg ${
                                isSelected ? 'text-magenta-600' : 'text-gray-600'
                              }`}>
                                {optionLabel}.
                              </span>
                              <span className="text-gray-800 leading-relaxed">{option}</span>
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
                      className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400 flex items-center gap-2 shadow-md hover:shadow-lg"
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
                      className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400 flex items-center gap-2 shadow-md hover:shadow-lg"
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
                  <div className="text-xl text-gray-700">No questions available for {currentSubject}</div>
                  <div className="text-gray-500 mt-2">Please select a different subject</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}