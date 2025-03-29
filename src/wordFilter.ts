import Filter from 'bad-words';

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

// Happy sources - sources of good words for the game
const HAPPY_SOURCES = {
  // Core word lists for general gameplay
  GOOGLE_COMMON: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt',
  ENABLE: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
  SCRABBLE: 'https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt',
  
  // Word frequency lists
  WORD_FREQ: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  
  // Simple words list
  SIMPLE_WORDS: 'https://raw.githubusercontent.com/taikuukaits/SimpleWords/master/words.txt',
  
  // Wordle-specific sources
  WORDLE_ALLOWED: 'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words',
  WORDLE_ANSWERS: 'https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/a9e55d7e0c08100ce62133a1fa0d9c4f0f542f2c/wordle-answers-alphabetical.txt',
  
  // Wordnik's open source wordlist for game developers
  WORDNIK: 'https://raw.githubusercontent.com/wordnik/wordlist/main/wordlist.txt',
  
  // Common English words from multiple sources (filtered)
  COMMON_MULTI: 'https://raw.githubusercontent.com/skedwards88/word_lists/main/compiled/commonWords.json',
  
  // Additional lists from requested repositories
  SINDRESORHUS: 'https://raw.githubusercontent.com/sindresorhus/word-list/main/words.txt',
  POWERLANGUAGE: 'https://raw.githubusercontent.com/powerlanguage/word-lists/master/word-list-filtered.txt',
  BROKENSANDALS: 'https://raw.githubusercontent.com/brokensandals/wordlists/master/common-5-letter-words.txt'
};

// Sad sources - sources of problematic words to filter out
const SAD_SOURCES = {
  // Names
  FIRST_NAMES: 'https://raw.githubusercontent.com/dominictarr/random-name/master/first-names.txt',
  LAST_NAMES: 'https://raw.githubusercontent.com/arineng/arincli/master/lib/last-names.txt',
  
  // Places
  COUNTRIES: 'https://raw.githubusercontent.com/umpirsky/country-list/master/data/en/country.txt',
  CITIES: 'https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json',
  
  // Technical and specialized terms
  TECH_TERMS: 'https://raw.githubusercontent.com/words/technological-terms/master/index.txt',
  MEDICAL_TERMS: 'https://raw.githubusercontent.com/glutanimate/wordlist-medicaleponyms-en/master/wordlist.txt',
  CHEMICAL_ELEMENTS: 'https://gist.githubusercontent.com/GoodmanSciences/c2dd862cd38f21b0ad36b8f96b4bf1ee/raw/1d92663004489a5b6926e944c1b3d9ec5c40900e/Periodic%2520Table%2520of%2520Elements.csv',
  
  // Slang and internet terms
  INTERNET_SLANG: 'https://raw.githubusercontent.com/both/language-dataset/master/data/internet-slang.json',
  
  // Abbreviations
  ACRONYMS: 'https://raw.githubusercontent.com/stands4/acronym-list/master/acronyms.json',
  
  // Uncommon/inappropriate words
  UNCOMMON_WORDS: 'https://raw.githubusercontent.com/skedwards88/word_lists/main/compiled/uncommonWords.json',
  OFFENSIVE_WORDS: 'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en',
  NON_US_WORDS: 'https://raw.githubusercontent.com/hyperreality/American-British-English-Translator/master/data/british_spellings.json'
};

export class WordFilter {
  private filter: Filter;
  private vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
  private problemWords: Set<string> = new Set();
  private wordCache: Map<string, string[]> = new Map();
  private errorLog: Map<string, string> = new Map();
  private problemWordsLoaded: boolean = false;

  constructor() {
    this.filter = new Filter();
    
    // Initialize problem words set from sad sources
    this.loadProblemWords();
    
    // Preload common words
    this.preloadWordCache();
  }

  private async loadProblemWords(): Promise<void> {
    console.log('Loading problem words from sources...');
    const promises = [];
    
    // Load from each sad source
    for (const [key, url] of Object.entries(SAD_SOURCES)) {
      promises.push(
        this.fetchWordList(url)
          .then(words => {
            // Process each word list appropriately
            let processedWords: string[] = [];
            
            if (key === 'CITIES' || key === 'COUNTRIES') {
              // Split multi-word place names and extract individual words
              processedWords = [];
              words.forEach(place => {
                place.split(/\s+/).forEach(word => {
                  if (word.length >= 3 && /^[a-z]+$/.test(word)) {
                    processedWords.push(word.toLowerCase());
                  }
                });
              });
            } else if (key === 'CHEMICAL_ELEMENTS' || key === 'INTERNET_SLANG' || key === 'ACRONYMS') {
              // May need special processing for JSON or CSV formatted sources
              processedWords = words.filter(word => word.length >= 3 && /^[a-z]+$/.test(word));
            } else {
              processedWords = words.filter(word => word.length >= 3 && /^[a-z]+$/.test(word));
            }
            
            // Add to problem words set
            processedWords.forEach(word => this.problemWords.add(word.toLowerCase()));
            console.log(`Added ${processedWords.length} problem words from ${key}`);
          })
          .catch(error => {
            console.error(`Error loading problem words from ${key}:`, error);
          })
      );
    }
    
    // Add some manual problematic patterns
    const addManualPatterns = () => {
      // Add common nationality/ethnicity suffixes as patterns
      const nationalitySuffixes = ['ese', 'ian', 'ish', 'ean', 'ese', 'ite', 'can', 'ani'];
      for (const suffix of nationalitySuffixes) {
        for (let i = 3; i <= 6; i++) { // Words of length 3-6 + suffix
          // Generate sample words with this pattern and add to problem words
          // This is just to catch common patterns not in our lists
          const baseLetters = 'abcdefghijklmnoprstuvwxyz';
          for (let j = 0; j < 5; j++) { // Add a few samples for each length
            let base = '';
            for (let k = 0; k < i; k++) {
              base += baseLetters.charAt(Math.floor(Math.random() * baseLetters.length));
            }
            this.problemWords.add(base + suffix);
          }
        }
      }
      
      // Add common technical suffixes
      const technicalSuffixes = ['ium', 'ide', 'ate', 'ite', 'ene', 'ase', 'one', 'ane', 'ene', 'yne', 'ol', 'yl', 'ose'];
      for (const suffix of technicalSuffixes) {
        for (let i = 3; i <= 5; i++) {
          const baseLetters = 'abcdefghijklmnoprstuvwxyz';
          for (let j = 0; j < 3; j++) {
            let base = '';
            for (let k = 0; k < i; k++) {
              base += baseLetters.charAt(Math.floor(Math.random() * baseLetters.length));
            }
            this.problemWords.add(base + suffix);
          }
        }
      }
      
      // Add common place name endings
      const placeSuffixes = ['land', 'ville', 'town', 'burg', 'berg', 'shire', 'port', 'ford', 'ham', 'ton'];
      for (const suffix of placeSuffixes) {
        for (let i = 3; i <= 5; i++) {
          const baseLetters = 'abcdefghijklmnoprstuvwxyz';
          for (let j = 0; j < 3; j++) {
            let base = '';
            for (let k = 0; k < i; k++) {
              base += baseLetters.charAt(Math.floor(Math.random() * baseLetters.length));
            }
            this.problemWords.add(base + suffix);
          }
        }
      }
    };
    
    // Wait for all promises to resolve
    await Promise.allSettled(promises);
    
    // Add manual patterns
    addManualPatterns();
    
    console.log(`Total problem words loaded: ${this.problemWords.size}`);
    this.problemWordsLoaded = true;
  }

  private async preloadWordCache(): Promise<void> {
    try {
      const commonWords = await this.fetchWordList(HAPPY_SOURCES.GOOGLE_COMMON);
      
      // Pre-filter the common words to improve quality
      const filteredCommonWords = commonWords.filter(word => {
        // Ensure word is 3-9 letters long
        if (word.length < 3 || word.length > 9) return false;
        
        // Ensure word contains at least one vowel
        if (!this.hasVowel(word)) return false;
        
        // Ensure word doesn't have excessive repetition
        if (this.hasExcessiveRepetition(word)) return false;
        
        return true;
      });
      
      this.wordCache.set('google_common', filteredCommonWords);
      console.log('Preloaded Google common words:', filteredCommonWords.length);
    } catch (error) {
      console.error('Failed to preload Google common words cache:', error);
      this.errorLog.set('google_common', error instanceof Error ? error.message : String(error));
      
      // Try the ENABLE list as a fallback
      try {
        const enableWords = await this.fetchWordList(HAPPY_SOURCES.ENABLE);
        
        // Apply the same pre-filtering to the enable words
        const filteredEnableWords = enableWords.filter(word => {
          if (word.length < 3 || word.length > 9) return false;
          if (!this.hasVowel(word)) return false;
          if (this.hasExcessiveRepetition(word)) return false;
          return true;
        });
        
        this.wordCache.set('google_common', filteredEnableWords); // Use as fallback
        console.log('Preloaded ENABLE words as fallback:', filteredEnableWords.length);
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
      
      // Handle different file formats
      if (url.endsWith('.json')) {
        try {
          // Try to parse JSON
          const jsonData = JSON.parse(text);
          
          // Handle different JSON formats
          if (Array.isArray(jsonData)) {
            // If it's an array, extract words or names directly
            words = jsonData.map(item => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item.name) return item.name;
              if (typeof item === 'object' && item.word) return item.word;
              if (typeof item === 'object' && item.term) return item.term;
              if (typeof item === 'object' && item.acronym) return item.acronym;
              return '';
            }).filter(Boolean);
          } else if (typeof jsonData === 'object') {
            // If it's an object, extract values
            words = Object.values(jsonData)
              .map(item => typeof item === 'string' ? item : '')
              .filter(Boolean);
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
          // Fall back to treating as text
          words = text.split(/[\r\n]+/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);
        }
      } else if (url.endsWith('.csv')) {
        // Handle CSV format
        words = text.split(/\r?\n/)
          .map(line => {
            const parts = line.split(',');
            return parts[0] || ''; // Take first column as the word
          })
          .filter(word => word.length > 0);
      } else {
        // Text format handling
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

  // Get error messages for debugging
  getErrorLog(): Map<string, string> {
    return this.errorLog;
  }

  // Get the word cache for debugging
  getWordCache(): Map<string, string[]> {
    return this.wordCache;
  }

  private hasVowel(word: string): boolean {
    return word.split('').some(letter => this.vowels.has(letter));
  }

  private hasExcessiveRepetition(word: string): boolean {
    // Count occurrences of each letter
    const letterCounts = new Map<string, number>();
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
    
    // Get the most frequent letter and its count
    let maxChar = '';
    let maxCount = 0;
    letterCounts.forEach((count, char) => {
      if (count > maxCount) {
        maxCount = count;
        maxChar = char;
      }
    });
    
    // Check if any letter exceeds half the word length
    if (maxCount > Math.floor(word.length / 2)) {
      return true;
    }
    
    // Rule: If half the letters are the same, another letter cannot appear more than once
    if (maxCount >= Math.floor(word.length / 2)) {
      // Check if any other letter appears more than once
      let otherLetterMultiples = false;
      letterCounts.forEach((count, char) => {
        if (char !== maxChar && count > 1) {
          otherLetterMultiples = true;
        }
      });
      return otherLetterMultiples;
    }
    
    return false;
  }

  private hasUncommonLetterPatterns(word: string): boolean {
    // Check for uncommon letter patterns
    const uncommonPatterns = [
      /[qwxz]{2,}/, // Two or more q, w, x, or z in a row
      /[jzxq][jzxq]/, // Two j, z, x, or q adjacent
      /^[qwxzj]/, // Words starting with q, w, x, z, j (many are uncommon or proper nouns)
      /^[^aeiouy]{3,}/, // Words starting with 3+ consonants (often abbreviations or non-English)
      /[^aeiouy]{4,}/ // Four or more consecutive consonants anywhere in the word
    ];
    
    return uncommonPatterns.some(pattern => word.match(pattern));
  }

  private isUKSpelling(word: string): boolean {
    // Check for common UK spelling patterns
    const ukPatterns = [
      /our$/, // as in colour/color
      /ise$/, // as in realise/realize
      /yse$/, // as in analyse/analyze
      /re$/, // as in centre/center
      /ogue$/, // as in catalogue/catalog
      /ae/, // as in anaemia/anemia
      /oe/ // as in oesophagus/esophagus
    ];
    
    return ukPatterns.some(pattern => word.match(pattern));
  }

  validateWord(word: string): WordValidationResult {
    if (!word || typeof word !== 'string') {
      return { isValid: false, reason: 'Invalid input' };
    }

    word = word.toLowerCase().trim();

    // Basic validation checks
    if (!word.match(/^[a-z]+$/)) {
      return { isValid: false, reason: 'Word must contain only letters' };
    }

    if (word.length < 3 || word.length > 9) {
      return { isValid: false, reason: 'Word must be between 3 and 9 letters' };
    }

    // Profanity check
    if (this.filter.isProfane(word)) {
      return { isValid: false, reason: 'Word is inappropriate' };
    }

    // Vowel check
    if (!this.hasVowel(word)) {
      return { isValid: false, reason: 'Word must contain at least one vowel' };
    }

    // Letter repetition check
    if (this.hasExcessiveRepetition(word)) {
      return { isValid: false, reason: 'Word has problematic letter repetition' };
    }

    // Check against problem words list
    if (this.problemWordsLoaded && this.problemWords.has(word)) {
      return { isValid: false, reason: 'Word is in the problematic words list' };
    }

    // UK spelling check
    if (this.isUKSpelling(word)) {
      return { isValid: false, reason: 'UK spelling variant' };
    }

    // Uncommon letter patterns check
    if (this.hasUncommonLetterPatterns(word)) {
      return { isValid: false, reason: 'Contains uncommon letter patterns' };
    }

    return { isValid: true };
  }

  getAvailableSources(): WordSource[] {
    return [
      {
        id: 'google_common',
        name: 'Google Common Words',
        description: 'Top 10,000 most frequently used words in American English'
      },
      {
        id: 'wordle_answers',
        name: 'Wordle Answer Words',
        description: 'Words that have been used as answers in the official Wordle game'
      },
      {
        id: 'wordle_allowed',
        name: 'Wordle Allowed Words',
        description: 'All words accepted as valid guesses in Wordle'
      },
      {
        id: 'wordnik',
        name: 'Wordnik Game Words',
        description: 'Curated list of words specifically for word games (from Wordnik)'
      },
      {
        id: 'common_multi',
        name: 'Multi-Source Common Words',
        description: 'Common words verified across multiple dictionaries and sources'
      },
      {
        id: 'enable',
        name: 'ENABLE Dictionary',
        description: 'Enhanced North American Benchmark Lexicon (standard word game dictionary)'
      },
      {
        id: 'scrabble',
        name: 'Scrabble Words',
        description: 'Words allowed in Scrabble games (filtered for common words)'
      },
      {
        id: 'word_freq',
        name: 'Word Frequency List',
        description: 'Words sorted by frequency of usage in English'
      },
      {
        id: 'simple_words',
        name: 'Simple English Words',
        description: 'Basic vocabulary with common, easy-to-guess words'
      },
      {
        id: 'sindresorhus',
        name: 'Sindre Sorhus Word List',
        description: 'Filtered list of English words with profanity removed'
      },
      {
        id: 'powerlanguage',
        name: 'Powerlanguage Word List',
        description: 'Filtered list by Wordle creator - good for word games'
      },
      {
        id: 'brokensandals',
        name: '5-Letter Common Words',
        description: 'Curated list of common 5-letter words ideal for word games'
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
      // Determine the URL based on source ID
      let url: string;
      
      switch (source) {
        case 'google_common':
          url = HAPPY_SOURCES.GOOGLE_COMMON;
          break;
        case 'enable':
          url = HAPPY_SOURCES.ENABLE;
          break;
        case 'scrabble':
          url = HAPPY_SOURCES.SCRABBLE;
          break;
        case 'word_freq':
          url = HAPPY_SOURCES.WORD_FREQ;
          break;
        case 'simple_words':
          url = HAPPY_SOURCES.SIMPLE_WORDS;
          break;
        case 'wordle_answers':
          url = HAPPY_SOURCES.WORDLE_ANSWERS;
          break;
        case 'wordle_allowed':
          url = HAPPY_SOURCES.WORDLE_ALLOWED;
          break;
        case 'wordnik':
          url = HAPPY_SOURCES.WORDNIK;
          break;
        case 'common_multi':
          url = HAPPY_SOURCES.COMMON_MULTI;
          break;
        case 'sindresorhus':
          url = HAPPY_SOURCES.SINDRESORHUS;
          break;
        case 'powerlanguage':
          url = HAPPY_SOURCES.POWERLANGUAGE;
          break;
        case 'brokensandals':
          url = HAPPY_SOURCES.BROKENSANDALS;
          break;
        default:
          url = HAPPY_SOURCES.GOOGLE_COMMON;
      }
      
      // Fetch the word list
      const words = await this.fetchWordList(url);
      
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
      
      // Try to fall back to google_common if available
      if (source !== 'google_common' && this.wordCache.has('google_common')) {
        console.log(`Falling back to google_common words for ${source}`);
        const commonWords = this.wordCache.get('google_common') || [];
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
      // Make sure problem words are loaded
      if (!this.problemWordsLoaded) {
        await this.loadProblemWords();
      }
      
      // Fetch word list
      let wordsList = await this.fetchWordListBySource(source);

      // Filter by length
      wordsList = wordsList.filter(word => word.length === length);
      
      if (wordsList.length === 0) {
        throw new Error(`No words of length ${length} found in the selected source.`);
      }
      
      // Filter by validation rules
      const validWords = wordsList.filter(word => this.validateWord(word).isValid);

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
    
    // Make sure problem words are loaded
    if (!this.problemWordsLoaded) {
      await this.loadProblemWords();
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
}
