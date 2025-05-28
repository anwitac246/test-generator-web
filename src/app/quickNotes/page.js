'use client';
import React, { useState } from 'react';
import Navbar from '../components/navbar';

const quickNotesData = [
  {
    id: 309,
    title: 'Important Notes - Physics',
    description: 'Key equations and formulas for physics',
    subject: 'Physics',
    topic: 'Mechanics',
    type: 'Formula Sheet',
    content: 'This would contain all important mechanics formulas.',
    link: 'https://drive.google.com/file/d/1xnCHu_sJUmwDcFWnGl7SGurePkrn-x0O/view'
  },
  {
    id: 307,
    title: 'Important Reactions - Chemistry',
    description: 'Summary of important reactions in chemistry',
    subject: 'Chemistry',
    topic: 'Organic Chemistry',
    type: 'Summary',
    content: 'This would contain all important chemistry reactions.'
  },
  // ... other notes
];

const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];
const noteTypes = ['All', 'Formula Sheet', 'Summary', 'Concept Map', 'Tips & Tricks'];

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [previewLink, setPreviewLink] = useState(null);

  const filteredNotes = quickNotesData.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    const matchesType = selectedType === 'All' || note.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const toggleFavorite = (noteId) => {
    setFavorites(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const getTabNotes = () => {
    switch (activeTab) {
      case 'formulas':
        return filteredNotes.filter(note => note.type === 'Formula Sheet');
      case 'summaries':
        return filteredNotes.filter(note => note.type === 'Summary');
      case 'favorites':
        return filteredNotes.filter(note => favorites.includes(note.id));
      default:
        return filteredNotes;
    }
  };

  return (
    <div>
        <Navbar/>
    
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Quick Notes</h1>
          <p className="text-gray-400">Fast reference for key concepts and formulas</p>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search notes"
            className="bg-gray-800 text-white border border-gray-600 rounded px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-blue-400 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-4">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-4 py-2"
            >
              {subjects.map(subject => <option key={subject}>{subject}</option>)}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-4 py-2"
            >
              {noteTypes.map(type => <option key={type}>{type}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-700">
            {[
              { id: 'all', label: 'All Notes' },
              { id: 'formulas', label: 'Formula Sheets' },
              { id: 'summaries', label: 'Summaries' },
              { id: 'favorites', label: 'Favorites' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 transition duration-300 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-400 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getTabNotes().map(note => (
            <div
              key={note.id}
              className="bg-gray-800 rounded-lg shadow-lg p-4 hover:shadow-2xl transition duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                  <p className="text-sm text-gray-400">{note.description}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(note.id)}
                  className={`ml-2 text-xl transition ${
                    favorites.includes(note.id) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                  }`}
                  aria-label="Toggle Favorite"
                >
                  {favorites.includes(note.id) ? '★' : '☆'}
                </button>
              </div>
              <p><strong>Subject:</strong> {note.subject}</p>
              <p><strong>Topic:</strong> {note.topic}</p>
              <p><strong>Type:</strong> {note.type}</p>
              <p className="text-gray-300 mt-2">{note.content}</p>
              {note.link && (
                <button
                  onClick={() => setPreviewLink(note.link)}
                  className="mt-3 inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                >
                  Preview
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Preview Modal */}
      {previewLink && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden w-11/12 h-5/6 relative">
            <button
              onClick={() => setPreviewLink(null)}
              className="absolute top-2 right-2 text-white text-2xl z-10"
            >
              &times;
            </button>
            <iframe
              src={previewLink}
              title="Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div></div>
  );
};

export default Notes;
