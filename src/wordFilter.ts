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

  constructor() {
    this.filter = new Filter();
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
    const consonants = word.split('').filter(c => !this.vowels.has(c)).length;
    return consonants > word.length * 0.7;
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
      return { isValid: false, reason: 'Word appears to be an abbreviation' };
    }

    if (this.hasUKSpelling(word)) {
      return { isValid: false, reason: 'UK spelling variant' };
    }

    if (this.isProperNoun(word)) {
      return { isValid: false, reason: 'Proper noun' };
    }

    if (this.isPlaceName(word)) {
      return { isValid: false, reason: 'Place name' };
    }

    const doc = nlp(word);
    if (!doc.terms().some(t => t.isWord())) {
      return { isValid: false, reason: 'Not a recognized word' };
    }

    return { isValid: true };
  }

  getAvailableSources(): WordSource[] {
    return [
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
        name: 'Descriptive Words',
        description: 'Words that describe qualities and characteristics'
      }
    ];
  }

  generateWords(length: number, source: string, count: number = 50): string[] {
    let doc;
    switch (source) {
      case 'nouns':
        doc = nlp('').nouns().json();
        break;
      case 'verbs':
        doc = nlp('').verbs().json();
        break;
      case 'adjectives':
        doc = nlp('').adjectives().json();
        break;
      default:
        doc = nlp('').words().json();
    }

    const words = new Set<string>();
    const allWords = doc
      .map((term: any) => term.text.toLowerCase())
      .filter((word: string) => 
        word.length === length && 
        this.validateWord(word).isValid
      );

    while (words.size < count && allWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * allWords.length);
      const word = allWords[randomIndex];
      words.add(word);
      allWords.splice(randomIndex, 1);
    }

    return Array.from(words);
  }
}