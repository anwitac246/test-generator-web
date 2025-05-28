"use client";
import React from "react";
import Navbar from "./navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#142850] text-gray-900 dark:text-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0C7B93] to-[#00A8CC] text-white py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Master JEE Mains with Confidence
            </h1>
            <p className="text-lg md:text-xl mb-8 leading-relaxed">
              Access expertly crafted mock tests, curated notes, and personalized progress tracking — all designed to help you ace the JEE Mains exam.
            </p>
            <a
              href="/mockTests"
              className="inline-block bg-white text-[#0C7B93] font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition"
            >
              Get Started Free
            </a>
          </div>

          <div className="md:w-1/2">
            <img
              src="/students.png"
              alt="Students studying for exams"
              className="w-full max-w-md mx-auto"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-20 bg-gray-50 dark:bg-[#27496D]">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-[#142850] dark:text-white">Why Choose JEE Ace?</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Our platform is crafted to provide the best learning experience tailored specifically for JEE aspirants.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
          {[
            { title: "Mock Tests", desc: "Take unlimited, timed mock tests that mimic the real JEE Mains environment to sharpen your skills." },
            { title: "Curated Notes", desc: "Study from concise, expert-curated notes covering all key topics for efficient revision." },
            { title: "Progress Tracking", desc: "Monitor your improvement with detailed performance analytics and daily practice goals." }
          ].map(({ title, desc }, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#0C7B93] text-gray-800 dark:text-white p-8 rounded-lg shadow-md hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold mb-3">{title}</h3>
              <p className="text-gray-600 dark:text-gray-100">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-[#142850] dark:text-white">What Our Users Say</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Hear from some of our successful JEE aspirants who achieved their goals with JEE Ace.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
          {[
            {
              name: "Anjali Sharma",
              feedback:
                "The mock tests helped me simulate the exam day perfectly. I improved my time management significantly!",
              img: "/avatar.png",
            },
            {
              name: "Rohit Verma",
              feedback:
                "Curated notes made my revision much easier and faster. The progress tracker kept me motivated every day.",
              img: "/avatar.png",
            },
            {
              name: "Sneha Patel",
              feedback:
                "The platform is intuitive and the support team is amazing. Highly recommend it to every JEE aspirant!",
              img: "/avatar.png",
            },
          ].map(({ name, feedback, img }, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-[#27496D] p-8 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
            >
              <img
                src={img}
                alt={name}
                className="w-20 h-20 rounded-full mb-4 object-cover"
                loading="lazy"
              />
              <p className="mb-4 text-gray-700 dark:text-gray-100">&quot;{feedback}&quot;</p>
              <h4 className="font-semibold text-lg text-[#0C7B93] dark:text-[#00A8CC]">{name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#142850] text-gray-300 py-10 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">JEE Ace</h3>
            <p className="text-sm max-w-xs">
              Empowering JEE aspirants with the best tools and resources to achieve success.
            </p>
          </div>

          <div className="flex space-x-4">
            {[
              { href: "https://twitter.com", label: "Twitter" },
              { href: "https://facebook.com", label: "Facebook" },
              { href: "https://linkedin.com", label: "LinkedIn" },
            ].map(({ href, label }, idx) => (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-white transition"
              >
                {/* Add corresponding SVGs here */}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} JEE Ace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
