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
    <header className="sticky top-0 z-50 bg-white shadow-lg border-b border-magenta-200 font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-3xl font-extrabold font-mono text-[#d100b7] tracking-tight"
        >
          JEE Ace
        </Link>

        <nav className="hidden md:flex space-x-6 text-gray-800 font-semibold">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/mockTests', label: 'Mock Tests' },
            { href: '/question-bank', label: 'Question Bank' },
            { href: '/quickNotes', label: 'Quick Notes' },
            { href: '/leaderboard', label: 'Leaderboard' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-[#d100b7] transition duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-full border border-[#d100b7] text-[#d100b7] font-semibold hover:bg-[#d100b7] hover:text-white transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border border-[#ffcb05] text-[#ffcb05] font-semibold hover:bg-[#ffcb05] hover:text-white transition"
            >
              Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#d100b7] focus:outline-none"
          aria-label="Toggle Menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-4 font-semibold text-gray-800">
          {['dashboard', 'mockTests', 'question-bank', 'quickNotes', 'leaderboard'].map((page) => (
            <Link
              key={page}
              href={`/${page}`}
              onClick={() => setMenuOpen(false)}
              className="block hover:text-[#d100b7] transition"
            >
              {page
                .split('-')
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(' ')}
            </Link>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="block w-full border border-[#d100b7] text-[#d100b7] rounded-full py-2 text-center hover:bg-[#d100b7] hover:text-white transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block w-full border border-[#ffcb05] text-[#ffcb05] rounded-full py-2 text-center hover:bg-[#ffcb05] hover:text-white transition"
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
