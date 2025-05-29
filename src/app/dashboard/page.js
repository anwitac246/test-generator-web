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
      case "Physics": return "⚛️";
      case "Chemistry": return "🧪";
      case "Mathematics": return "📊";
      default: return "📚";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading Dashboard...</div>
          <div className="text-slate-400 mt-2">Analyzing your test data</div>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 shadow-xl">
              <div className="text-6xl mb-6">📊</div>
              <h1 className="text-3xl font-bold mb-4">No Test Data Available</h1>
              <p className="text-slate-400 mb-8">Take some tests to see your analytics and performance insights here.</p>
              <button
                onClick={() => router.push('/mockTests')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="max-w-7xl mx-auto">
  
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              Performance Dashboard
            </h1>
            <p className="text-slate-400 text-lg">Track your progress and analyze your test performance</p>
          </div>


          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-xl">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Time Range</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

       
          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    overallStats.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                    overallStats.trend === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {overallStats.trend === 'up' ? '↗' : overallStats.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{overallStats.totalTests}</div>
                <div className="text-slate-400 text-sm">Tests Completed</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-400 mb-1">{overallStats.averageScore}%</div>
                <div className="text-slate-400 text-sm">Average Score</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-1">{overallStats.totalQuestions}</div>
                <div className="text-slate-400 text-sm">Total Questions</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-400 mb-1">{overallStats.averageTime}m</div>
                <div className="text-slate-400 text-sm">Avg. Time</div>
              </div>
            </div>
          )}

       
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                📈 Performance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="test" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
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

      
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                📚 Subject Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

      
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                🎯 Score Distribution
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
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                ⏱️ Time Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="range" type="category" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

     
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                🕒 Recent Tests
              </h3>
              <div className="space-y-4">
                {recentTests.map((test, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-slate-200">{test.testName}</div>
                        <div className="text-sm text-slate-400">
                          {new Date(test.completedAt).toLocaleDateString()} • {formatTime(test.timeTaken)}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        parseFloat(test.results.percentage) >= 80 ? 'text-emerald-400' :
                        parseFloat(test.results.percentage) >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {test.results.percentage}%
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      {test.results.score}/{test.totalQuestions} correct
                    </div>
                  </div>
                ))}
              </div>
            </div>

         
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                📖 Subject Breakdown
              </h3>
              <div className="space-y-4">
                {subjectPerformance.map((subject, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getSubjectIcon(subject.subject)}</span>
                        <span className="font-semibold text-slate-200">{subject.subject}</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        parseFloat(subject.percentage) >= 80 ? 'text-emerald-400' :
                        parseFloat(subject.percentage) >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {subject.percentage}%
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>{subject.correct}/{subject.total} correct</span>
                      <span>{subject.tests} tests</span>
                    </div>
                    <div className="w-full bg-slate-600/30 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(subject.percentage) >= 80 ? 'bg-emerald-500' :
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

        
          <div className="text-center">
            <div className="space-x-4">
              <button
                onClick={() => router.push('/mockTests')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Take New Test
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-semibold text-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50"
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