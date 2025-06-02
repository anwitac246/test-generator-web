"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import Navbar from "../components/navbar";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
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
      fetchTestResults();
    }
  }, [authLoading, user]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/user-test-results/${user.uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results || []);
      } else {
        console.error('Failed to fetch test results');
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    let filtered = testResults;

    // Filter by time range
    if (selectedTimeRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedTimeRange) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(result => new Date(result.completedAt) >= filterDate);
    }

    return filtered;
  };

  const getOverallStats = () => {
    const filtered = getFilteredResults();
    if (filtered.length === 0) return null;

    const totalTests = filtered.length;
    const totalQuestions = filtered.reduce((sum, test) => sum + test.totalQuestions, 0);
    const totalCorrect = filtered.reduce((sum, test) => sum + test.results.score, 0);
    const averageScore = (totalCorrect / totalQuestions * 100).toFixed(1);
    const averageTime = filtered.reduce((sum, test) => sum + test.timeTaken, 0) / totalTests;
    
    const recentTests = filtered.slice(-5);
    const trend = recentTests.length > 1 ? 
      ((recentTests[recentTests.length - 1].results.percentage - recentTests[0].results.percentage) >= 0 ? "up" : "down") : "stable";

    return {
      totalTests,
      totalQuestions,
      totalCorrect,
      averageScore,
      averageTime: Math.round(averageTime / 60), 
      trend
    };
  };

  const getPerformanceTrend = () => {
    const filtered = getFilteredResults();
    return filtered.map((test, index) => ({
      test: `Test ${index + 1}`,
      score: parseFloat(test.results.percentage),
      date: new Date(test.completedAt).toLocaleDateString(),
      testName: test.testName
    }));
  };

  const getSubjectWisePerformance = () => {
    const filtered = getFilteredResults();
    const subjectData = {};

    filtered.forEach(test => {
      if (test.results.subjectWiseResults) {
        Object.entries(test.results.subjectWiseResults).forEach(([subject, data]) => {
          if (!subjectData[subject]) {
            subjectData[subject] = { total: 0, correct: 0, tests: 0 };
          }
          subjectData[subject].total += data.total;
          subjectData[subject].correct += data.correct;
          subjectData[subject].tests += 1;
        });
      }
    });

    return Object.entries(subjectData).map(([subject, data]) => ({
      subject,
      percentage: ((data.correct / data.total) * 100).toFixed(1),
      total: data.total,
      correct: data.correct,
      tests: data.tests
    }));
  };

  const getTimeDistribution = () => {
    const filtered = getFilteredResults();
    const timeRanges = {
      "0-30 min": 0,
      "30-60 min": 0,
      "60-90 min": 0,
      "90+ min": 0
    };

    filtered.forEach(test => {
      const timeInMinutes = test.timeTaken / 60;
      if (timeInMinutes <= 30) timeRanges["0-30 min"]++;
      else if (timeInMinutes <= 60) timeRanges["30-60 min"]++;
      else if (timeInMinutes <= 90) timeRanges["60-90 min"]++;
      else timeRanges["90+ min"]++;
    });

    return Object.entries(timeRanges).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / filtered.length) * 100).toFixed(1)
    }));
  };

  const getScoreDistribution = () => {
    const filtered = getFilteredResults();
    const scoreRanges = {
      "90-100%": 0,
      "80-89%": 0,
      "70-79%": 0,
      "60-69%": 0,
      "Below 60%": 0
    };

    filtered.forEach(test => {
      const score = parseFloat(test.results.percentage);
      if (score >= 90) scoreRanges["90-100%"]++;
      else if (score >= 80) scoreRanges["80-89%"]++;
      else if (score >= 70) scoreRanges["70-79%"]++;
      else if (score >= 60) scoreRanges["60-69%"]++;
      else scoreRanges["Below 60%"]++;
    });

    return Object.entries(scoreRanges).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / filtered.length) * 100).toFixed(1)
    }));
  };

  const getRecentTests = () => {
    const filtered = getFilteredResults();
    return filtered
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);
  };

  const getSubjectIcon = (subject) => {
    switch (subject) {
      case "Physics":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L9 3v1L7 6H4a1 1 0 000 2h1v4a1 1 0 001 1h1l1 2v1l1 1h2l1-1v-1l1-2h1a1 1 0 001-1V8h1a1 1 0 000-2h-3L13 4V3l-1-1h-2z"/>
            <circle cx="10" cy="10" r="2"/>
          </svg>
        );
      case "Chemistry":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 000 2h1v2H7a4 4 0 00-4 4v4a4 4 0 004 4h6a4 4 0 004-4v-4a4 4 0 00-4-4h-1V4h1a1 1 0 100-2H7zM9 6h2v2h2a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2V6zm1 4a1 1 0 100 2 1 1 0 000-2z"/>
          </svg>
        );
      case "Mathematics":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
          </svg>
        );
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-900 text-xl font-semibold">Loading Dashboard...</div>
          <div className="text-gray-600 mt-2">Analyzing your test data</div>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();
  const performanceTrend = getPerformanceTrend();
  const subjectPerformance = getSubjectWisePerformance();
  const timeDistribution = getTimeDistribution();
  const scoreDistribution = getScoreDistribution();
  const recentTests = getRecentTests();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (testResults.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Test Data Available</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Take some tests to see your analytics and performance insights here.</p>
              <button
                onClick={() => router.push('/mockTests')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors duration-200 shadow-sm"
              >
                Take Your First Test
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Performance Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Track your progress and analyze your test performance</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm text-gray-700 mb-2 block font-medium">Time Range</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    overallStats.trend === 'up' ? 'bg-green-100 text-green-700' :
                    overallStats.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {overallStats.trend === 'up' ? '↗' : overallStats.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">{overallStats.totalTests}</div>
                <div className="text-gray-600 text-sm font-medium">Tests Completed</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">{overallStats.averageScore}%</div>
                <div className="text-gray-600 text-sm font-medium">Average Score</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">{overallStats.totalQuestions}</div>
                <div className="text-gray-600 text-sm font-medium">Total Questions</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{overallStats.averageTime}m</div>
                <div className="text-gray-600 text-sm font-medium">Avg. Time</div>
              </div>
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Performance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="test" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#1F2937'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Subject Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="subject" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#1F2937'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percentage }) => `${range}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#1F2937'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis dataKey="range" type="category" stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#1F2937'
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Tests */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Tests
              </h3>
              <div className="space-y-4">
                {recentTests.map((test, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{test.testName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(test.completedAt).toLocaleDateString()} • {formatTime(test.timeTaken)}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        parseFloat(test.results.percentage) >= 80 ? 'text-green-600' :
                        parseFloat(test.results.percentage) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {test.results.percentage}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {test.results.score}/{test.totalQuestions} correct
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Subject Breakdown
              </h3>
              <div className="space-y-4">
                {subjectPerformance.map((subject, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          {getSubjectIcon(subject.subject)}
                        </div>
                        <span className="font-semibold text-gray-900">{subject.subject}</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        parseFloat(subject.percentage) >= 80 ? 'text-green-600' :
                        parseFloat(subject.percentage) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {subject.percentage}%
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{subject.correct}/{subject.total} correct</span>
                      <span>{subject.tests} tests</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(subject.percentage) >= 80 ? 'bg-green-500' :
                          parseFloat(subject.percentage) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <div className="space-x-4">
              <button
                onClick={() => router.push('/mockTests')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors duration-200 shadow-sm"
              >
                Take New Test
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-semibold text-lg transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}