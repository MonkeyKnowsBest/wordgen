import Filter from 'bad-words';
import nlp from 'compromise';

export interface WordValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface WordSource {
  id: string;
  name: string;
  description: string;
}

// Word corpora URLs - Updated with more reliable sources
const WORD_CORPORA = {
  // Google's 10000 most common English words
  COMMON_WORDS: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt',
  // Specialized corpus sources - more reliable GitHub repos
  NOUNS: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/words/nouns.json',
  VERBS: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/words/verbs.json',
  ADJECTIVES: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/words/adjectives.json',
  ADVERBS: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/words/adverbs.json',
  // Additional sources
  GSL_WORDS: 'https://raw.githubusercontent.com/openvocabulary/gsl/master/gsl.txt',
  SCOWL_COMMON: 'https://raw.githubusercontent.com/en-wl/wordlist/master/scowl/final/english-words.35',
  BNC_COMMON: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt',
  // Fallout terminal hacking wordlist - updated to a more reliable source
  FALLOUT_WORDS: 'https://raw.githubusercontent.com/nathanlesage/academics/master/randomdata/fallout-terminal-words.txt'
};

export class WordFilter {
  private filter: Filter;
  private vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
  private ukSpellingPatterns = [
    'our', // as in colour/color
    'ise', // as in realise/realize
    'yse', // as in analyse/analyze
    're$', // as in centre/center
    'ogue$', // as in catalogue/catalog
    'ae', // as in anaemia/anemia
    'oe', // as in oesophagus/esophagus
  ];
  private wordCache: Map<string, string[]> = new Map();

  constructor() {
    this.filter = new Filter();
    // Preload common words
    this.preloadWordCache();
  }

  private async preloadWordCache(): Promise<void> {
    try {
      const commonWords = await this.fetchWordList(WORD_CORPORA.COMMON_WORDS);
      this.wordCache.set('common', commonWords);
    } catch (error) {
      console.error('Failed to preload word cache:', error);
    }
  }

  private async fetchWordList(url: string): Promise<string[]> {
    // Check for cached response in localStorage first
    const cacheKey = `wordlist_${url.split('/').pop()}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        // Cache is valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log(`Using cached word list for ${url}`);
          return data;
        }
      } catch (e) {
        // If there's any error parsing the cached data, ignore and fetch fresh
        console.warn('Error parsing cached data, fetching fresh');
      }
    }
    
    // Fetch from URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch word list: ${response.status}`);
      }
      
      let text = await response.text();
      let words: string[] = [];
      
      // Handle JSON format for dariusk/corpora sources
      if (url.includes('dariusk/corpora') && url.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(text);
          // Different JSON formats based on the source
          if (url.includes('nouns.json')) {
            words = jsonData.nouns || [];
          } else if (url.includes('verbs.json')) {
            words = jsonData.verbs || [];
          } else if (url.includes('adjectives.json')) {
            words = jsonData.adjectives || [];
          } else if (url.includes('adverbs.json')) {
            words = jsonData.adverbs || [];
          } else {
            // Generic fallback
            words = Array.isArray(jsonData) ? jsonData : 
                   (jsonData.data || jsonData.words || []);
          }
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          throw new Error('Invalid JSON format in word list');
        }
      } else {
        // Plain text format
        words = text.split(/\r?\n/)
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0);
      }
      
      // Filter to only include valid words (letters only)
      const filteredWords = words
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0 && /^[a-z]+$/.test(word));
      
      if (filteredWords.length === 0) {
        throw new Error('No valid words found in the word list');
      }
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data: filteredWords,
        timestamp: Date.now()
      }));
      
      return filteredWords;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please try again later.');
      }
      throw fetchError;
    }
  }

  private hasVowel(word: string): boolean {
    return word.split('').some(letter => this.vowels.has(letter));
  }

  private hasExcessiveRepetition(word: string): boolean {
    const letterCounts = new Map<string, number>();
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
    
    const maxCount = Math.max(...Array.from(letterCounts.values()));
    return maxCount >= word.length / 2;
  }

private isAbbreviation(word: string): boolean {
  // Enhanced abbreviation detection
  
  // Check for consonant-heavy words (potential acronyms)
  const consonants = word.split('').filter(c => !this.vowels.has(c)).length;
  if (consonants > word.length * 0.7) {
    return true;
  }
  
  // Check for common abbreviation patterns
  if (word.length <= 3 && consonants >= 2) {
    return true;  // Short words with mostly consonants are likely abbreviations
  }
  
  // Check for all caps words - simple approach for acronyms
  if (word.toUpperCase() === word && word.length > 1) {
    return true;
  }

// Look for patterns where vowels are isolated between consonants
  const vowelGroups = word.match(/[aeiouy]+/g) || [];
  if (vowelGroups.length >= 3 && vowelGroups.every(g => g.length === 1)) {
    return true;  // Words like "wtf", "omg" when spelled out
  }
  
  return false;
  }
    
    // Look for patterns where vowels are isolated between consonants
    const vowelGroups = word.match(/[aeiouy]+/g) || [];
    if (vowelGroups.length >= 3 && vowelGroups.every(g => g.length === 1)) {
      return true;  // Words like "wtf", "omg" when spelled out
    }
    
    return false;
  }

  private hasUKSpelling(word: string): boolean {
    return this.ukSpellingPatterns.some(pattern => 
      word.match(new RegExp(pattern, 'i'))
    );
  }

  private isProperNoun(word: string): boolean {
    const doc = nlp(word);
    return doc.terms().some(t => t.isProperNoun());
  }

  private isPlaceName(word: string): boolean {
    const doc = nlp(word);
    return doc.places().length > 0;
  }

  validateWord(word: string): WordValidationResult {
    if (!word || typeof word !== 'string') {
      return { isValid: false, reason: 'Invalid input' };
    }

    word = word.toLowerCase().trim();

    if (!word.match(/^[a-z]+$/)) {
      return { isValid: false, reason: 'Word must contain only letters' };
    }

    if (word.length < 3 || word.length > 9) {
      return { isValid: false, reason: 'Word must be between 3 and 9 letters' };
    }

    if (this.filter.isProfane(word)) {
      return { isValid: false, reason: 'Word is inappropriate' };
    }

    if (!this.hasVowel(word)) {
      return { isValid: false, reason: 'Word must contain at least one vowel' };
    }

    if (this.hasExcessiveRepetition(word)) {
      return { isValid: false, reason: 'Word has too many repeated letters' };
    }

    if (this.isAbbreviation(word)) {
      return { isValid: false, reason: 'Word appears to be an abbreviation or acronym' };
    }

    if (this.hasUKSpelling(word)) {
      return { isValid: false, reason: 'UK spelling variant' };
    }

    // Additional check: Filter out very uncommon combinations of letters
    const uncommonPatterns = [
      /[qwx]{2,}/, // Two or more q, w, or x in a row
      /[jzx][jzx]/, // Two j, z, or x adjacent
      /^[qwxzj]/, // Words starting with q, w, x, z, j (many are uncommon or proper nouns)
      /^[^aeiouy]{3,}/ // Words starting with 3+ consonants (often abbreviations or non-English)
    ];
    
    if (uncommonPatterns.some(pattern => word.match(pattern))) {
      return { isValid: false, reason: 'Contains uncommon letter patterns' };
    }

    return { isValid: true };
  }

  getAvailableSources(): WordSource[] {
    return [
      {
        id: 'common',
        name: 'Google Common Words',
        description: 'Most frequently used words in American English from Google corpus'
      },
      {
        id: 'nouns',
        name: 'Common Nouns',
        description: 'Everyday objects, concepts, and things'
      },
      {
        id: 'verbs',
        name: 'Action Verbs',
        description: 'Words that describe actions and activities'
      },
      {
        id: 'adjectives',
        name: 'Adjectives',
        description: 'Words that describe qualities and characteristics'
      },
      {
        id: 'adverbs',
        name: 'Adverbs',
        description: 'Words that modify verbs, adjectives, or other adverbs'
      },
      // Additional sources
      {
        id: 'gsl',
        name: 'General Service List',
        description: 'About 2,000 words for English language learners'
      },
      {
        id: 'scowl',
        name: 'SCOWL Common',
        description: 'Common words from Spell Checker Oriented Word Lists'
      },
      {
        id: 'bnc',
        name: 'BNC Common Words',
        description: 'Common words from the British National Corpus'
      },
      {
        id: 'fallout',
        name: 'Fallout Terminal Words',
        description: 'Words from Fallout\'s terminal hacking minigame'
      }
    ];
  }

  /**
   * Helper method to fetch word list by source ID
   */
  private async fetchWordListBySource(source: string): Promise<string[]> {
    // Check cache first
    if (this.wordCache.has(source)) {
      return this.wordCache.get(source) || [];
    }
    
    // Determine the URL based on source
    let url: string;
    switch (source) {
      case 'common':
        url = WORD_CORPORA.COMMON_WORDS;
        break;
      case 'nouns':
        url = WORD_CORPORA.NOUNS;
        break;
      case 'verbs':
        url = WORD_CORPORA.VERBS;
        break;
      case 'adjectives':
        url = WORD_CORPORA.ADJECTIVES;
        break;
      case 'adverbs':
        url = WORD_CORPORA.ADVERBS;
        break;
      case 'gsl':
        url = WORD_CORPORA.GSL_WORDS;
        break;
      case 'scowl':
        url = WORD_CORPORA.SCOWL_COMMON;
        break;
      case 'bnc':
        url = WORD_CORPORA.BNC_COMMON;
        break;
      case 'fallout':
        url = WORD_CORPORA.FALLOUT_WORDS;
        break;
      default:
        url = WORD_CORPORA.COMMON_WORDS;
    }
    
    // Fetch the word list
    const wordsList = await this.fetchWordList(url);
    
    // Cache the result
    this.wordCache.set(source, wordsList);
    
    return wordsList;
  }

  /**
   * Generate words from a single source
   * @param length Word length
   * @param source Source ID
   * @param count Maximum number of words to return
   * @returns Array of words matching the criteria
   */
  async generateWords(length: number, source: string, count: number = 50): Promise<string[]> {
    try {
      let wordsList: string[] = [];
      
      // Fetch word list
      wordsList = await this.fetchWordListBySource(source);

      // Filter by length and validation
      const validWords = wordsList.filter(word => 
        word.length === length && this.validateWord(word).isValid
      );

      if (validWords.length === 0) {
        throw new Error(`No valid words of length ${length} found in the selected source.`);
      }

      // Randomly select up to 'count' words
      const resultWords = new Set<string>();
      const availableWords = [...validWords]; // Create a copy to avoid modifying the original
      
      // If we don't have enough words, return all valid ones
      if (availableWords.length <= count) {
        return availableWords;
      }
      
      // Randomly select words without replacement
      while (resultWords.size < count && availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        resultWords.add(availableWords[randomIndex]);
        availableWords.splice(randomIndex, 1);
      }

      return Array.from(resultWords);
    } catch (error) {
      console.error('Error generating words:', error);
      throw error;
    }
  }

  /**
   * Generate words from multiple sources
   * @param length Word length
   * @param sources Array of source IDs
   * @param count Maximum number of words to return (default: 100)
   * @returns Object containing array of words and failed sources
   */
  async generateWordsFromMultipleSources(length: number, sources: string[], count: number = 100): Promise<{words: string[], failedSources: string[]} | string[]> {
    if (sources.length === 0) {
      throw new Error('At least one word source must be selected');
    }
    
    // Fetch and combine words from all selected sources
    const allWords: Set<string> = new Set(); // Using a Set to avoid duplicates
    const failedSources: string[] = [];
    
    try {
      // Process each source
      for (const source of sources) {
        try {
          const sourceWords = await this.fetchWordListBySource(source);
          
          // Filter words by length before adding to the set to improve performance
          const validLengthWords = sourceWords.filter(word => word.length === length);
          validLengthWords.forEach(word => allWords.add(word));
          
        } catch (error) {
          console.error(`Error fetching words from source ${source}:`, error);
          failedSources.push(source);
          // Continue with other sources if one fails
        }
      }
      
      // Convert set back to array for further processing
      let wordsArray = Array.from(allWords);
      
      // Filter by validation criteria
      const validWords = wordsArray.filter(word => this.validateWord(word).isValid);

      if (validWords.length === 0) {
        if (failedSources.length === sources.length) {
          throw new Error(`Could not fetch words from any of the selected sources. Please try again later.`);
        } else {
          throw new Error(`No valid words of length ${length} found in the selected sources.`);
        }
      }

      // Randomly select up to 'count' words
      const resultWords = new Set<string>();
      const availableWords = [...validWords]; // Create a copy to avoid modifying the original
      
      // If we don't have enough words, return all valid ones
      if (availableWords.length <= count) {
        return {
          words: availableWords,
          failedSources
        };
      }
      
      // Randomly select words without replacement
      while (resultWords.size < count && availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        resultWords.add(availableWords[randomIndex]);
        availableWords.splice(randomIndex, 1);
      }

      return {
        words: Array.from(resultWords),
        failedSources
      };
    } catch (error) {
      console.error('Error generating words from multiple sources:', error);
      throw error;
    }
  }
}
