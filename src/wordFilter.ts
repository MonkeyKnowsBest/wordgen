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

export interface WordGenerationResult {
  words: string[];
  failedSources: string[];
}

// Updated Word corpora URLs - Only using simple TXT format sources
const WORD_CORPORA = {
  // Primary sources - all TXT format
  COMMON_WORDS: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt',
  ENABLE_WORDS: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt', 
  SCRABBLE_WORDS: 'https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt',
  UNIX_WORDS: 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
};

// Word category patterns - Used for identifying word types
const WORD_CATEGORIES = {
  NOUN_PATTERNS: [
    /[^aeiou]tion$/, /ment$/, /ence$/, /ance$/, /ity$/, /ness$/,
    /ship$/, /dom$/, /hood$/, /ism$/
  ],
  VERB_PATTERNS: [
    /[aeiou]te$/, /ize$/, /ise$/, /ify$/, /ate$/,
    /^re[^aeiou]/, /[aeiou]n$/, /[^aeiou]er$/
  ],
  ADJECTIVE_PATTERNS: [
    /ful$/, /ous$/, /ive$/, /ble$/, /cal$/, /ary$/,
    /ic$/, /al$/, /ish$/, /like$/
  ],
  ADVERB_PATTERNS: [
    /ly$/ // Most common adverb pattern
  ]
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
  private errorLog: Map<string, string> = new Map(); // Track specific error messages per source

  constructor() {
    this.filter = new Filter();
    // Preload common words
    this.preloadWordCache();
  }

  // Get error messages for debugging
  getErrorLog(): Map<string, string> {
    return this.errorLog;
  }

  private async preloadWordCache(): Promise<void> {
    try {
      const commonWords = await this.fetchWordList(WORD_CORPORA.COMMON_WORDS);
      this.wordCache.set('common', commonWords);
      console.log('Preloaded common words:', commonWords.length);
    } catch (error) {
      console.error('Failed to preload common words cache:', error);
      this.errorLog.set('common', error instanceof Error ? error.message : String(error));
      
      // Try the ENABLE list as a fallback
      try {
        const enableWords = await this.fetchWordList(WORD_CORPORA.ENABLE_WORDS);
        this.wordCache.set('common', enableWords); // Use it as the common words source
        console.log('Preloaded ENABLE words as fallback:', enableWords.length);
      } catch (fallbackError) {
        console.error('Failed to preload fallback word cache:', fallbackError);
      }
    }
  }

  private async fetchWordList(url: string): Promise<string[]> {
    // Check for cached response in localStorage first
    const cacheKey = `wordlist_${url.split('/').pop()}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        // Cache is valid for 7 days
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      console.log(`Fetching word list from ${url}`);
      const response = await fetch(url, { 
        signal: controller.signal,
        // Add headers to avoid caching issues
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch word list: ${response.status} ${response.statusText}`);
      }
      
      let text = await response.text();
      let words: string[] = [];
      
      // Plain text format - handle various formats
      if (text.includes('\n')) {
        // Line-separated format (most common)
        words = text.split(/\r?\n/)
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0);
      } else if (text.includes(',')) {
        // Comma-separated format
        words = text.split(',')
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0);
      } else if (text.includes(' ')) {
        // Space-separated format
        words = text.split(/\s+/)
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0);
      } else {
        // Single word or unknown format
        words = [text.trim().toLowerCase()];
      }
      
      // Filter to only include valid words (letters only)
      const filteredWords = words
        .filter(word => word.length > 0 && /^[a-z]+$/.test(word));
      
      console.log(`Filtered ${words.length} words to ${filteredWords.length} valid words from ${url}`);
      
      if (filteredWords.length === 0) {
        throw new Error(`No valid words found in the word list from ${url}`);
      }
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data: filteredWords,
        timestamp: Date.now()
      }));
      
      return filteredWords;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Error fetching from ${url}:`, fetchError);
      
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

  // Check if a word appears to be of a specific category
  private detectWordCategory(word: string): {
    isNoun: boolean;
    isVerb: boolean;
    isAdjective: boolean;
    isAdverb: boolean;
  } {
    // Use word patterns to identify likely parts of speech
    const isNoun = WORD_CATEGORIES.NOUN_PATTERNS.some(pattern => word.match(pattern));
    const isVerb = WORD_CATEGORIES.VERB_PATTERNS.some(pattern => word.match(pattern));
    const isAdjective = WORD_CATEGORIES.ADJECTIVE_PATTERNS.some(pattern => word.match(pattern));
    const isAdverb = WORD_CATEGORIES.ADVERB_PATTERNS.some(pattern => word.match(pattern));
    
    return {
      isNoun,
      isVerb,
      isAdjective,
      isAdverb
    };
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
        name: 'Common English Words',
        description: 'Most frequently used words in American English'
      },
      {
        id: 'enable',
        name: 'ENABLE Word List',
        description: 'Enhanced North American Benchmark Lexicon'
      },
      {
        id: 'scrabble',
        name: 'Scrabble Words',
        description: 'Words allowed in Scrabble games'
      },
      {
        id: 'unix',
        name: 'UNIX Words',
        description: 'Comprehensive dictionary from Linux/Unix systems'
      },
      {
        id: 'nouns',
        name: 'Common Nouns',
        description: 'Words for everyday objects and concepts (derived from general lists)'
      },
      {
        id: 'verbs',
        name: 'Action Verbs',
        description: 'Words that describe actions and activities (derived from general lists)'
      },
      {
        id: 'adjectives',
        name: 'Adjectives',
        description: 'Words that describe qualities and characteristics (derived from general lists)'
      },
      {
        id: 'adverbs',
        name: 'Adverbs',
        description: 'Words that modify verbs, adjectives, or other adverbs (derived from general lists)'
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
    
    try {
      // Determine the URL based on source
      let url: string;
      let words: string[] = [];
      let shouldFilter = false;
      
      switch (source) {
        case 'common':
          url = WORD_CORPORA.COMMON_WORDS;
          break;
        case 'enable':
          url = WORD_CORPORA.ENABLE_WORDS;
          break;
        case 'scrabble':
          url = WORD_CORPORA.SCRABBLE_WORDS;
          break;
        case 'unix':
          url = WORD_CORPORA.UNIX_WORDS;
          break;
        case 'nouns':
        case 'verbs': 
        case 'adjectives':
        case 'adverbs':
          // For these categories, we'll use the ENABLE list and filter it
          url = WORD_CORPORA.ENABLE_WORDS;
          shouldFilter = true;
          break;
        default:
          url = WORD_CORPORA.COMMON_WORDS;
      }
      
      // Fetch the word list
      words = await this.fetchWordList(url);
      
      // If this is a category that needs filtering
      if (shouldFilter) {
        // Try to get enable list from cache, or use the words we just fetched
        const baseWords = this.wordCache.get('enable') || words;
        
        // Filter by category
        words = baseWords.filter(word => {
          const categories = this.detectWordCategory(word);
          switch (source) {
            case 'nouns': return categories.isNoun;
            case 'verbs': return categories.isVerb;
            case 'adjectives': return categories.isAdjective;
            case 'adverbs': return categories.isAdverb;
            default: return true;
          }
        });
        
        console.log(`Filtered ${baseWords.length} words to ${words.length} ${source}`);
      }
      
      // Cache the result
      this.wordCache.set(source, words);
      
      // Clear any previous errors for this source
      if (this.errorLog.has(source)) {
        this.errorLog.delete(source);
      }
      
      return words;
    } catch (error) {
      console.error(`Error fetching words from source ${source}:`, error);
      
      // Record the specific error for debugging
      this.errorLog.set(source, error instanceof Error ? error.message : String(error));
      
      // Try to fall back to common words if available
      if (source !== 'common' && this.wordCache.has('common')) {
        console.log(`Falling back to common words for ${source}`);
        const commonWords = this.wordCache.get('common') || [];
        
        // For specialized categories, try to filter common words appropriately
        if (['nouns', 'verbs', 'adjectives', 'adverbs'].includes(source)) {
          const filtered = commonWords.filter(word => {
            const categories = this.detectWordCategory(word);
            switch (source) {
              case 'nouns': return categories.isNoun;
              case 'verbs': return categories.isVerb;
              case 'adjectives': return categories.isAdjective;
              case 'adverbs': return categories.isAdverb;
              default: return true;
            }
          });
          
          if (filtered.length > 0) {
            console.log(`Successfully created fallback for ${source} with ${filtered.length} words`);
            this.wordCache.set(source, filtered);
            return filtered;
          }
        }
        
        // If we couldn't filter or it's not a specialized category, just return common words
        this.wordCache.set(source, commonWords);
        return commonWords;
      }
      
      throw error; // Re-throw if we couldn't recover
    }
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
  async generateWordsFromMultipleSources(
    length: number, 
    sources: string[], 
    count: number = 100
  ): Promise<WordGenerationResult> {
    if (sources.length === 0) {
      throw new Error('At least one word source must be selected');
    }
    
    // Fetch and combine words from all selected sources
    const allWords: Set<string> = new Set(); // Using a Set to avoid duplicates
    const failedSources: string[] = [];
    const successSources: string[] = [];
    
    try {
      // Process each source
      for (const source of sources) {
        try {
          const sourceWords = await this.fetchWordListBySource(source);
          
          // Filter words by length before adding to the set to improve performance
          const validLengthWords = sourceWords.filter(word => word.length === length);
          
          if (validLengthWords.length > 0) {
            validLengthWords.forEach(word => allWords.add(word));
            successSources.push(source);
            console.log(`Added ${validLengthWords.length} words from source ${source}`);
          } else {
            console.warn(`No words of length ${length} found in source ${source}`);
            failedSources.push(source);
          }
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
      console.log(`Filtered ${wordsArray.length} words to ${validWords.length} valid words`);

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

  // For debugging purposes - to see what's being loaded
  getWordCache(): Map<string, string[]> {
    return this.wordCache;
  }
}
