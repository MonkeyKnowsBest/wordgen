import { useState, useEffect, useCallback } from 'react';
import { WordFilter, WordSource } from './wordFilter';

interface UseWordGeneratorReturn {
  sources: WordSource[];
  generatedWords: string[];
  isLoading: boolean;
  error: string | null;
  generateWords: (length: number, selectedSources: string[]) => Promise<void>;
}

export function useWordGenerator(): UseWordGeneratorReturn {
  const [wordFilter] = useState<WordFilter>(() => new WordFilter());
  const [sources, setSources] = useState<WordSource[]>([]);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize sources
  useEffect(() => {
    setSources(wordFilter.getAvailableSources());
  }, [wordFilter]);
  
  // Function to generate words from multiple sources
  const generateWords = useCallback(async (length: number, selectedSources: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure at least one source is selected
      if (selectedSources.length === 0) {
        throw new Error('Please select at least one word source');
      }
      
      // Generate words from each selected source
      const allWords = await wordFilter.generateWordsFromMultipleSources(length, selectedSources, 100);
      setGeneratedWords(allWords);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to generate words. Please try again later.');
      }
      console.error('Error generating words:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wordFilter]);
  
  return {
    sources,
    generatedWords,
    isLoading,
    error,
    generateWords
  };
}
