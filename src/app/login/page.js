"use client";
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase-config";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Navbar from "../components/navbar";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/mockTests");
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
      router.push("/mockTests");
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
    <div className="min-h-screen bg-white font-poppins">
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Banner */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#d100b7] to-[#ffcb05] text-white p-12 flex flex-col justify-center rounded-br-[60px] shadow-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">JEE Mains Test Generator</h1>
          <p className="text-lg font-medium">
            Practice mock tests, read smart notes, and improve with intelligent performance tracking – built for serious aspirants.
          </p>
        </div>

        {/* Right Side - Auth Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-10">
          <div className="w-full max-w-md space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {isLogin ? "Login to Your Account" : "Create a New Account"}
            </h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#d100b7] focus:outline-none placeholder-gray-600"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#d100b7] focus:outline-none placeholder-gray-600"
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-white font-semibold transition ${isLogin
                    ? "bg-[#d100b7] hover:bg-[#b4009d]"
                    : "bg-yellow-500 hover:bg-yellow-600 text-gray-800"
                  }`}
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-gray-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 flex items-center justify-center rounded-xl border border-gray-300 hover:bg-gray-100 transition text-gray-800"
            >
              <FcGoogle className="text-xl mr-3" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      resetMessages();
                      setIsLogin(false);
                    }}
                    className="text-[#d100b7] font-semibold hover:underline"
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
                    className="text-[#d100b7] font-semibold hover:underline"
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
