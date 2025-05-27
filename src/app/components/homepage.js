"use client";
import React from "react";
import Navbar from "./navbar";


export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 md:px-20">
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
              className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition"
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

      <section className="py-20 px-6 md:px-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose JEE Ace?</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Our platform is crafted to provide the best learning experience tailored specifically for JEE aspirants.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Mock Tests</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Take unlimited, timed mock tests that mimic the real JEE Mains environment to sharpen your skills.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Curated Notes</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Study from concise, expert-curated notes covering all key topics for efficient revision.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor your improvement with detailed performance analytics and daily practice goals.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
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
              className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
            >
              <img
                src={img}
                alt={name}
                className="w-20 h-20 rounded-full mb-4 object-cover"
                loading="lazy"
              />
              <p className="mb-4 text-gray-700 dark:text-gray-300">&quot;{feedback}&quot;</p>
              <h4 className="font-semibold text-lg">{name}</h4>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">JEE Ace</h3>
            <p className="text-sm max-w-xs">
              Empowering JEE aspirants with the best tools and resources to achieve success.
            </p>
          </div>

          <div className="flex space-x-4">
           
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:text-white transition"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.949.564-2.005.974-3.127 1.195-.896-.956-2.173-1.555-3.59-1.555-2.72 0-4.924 2.204-4.924 4.923 0 .39.045.765.127 1.124-4.09-.205-7.719-2.165-10.148-5.144-.424.728-.666 1.57-.666 2.465 0 1.7.866 3.198 2.182 4.078-.805-.026-1.563-.247-2.228-.616v.061c0 2.377 1.693 4.358 3.946 4.807-.413.111-.849.17-1.296.17-.317 0-.626-.03-.927-.086.627 1.956 2.444 3.376 4.6 3.415-1.68 1.317-3.809 2.102-6.102 2.102-.396 0-.79-.023-1.17-.068 2.179 1.397 4.768 2.212 7.557 2.212 9.054 0 14.004-7.496 14.004-13.986 0-.213-.005-.425-.014-.636.962-.694 1.8-1.562 2.46-2.549z" />
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-white transition"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22.675 0h-21.35c-.73 0-1.325.595-1.325 1.325v21.351c0 .73.595 1.324 1.325 1.324h11.49v-9.294h-3.128v-3.622h3.128v-2.672c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.505 0-1.797.716-1.797 1.767v2.312h3.588l-.467 3.622h-3.12V24h6.116c.73 0 1.324-.595 1.324-1.324V1.325c0-.73-.594-1.325-1.324-1.325z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-white transition"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.854 0-2.137 1.447-2.137 2.943v5.663H9.352V9h3.415v1.561h.049c.476-.9 1.637-1.852 3.368-1.852 3.602 0 4.268 2.368 4.268 5.455v6.288zM5.337 7.433c-1.144 0-2.069-.926-2.069-2.068 0-1.144.925-2.07 2.069-2.07 1.142 0 2.068.926 2.068 2.07 0 1.142-.926 2.068-2.068 2.068zm1.777 13.02H3.56V9h3.554v11.453z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} JEE Ace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
