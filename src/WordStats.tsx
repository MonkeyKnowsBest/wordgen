import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface WordStatsProps {
  words: string[];
}

const WordStats: React.FC<WordStatsProps> = ({ words }) => {
  const stats = useMemo(() => {
    if (!words.length) return null;
    
    // Calculate letter frequencies
    const letterFrequency: Record<string, number> = {};
    let totalLetters = 0;
    
    words.forEach(word => {
      word.split('').forEach(letter => {
        letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        totalLetters++;
      });
    });
    
    // Calculate vowel percentage
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    const vowelCount = vowels.reduce((sum, vowel) => sum + (letterFrequency[vowel] || 0), 0);
    const vowelPercentage = Math.round((vowelCount / totalLetters) * 100);
    
    // Find most common letter
    let mostCommonLetter = '';
    let mostCommonCount = 0;
    
    Object.entries(letterFrequency).forEach(([letter, count]) => {
      if (count > mostCommonCount) {
        mostCommonLetter = letter;
        mostCommonCount = count;
      }
    });

    // Calculate source distribution (if we had source info per word)
    
    // Calculate unique words count
    const uniqueCount = new Set(words).size;
    
    return {
      totalWords: words.length,
      uniqueWords: uniqueCount,
      averageLength: Math.round((totalLetters / words.length) * 10) / 10,
      vowelPercentage,
      mostCommonLetter,
      mostCommonLetterCount: mostCommonCount
    };
  }, [words]);
  
  if (!stats) return null;
  
  return (
    <div className="mt-6 p-4 bg-indigo-50 rounded-md border border-indigo-100">
      <h3 className="text-sm font-medium text-indigo-800 flex items-center mb-3">
        <BarChart3 className="h-4 w-4 mr-2" />
        Word Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-700">{stats.totalWords}</div>
          <div className="text-xs text-indigo-600">Total Words</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-700">{stats.uniqueWords}</div>
          <div className="text-xs text-indigo-600">Unique Words</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-700">{stats.averageLength}</div>
          <div className="text-xs text-indigo-600">Avg. Length</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-700">{stats.vowelPercentage}%</div>
          <div className="text-xs text-indigo-600">Vowels</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-indigo-700">{stats.mostCommonLetter}</div>
          <div className="text-xs text-indigo-600">Most Common Letter</div>
        </div>
      </div>
    </div>
  );
};

export default WordStats;

export default WordStats;
