import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Download,
  ExternalLink,
  Tool
} from 'lucide-react';
import { WordFilter, WordSource } from './wordFilter';

/**
 * WordSourceDebugger Component
 * 
 * This component helps diagnose issues with word sources in the application.
 * It shows which sources are working, which are failing, and provides guidance
 * on how to resolve common issues.
 */
const WordSourceDebugger: React.FC = () => {
  // Initialize the word filter
  const [wordFilter] = useState(() => new WordFilter());
  const [sources, setSources] = useState<WordSource[]>([]);
  const [sourceData, setSourceData] = useState<{[key: string]: string[]}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Load sources when component mounts
  useEffect(() => {
    // Get available sources from the WordFilter
    const availableSources = wordFilter.getAvailableSources();
    setSources(availableSources);
  }, [wordFilter]);

  /**
   * Loads sample data from a specific word source to test if it's working.
   * Records any errors encountered during the process.
   */
  const loadSourceData = async (sourceId: string) => {
    setIsLoading(true);
    try {
      // First check if the source is already cached
      const wordCache = wordFilter.getWordCache();
      let words = wordCache.get(sourceId);
      
      if (!words) {
        // If not cached, try to load some sample words (5-letter words)
        words = await wordFilter.generateWords(5, sourceId, 10);
      }
      
      // Store the first 10 words as sample data
      setSourceData(prev => ({
        ...prev,
        [sourceId]: words ? words.slice(0, 10) : []
      }));
      
      // Check for any recorded errors
      const errorLog = wordFilter.getErrorLog();
      if (errorLog.has(sourceId)) {
        setErrors(prev => ({
          ...prev,
          [sourceId]: errorLog.get(sourceId) || "Unknown error occurred"
        }));
      } else {
        // Clear any previous errors if successful
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[sourceId];
          return newErrors;
        });
      }
    } catch (error) {
      console.error(`Error loading source ${sourceId}:`, error);
      setErrors(prev => ({
        ...prev,
        [sourceId]: error instanceof Error ? error.message : String(error)
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Expands/collapses a source when clicked and loads its data if not already loaded.
   */
  const handleSourceClick = (sourceId: string) => {
    if (expandedSource === sourceId) {
      setExpandedSource(null);
    } else {
      setExpandedSource(sourceId);
      if (!sourceData[sourceId]) {
        loadSourceData(sourceId);
      }
    }
  };

  /**
   * Tests all word sources by loading sample data from each.
   */
  const testAllSources = async () => {
    setIsLoading(true);
    for (const source of sources) {
      await loadSourceData(source.id);
    }
    setIsLoading(false);
  };

  /**
   * Provides guidance on how to resolve common errors.
   */
  const getErrorHelp = (error: string): string => {
    if (error.includes('Failed to fetch') || error.includes('NetworkError')) {
      return 'Network issue. Check your internet connection or try again later. The word source URL might be temporarily unavailable.';
    }
    
    if (error.includes('timed out')) {
      return 'The request took too long to complete. This can happen if the server is slow or overloaded. Try again later.';
    }
    
    if (error.includes('JSON')) {
      return 'The app expected JSON data but received something else. This typically happens when the source format has changed.';
    }
    
    if (error.includes('CORS')) {
      return 'Cross-Origin Resource Sharing (CORS) error. The server hosting the word list doesn\'t allow access from your browser.';
    }
    
    if (error.includes('404') || error.includes('Not Found')) {
      return 'The word list URL no longer exists. The repository or file might have been moved or deleted.';
    }
    
    if (error.includes('403') || error.includes('Forbidden')) {
      return 'Access to the word list is forbidden. The server might be rate-limiting requests or requires authentication.';
    }
    
    if (error.includes('No valid words found')) {
      return 'The word source was reached, but no valid words were found that match the filtering criteria.';
    }
    
    return 'An unexpected error occurred. Try refreshing the page or select a different word source.';
  };

  /**
   * Suggests alternative sources when a source fails.
   */
  const getSuggestedAlternatives = (sourceId: string): string[] => {
    // Map of alternatives for each source
    const alternatives: {[key: string]: string[]} = {
      'nouns': ['common', 'scowl', 'bnc'],
      'verbs': ['common', 'scowl', 'bnc'],
      'adjectives': ['common', 'scowl', 'bnc'],
      'adverbs': ['common', 'gsl'],
      'gsl': ['common', 'bnc', 'scowl'],
      'scowl': ['common', 'bnc', 'gsl'],
      'bnc': ['common', 'scowl', 'gsl'],
      'fallout': ['common'],
      'common': ['bnc', 'scowl', 'gsl']
    };
    
    return alternatives[sourceId] || ['common'];
  };

  /**
   * Gets the source name from its ID
   */
  const getSourceName = (sourceId: string): string => {
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };
  
  /**
   * Technical explanation of what's happening with the source
   */
  const getTechnicalExplanation = (sourceId: string, error: string): string => {
    if (error.includes('JSON')) {
      return 'The app expected a specific JSON structure, but the source has a different format or structure. The enhanced WordFilter attempts to handle various formats but may still fail with very unusual structures.';
    }
    
    if (error.includes('404') || error.includes('Not Found')) {
      return 'The GitHub repository or specific file path in the URL no longer exists. The repository owner may have moved or deleted the file, or renamed the repository.';
    }
    
    if (error.includes('403') || error.includes('Forbidden')) {
      return 'GitHub has rate limiting on their raw content URLs. If too many requests are made in a short period, they temporarily block further requests. Wait a while or use a different source.';
    }
    
    if (sourceId === 'nouns' || sourceId === 'verbs' || sourceId === 'adjectives' || sourceId === 'adverbs') {
      return 'The specialized part-of-speech sources rely on specific JSON structures from the dariusk/corpora GitHub repository. The enhanced WordFilter now includes fallback patterns to identify these words from general word lists.';
    }
    
    return 'The error appears to be related to network connectivity, server response, or data format issues. The enhanced WordFilter includes improved error handling and fallback mechanisms.';
  };

  // Determine if any sources have errors
  const hasAnyErrors = Object.keys(errors).length > 0;

  return (
    <div className="mt-8">
      {/* Collapsed state - just show a button with error indicator if any */}
      {!isExpanded && (
        <div className="inline-flex items-center px-4 py-2 rounded-md bg-white shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(true)}>
          {hasAnyErrors ? (
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
          ) : (
            <Tool className="h-5 w-5 mr-2 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {hasAnyErrors 
              ? "Word Source Troubleshooter (Issues Found)" 
              : "Word Source Troubleshooter"}
          </span>
        </div>
      )}

      {/* Expanded state */}
      {isExpanded && (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Bug className="h-5 w-5 mr-2 text-red-500" />
              Word Source Troubleshooter
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Collapse panel"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Help section */}
          {showHelp && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800">
              <h3 className="font-semibold mb-1">What is this tool?</h3>
              <p className="mb-2">
                This troubleshooter helps diagnose issues with the word sources used by the Word Generator. 
                It shows you which sources are working, which are having problems, and suggests solutions.
              </p>
              <h3 className="font-semibold mb-1">How to use:</h3>
              <ol className="list-decimal list-inside pl-2 space-y-1">
                <li>Click "Test All Sources" to check all available word sources</li>
                <li>Click on any source to expand details and see sample words</li>
                <li>For sources with errors, follow the suggested solutions</li>
                <li>Try alternative sources if a particular one keeps failing</li>
              </ol>
              <p className="mt-2">
                Most errors are related to temporary network issues or changes to the online word lists, 
                and not problems with your device or browser.
              </p>
            </div>
          )}
          
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Word Source Status</p>
                <p>
                  If you're seeing "Source Failed" warnings in the Word Generator, this tool will help you identify
                  which sources are having issues and how to resolve them. The Word Generator will still work with
                  other functioning sources.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={testAllSources}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Sources...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Test All Sources
                </>
              )}
            </button>
          </div>
          
          {/* Source List */}
          <div className="border rounded-md divide-y">
            {sources.map((source) => {
              const hasError = !!errors[source.id];
              const hasData = !!sourceData[source.id] && sourceData[source.id].length > 0;
              const isWorking = hasData && !hasError;
              
              return (
                <div key={source.id} className="text-sm">
                  <div 
                    className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${
                      expandedSource === source.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => handleSourceClick(source.id)}
                  >
                    <div className="flex items-center">
                      {isWorking ? (
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : hasError ? (
                        <XCircle className="h-5 w-5 mr-2 text-red-500" />
                      ) : (
                        <div className="h-5 w-5 mr-2 rounded-full border-2 border-gray-300"></div>
                      )}
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-xs text-gray-500">{source.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {hasError && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                          Failed
                        </span>
                      )}
                      {isWorking && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Working
                        </span>
                      )}
                      {expandedSource === source.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedSource === source.id && (
                    <div className="p-3 pt-0 bg-gray-50">
                      {/* Error message and help */}
                      {hasError && (
                        <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-400 text-sm">
                          <div className="font-semibold text-red-800 mb-1">Error:</div>
                          <div className="text-red-700">{errors[source.id]}</div>
                          
                          <div className="mt-3 font-semibold text-red-800">What this means:</div>
                          <div className="text-red-700">{getErrorHelp(errors[source.id])}</div>
                          
                          <div className="mt-3 font-semibold text-red-800">Solution:</div>
                          <div className="text-red-700">
                            <p className="mb-1">Try these options:</p>
                            <ol className="list-decimal list-inside pl-2">
                              <li>Wait a few minutes and try again later</li>
                              <li>Use a different source instead. Recommended alternatives:</li>
                              <ul className="list-disc list-inside pl-4 mt-1">
                                {getSuggestedAlternatives(source.id).map((alt) => (
                                  <li key={alt}>{getSourceName(alt)}</li>
                                ))}
                              </ul>
                            </ol>
                          </div>
                          
                          <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                            <div className="font-semibold mb-1">Technical details:</div>
                            <p>{getTechnicalExplanation(source.id, errors[source.id])}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Sample words */}
                      {hasData && (
                        <div>
                          <h3 className="font-medium mb-1 text-gray-700">Sample words from this source:</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {sourceData[source.id].map((word, index) => (
                              <div 
                                key={index} 
                                className="p-2 bg-white border border-gray-200 rounded-md text-center font-mono"
                              >
                                {word}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Loading state */}
                      {!hasData && !hasError && (
                        <div className="flex justify-center items-center py-4">
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin text-gray-400" />
                          <span className="text-gray-500">Loading sample words...</span>
                        </div>
                      )}
                      
                      {/* Retry button */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => loadSourceData(source.id)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                          Test Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Summary and Help */}
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm">
            <h3 className="font-medium text-indigo-800 mb-2">Understanding Word Sources</h3>
            <p className="text-indigo-700 mb-2">
              The Word Generator app fetches word lists from online repositories. Sometimes these sources may
              be temporarily unavailable or may have changed their format, causing errors.
            </p>
            <p className="text-indigo-700">
              You can always use the Google Common Words source as a reliable fallback, as it's cached locally
              after the first successful load. If multiple sources fail, it may indicate a network connectivity
              issue or temporary GitHub API rate limiting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSourceDebugger;
