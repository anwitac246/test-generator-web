'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      setMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
          JEE Ace
        </Link>
        <nav className="hidden md:flex space-x-8 text-gray-700 dark:text-gray-300 font-medium">
          <Link
            href="/dashboard"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/mockTests"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Mock Tests
          </Link>
          <Link
            href="/question-bank"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Question Bank
          </Link>
          <Link
            href="/quickNotes"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Quick Notes
          </Link>
          <Link
            href="/leaderboard"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Leaderboard
          </Link>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-md border border-red-600 text-red-600 font-semibold hover:bg-red-600 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-gray-900 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-md border border-blue-600 text-blue-600 font-semibold hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-gray-900 transition"
            >
              Login
            </Link>
          )}
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {menuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-3">
          {['dashboard', 'mockTests', 'question-bank', 'quickNotes', 'leaderboard'].map(
            (page) => (
              <Link
                key={page}
                href={`/${page}`}
                className="block text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                {page
                  .split('-')
                  .map((word) => word[0].toUpperCase() + word.slice(1))
                  .join(' ')}
              </Link>
            )
          )}
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="block mt-3 text-center border border-red-600 text-red-600 rounded-md py-2 font-semibold hover:bg-red-600 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-gray-900 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block mt-3 text-center border border-blue-600 text-blue-600 rounded-md py-2 font-semibold hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-gray-900 transition"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;