import React, { useState, useEffect } from 'react';
import { AlertCircle, BookOpen, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { WordFilter, WordSource } from './wordFilter';

function App() {
  const [wordLength, setWordLength] = useState<number>(5);
  const [selectedSources, setSelectedSources] = useState<string[]>(['common']);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'scroll' | 'grid'>('scroll');
  const [wordFilter] = useState(() => new WordFilter());
  const [sources, setSources] = useState<WordSource[]>([]);

  // Load sources when component mounts
  useEffect(() => {
    setSources(wordFilter.getAvailableSources());
  }, [wordFilter]);

  // Set a default source when sources are loaded
  useEffect(() => {
    if (sources.length > 0 && selectedSources.length === 0) {
      setSelectedSources([sources[0].id]);
    }
  }, [sources, selectedSources.length]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure at least one source is selected
      if (selectedSources.length === 0) {
        throw new Error('Please select at least one word source');
      }
      
      // Generate words from selected sources
      const words = await wordFilter.generateWordsFromMultipleSources(wordLength, selectedSources, 100);
      setGeneratedWords(words);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate words. Please try again later.');
      }
      console.error('Error generating words:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const formattedText = generatedWords.map(word => `$${word}`).join('\t');
    navigator.clipboard.writeText(formattedText).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        console.error('Failed to copy to clipboard');
      }
    );
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'scroll' ? 'grid' : 'scroll');
  };

  // Source selection handlers
  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      // Remove source if already selected
      setSelectedSources(selectedSources.filter(id => id !== sourceId));
    } else {
      // Add source if not selected
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleSelectAllSources = () => {
    setSelectedSources(sources.map(source => source.id));
  };

  const handleClearAllSources = () => {
    setSelectedSources([]);
  };

  // Format words with $ prefix and tab separation
  const formattedWordsOutput = generatedWords.map(word => `$${word}`).join('\t');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Word Generator</h1>
          <p className="text-gray-600">
            Generate common words based on length and selected sources
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                Word Length
              </label>
              <select
                id="length"
                value={wordLength}
                onChange={(e) => setWordLength(Number(e.target.value))}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              >
                {[3, 4, 5, 6, 7, 8, 9].map(length => (
                  <option key={length} value={length}>{length} letters</option>
                ))}
              </select>
            </div>

            {/* Word Sources Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Word Sources
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllSources}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllSources}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`source-${source.id}`}
                          type="checkbox"
                          checked={selectedSources.includes(source.id)}
                          onChange={() => handleSourceToggle(source.id)}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`source-${source.id}`} className="font-medium text-gray-700">
                          {source.name}
                        </label>
                        <p className="text-gray-500">{source.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || selectedSources.length === 0}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    Generate 100 Words
                  </>
                )}
              </button>
              {selectedSources.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Please select at least one word source
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Words Output */}
          {generatedWords.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated Words ({generatedWords.length})
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleDisplayMode}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                    title={displayMode === 'scroll' ? 'Switch to grid view' : 'Switch to scroll view'}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {displayMode === 'scroll' ? 'Grid View' : 'Scroll View'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {displayMode === 'scroll' ? (
                // Scroll view - horizontal scrolling
                <div className="relative overflow-x-auto bg-gray-50 rounded-md p-4 font-mono text-sm whitespace-nowrap border border-gray-200">
                  <div className="min-w-max">
                    {formattedWordsOutput}
                  </div>
                </div>
              ) : (
                // Grid view - words arranged in a grid
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {generatedWords.map((word, index) => (
                      <div key={index} className="font-mono text-sm p-2 bg-white border border-gray-100 rounded">
                        ${word}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Word Statistics */}
          {generatedWords.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-md border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 flex items-center mb-3">
                <AlertCircle className="h-4 w-4 mr-2" />
                Word Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-700">{generatedWords.length}</div>
                  <div className="text-xs text-indigo-600">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-700">{new Set(generatedWords).size}</div>
                  <div className="text-xs text-indigo-600">Unique Words</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-700">{wordLength}</div>
                  <div className="text-xs text-indigo-600">Word Length</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-700">{selectedSources.length}</div>
                  <div className="text-xs text-indigo-600">Sources Used</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-700">{selectedSources.map(id => 
                    sources.find(s => s.id === id)?.name.split(' ')[0]
                  ).join(', ')}</div>
                  <div className="text-xs text-indigo-600">Source Types</div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
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

          <div className="mt-4 text-xs text-gray-500">
            Word lists are sourced from public linguistic corpora including common English words,
            nouns, verbs, adjectives, and specialized collections.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
