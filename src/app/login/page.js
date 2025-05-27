"use client";
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase-config";

import { FcGoogle } from "react-icons/fc";
import Navbar from "../components/navbar";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      await signInWithEmailAndPassword(auth, email, password);

    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Account created successfully! You can now log in.");
      setEmail("");
      setPassword("");
      setIsLogin(true);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    }
  };

  return (
    <div>
      <Navbar />

      <div className="flex min-h-screen">

        <div className="w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-6">JEE Mains Test Generator</h1>
          <p className="text-lg">
            Practice with mock tests tailored for JEE Mains, study from curated notes,
            and track your performance to improve daily. Designed for serious
            aspirants aiming for excellence.
          </p>
        </div>

        <div className="w-1/2 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
              {isLogin ? "Login to Your Account" : "Create a New Account"}
            </h2>

            {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
            {success && <p className="mb-4 text-green-600 text-sm">{success}</p>}

            <form
              onSubmit={isLogin ? handleEmailLogin : handleSignUp}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className={`w-full py-2 rounded-md text-white transition ${
                  isLogin ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <div className="w-full border-t"></div>
              <span className="px-4 text-gray-500">OR</span>
              <div className="w-full border-t"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-6 w-full border border-gray-300 flex items-center justify-center py-2 rounded-md hover:bg-gray-100 transition"
            >
              <FcGoogle className="mr-3 text-xl" />
              Continue with Google
            </button>

            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      resetMessages();
                      setIsLogin(false);
                    }}
                    className="text-blue-600 hover:underline focus:outline-none"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      resetMessages();
                      setIsLogin(true);
                    }}
                    className="text-blue-600 hover:underline focus:outline-none"
                  >
                    Log In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
