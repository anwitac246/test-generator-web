"use client";
import React from "react";
import Navbar from "./navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-mono relative overflow-hidden">
      <Navbar />

      {/* Floating SVG Decorations */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <svg className="absolute animate-bounce w-32 h-32 text-pink-500 top-10 left-10 opacity-20" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
        <svg className="absolute animate-ping w-24 h-24 text-yellow-400 bottom-20 right-20 opacity-20" fill="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" /></svg>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 bg-gradient-to-r from-pink-500 to-yellow-400 text-white py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h1 className="text-5xl font-bold leading-tight mb-6 drop-shadow-lg">
              Crack JEE with Confidence
            </h1>
            <p className="text-lg md:text-xl mb-8 leading-relaxed text-white/90">
              Mock tests, smart notes, and progress tools built to help you top JEE Mains — all in one vibrant platform.
            </p>
            <a
              href="/mockTests"
              className="inline-block bg-white text-pink-600 font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 hover:bg-yellow-100 transition"
            >
              Start Practicing
            </a>
          </div>
          <div className="md:w-1/2">
            <img
              src="/students.png"
              alt="Students studying"
              className="w-full max-w-md mx-auto animate-fade-in"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-20 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-pink-600 mb-4">Why You'll Love It</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Every tool is designed to help you learn faster and perform better — no fluff, just results.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              title: "Dynamic Mock Tests",
              desc: "Simulate the JEE environment with real-time scoring and time tracking.",
            },
            {
              title: "Bite-sized Notes",
              desc: "Clean, curated notes that cover the syllabus without the clutter.",
            },
            {
              title: "Track & Improve",
              desc: "Get visual feedback on your weak areas and improve strategically.",
            },
          ].map(({ title, desc }, i) => (
            <div
              key={i}
              className="bg-white border border-yellow-300 shadow-md rounded-xl p-8 hover:shadow-xl transition duration-300"
            >
              <h3 className="text-xl font-semibold text-pink-600 mb-3">{title}</h3>
              <p className="text-gray-700">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 md:px-20 bg-yellow-50">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-pink-600 mb-4">Student Stories</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Real feedback from real students who used JEE Ace to ace their exams.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              name: "Anjali Sharma",
              feedback:
                "Mock tests were spot on! Practicing daily with them helped me avoid silly mistakes and stress.",
              img: "/avatar.png",
            },
            {
              name: "Rohit Verma",
              feedback:
                "Their progress tracker kept me focused and their notes saved me hours. Super helpful!",
              img: "/avatar.png",
            },
            {
              name: "Sneha Patel",
              feedback:
                "Clean UI, no distractions, and everything just works. Highly recommended for any JEE aspirant.",
              img: "/avatar.png",
            },
          ].map(({ name, feedback, img }, i) => (
            <div
              key={i}
              className="bg-white border border-pink-200 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center"
            >
              <img
                src={img}
                alt={name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <p className="mb-4 text-gray-700 italic">“{feedback}”</p>
              <h4 className="font-semibold text-pink-600 text-lg">{name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pink-600 text-white py-10 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">JEE Ace</h3>
            <p className="text-sm max-w-xs">
              Your complete JEE companion — practice smart, revise better, and track your growth.
            </p>
          </div>

          <div className="flex space-x-4">
            {["Twitter", "LinkedIn", "YouTube"].map((label, idx) => (
              <a
                key={idx}
                href="#"
                aria-label={label}
                className="hover:text-yellow-300 transition"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-pink-100">
          &copy; {new Date().getFullYear()} JEE Ace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
