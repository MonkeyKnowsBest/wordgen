import React, { useState } from 'react';
import { WordFilter, WordSource } from './wordFilter';
import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react';

function App() {
  const [wordLength, setWordLength] = useState<number>(5);
  const [selectedSource, setSelectedSource] = useState<string>('nouns');
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wordFilter = new WordFilter();
  const sources = wordFilter.getAvailableSources();

  const handleGenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      const words = wordFilter.generateWords(wordLength, selectedSource);
      setGeneratedWords(words);
      setIsLoading(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Word Generator</h1>
          <p className="text-gray-600">
            Generate common words based on length and type
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                Word Length
              </label>
              <select
                id="length"
                value={wordLength}
                onChange={(e) => setWordLength(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[3, 4, 5, 6, 7, 8, 9].map(length => (
                  <option key={length} value={length}>{length} letters</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                Word Source
              </label>
              <select
                id="source"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {sources.map((source: WordSource) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    Generate Words
                  </>
                )}
              </button>
            </div>
          </div>

          {generatedWords.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Words
              </label>
              <div className="overflow-x-auto bg-gray-50 rounded-md p-4 font-mono whitespace-nowrap">
                {generatedWords.map((word, index) => `$${word}`).join('\t')}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
              Word Generation Rules:
            </h2>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>All words are common English words (US spelling)</li>
              <li>Words contain only letters</li>
              <li>Each word contains at least one vowel (including 'y')</li>
              <li>No excessive letter repetition</li>
              <li>No abbreviations or acronyms</li>
              <li>No proper names or place names</li>
              <li>No inappropriate or offensive words</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;