import { useState } from 'react';
import { generateChant } from '../services/chantService';
import { Zap, Music } from 'lucide-react';

const SPORTS = [
  'Football',
  'Basketball',
  'Volleyball',
  'Cheerleading',
  'Soccer',
  'Track & Field',
  'Wrestling',
  'Baseball',
  'Softball',
  'Tennis',
];

export function CheerChantGenerator() {
  const [sport, setSport] = useState('Football');
  const [schoolMascot, setSchoolMascot] = useState('');
  const [competitorMascot, setCompetitorMascot] = useState('');
  const [chant, setChant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateChant = async () => {
    if (!schoolMascot.trim() || !competitorMascot.trim()) {
      setError('Please enter both your school mascot and the competitor mascot.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const generatedChant = await generateChant(sport, schoolMascot, competitorMascot);
      setChant(generatedChant);
    } catch (err) {
      setError('Failed to generate chant. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Music className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold text-purple-900">Cheer Chant Generator</h1>
          <Music className="h-8 w-8 text-pink-600" />
        </div>
        <p className="text-lg text-gray-600">Create winning chants for your school!</p>
      </div>

      <div className="rounded-xl bg-white p-8 shadow-lg">
        {/* Sport Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Select Sport
          </label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded-lg border-2 border-purple-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-500 focus:outline-none"
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* School Mascot Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Your School Mascot
          </label>
          <input
            type="text"
            value={schoolMascot}
            onChange={(e) => setSchoolMascot(e.target.value)}
            placeholder="e.g., Tigers, Eagles, Dragons"
            className="w-full rounded-lg border-2 border-purple-200 px-4 py-3 transition placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Competitor Mascot Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Competitor Mascot
          </label>
          <input
            type="text"
            value={competitorMascot}
            onChange={(e) => setCompetitorMascot(e.target.value)}
            placeholder="e.g., Lions, Bears, Wolves"
            className="w-full rounded-lg border-2 border-purple-200 px-4 py-3 transition placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateChant}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white transition hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Generating Chant...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              Generate Chant
            </span>
          )}
        </button>

        {/* Chant Display */}
        {chant && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Your Chant:</h2>
            <div className="whitespace-pre-wrap rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-gray-800 leading-relaxed">
              {chant}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(chant);
                alert('Chant copied to clipboard!');
              }}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Copy Chant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
