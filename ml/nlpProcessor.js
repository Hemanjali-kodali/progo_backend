const natural = require('natural');
const sentiment = require('sentiment');
const compromise = require('compromise');

class NLPProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentimentAnalyzer = new sentiment();
    this.tfidf = new natural.TfIdf();
    
    // Initialize NLP tools
    this.initializeNLP();
  }

  initializeNLP() {
    console.log('🔧 Initializing NLP Processor...');
    
    // Load word net
    natural.WordNet.load = () => {
      console.log('✓ WordNet loaded');
    };
    
    console.log('✓ NLP Processor initialized');
  }

  // Tokenize text into words
  tokenize(text) {
    return this.tokenizer.tokenize(text.toLowerCase());
  }

  // Stem words to their root form
  stem(word) {
    return this.stemmer.stem(word);
  }

  // Stem an array of tokens
  stemTokens(tokens) {
    return tokens.map(token => this.stem(token));
  }

  // Extract entities from text (registration numbers, phone numbers, etc.)
  extractEntities(text) {
    const entities = {
      registrationNumber: null,
      phoneNumber: null,
      numbers: [],
      dates: [],
      subjects: []
    };

    // Extract registration number patterns (e.g., REG12345, 2021001, etc.)
    const regNumPattern = /\b[A-Z]{2,4}\d{4,8}\b|\b\d{6,10}\b/gi;
    const regNums = text.match(regNumPattern);
    if (regNums && regNums.length > 0) {
      entities.registrationNumber = regNums[0];
    }

    // Extract phone numbers (10 digits)
    const phonePattern = /\b\d{10}\b/g;
    const phones = text.match(phonePattern);
    if (phones && phones.length > 0) {
      entities.phoneNumber = phones[0];
    }

    // Extract numbers
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    const numbers = text.match(numberPattern);
    if (numbers) {
      entities.numbers = numbers.map(n => parseFloat(n));
    }

    // Extract dates using compromise (safe check)
const doc = compromise(text);

let dates = [];
if (typeof doc.dates === "function") {
  dates = doc.dates().out('array');
}

entities.dates = dates;
    

    // Extract potential subject names (capitalized words/phrases)
    const subjectPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const subjects = text.match(subjectPattern);
    if (subjects) {
      entities.subjects = subjects;
    }

    return entities;
  }

  // Analyze sentiment of the text
  analyzeSentiment(text) {
    const result = this.sentimentAnalyzer.analyze(text);
    
    let sentimentLabel = 'neutral';
    if (result.score > 0) sentimentLabel = 'positive';
    else if (result.score < 0) sentimentLabel = 'negative';

    return {
      score: result.score,
      comparative: result.comparative,
      label: sentimentLabel,
      positive: result.positive,
      negative: result.negative
    };
  }

  // Calculate similarity between two texts
  calculateSimilarity(text1, text2) {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);
    
    const stemmed1 = this.stemTokens(tokens1);
    const stemmed2 = this.stemTokens(tokens2);

    return natural.JaroWinklerDistance(stemmed1.join(' '), stemmed2.join(' '));
  }

  // Normalize user input
  normalizeInput(text) {
    // Remove extra spaces
    text = text.replace(/\s+/g, ' ').trim();
    
    // Convert to lowercase
    text = text.toLowerCase();
    
    // Remove special characters except spaces, numbers, and basic punctuation
    text = text.replace(/[^\w\s.,!?-]/g, '');
    
    // Common abbreviations expansion
    const abbreviations = {
      'cgpa': 'cumulative grade point average',
      'gpa': 'grade point average',
      'pct': 'percentage',
      '%': 'percentage',
      'attn': 'attendance',
      'att': 'attendance',
      'subj': 'subject',
      'sem': 'semester',
      'yr': 'year',
      'prof': 'professor',
      'dept': 'department'
    };

    Object.keys(abbreviations).forEach(abbr => {
      const regex = new RegExp('\\b' + abbr + '\\b', 'gi');
      text = text.replace(regex, abbreviations[abbr]);
    });

    return text;
  }

  // Extract keywords from text
  extractKeywords(text, topN = 5) {
    const doc = compromise(text);
    
    // Get nouns and verbs as keywords
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    const keywords = [...new Set([...nouns, ...verbs])];
    
    return keywords.slice(0, topN);
  }

  // Detect question type
  detectQuestionType(text) {
    const doc = compromise(text);
    
    if (doc.questions().length > 0) {
      const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which'];
      const lowerText = text.toLowerCase();
      
      for (const word of questionWords) {
        if (lowerText.startsWith(word)) {
          return {
            isQuestion: true,
            type: word
          };
        }
      }
      
      return { isQuestion: true, type: 'general' };
    }
    
    return { isQuestion: false, type: null };
  }

  // Process and analyze complete user message
  processMessage(text) {
    const normalized = this.normalizeInput(text);
    const tokens = this.tokenize(normalized);
    const stemmed = this.stemTokens(tokens);
    const entities = this.extractEntities(text);
    const sentiment = this.analyzeSentiment(text);
    const keywords = this.extractKeywords(text);
    const questionInfo = this.detectQuestionType(text);

    return {
      original: text,
      normalized: normalized,
      tokens: tokens,
      stemmed: stemmed,
      entities: entities,
      sentiment: sentiment,
      keywords: keywords,
      questionInfo: questionInfo,
      wordCount: tokens.length
    };
  }

  // Get response variations based on sentiment
  getResponseVariation(baseResponse, sentiment) {
    const variations = {
      positive: {
        prefix: ['Great! ', 'Excellent! ', 'Wonderful! '],
        suffix: [' 😊', ' Keep it up!', ' That\'s fantastic!']
      },
      negative: {
        prefix: ['I understand. ', 'I see. ', ''],
        suffix: [' I\'m here to help.', ' Let me assist you.', '']
      },
      neutral: {
        prefix: ['', 'Okay. ', 'Sure. '],
        suffix: ['', ' Let me know if you need anything else.', '']
      }
    };

    const variation = variations[sentiment] || variations.neutral;
    const prefix = variation.prefix[Math.floor(Math.random() * variation.prefix.length)];
    const suffix = variation.suffix[Math.floor(Math.random() * variation.suffix.length)];

    return prefix + baseResponse + suffix;
  }

  // Extract numeric value from text (for percentage, cgpa, etc.)
  extractNumericValue(text, type = 'general') {
    const numbers = [];
    
    if (type === 'percentage') {
      const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
      let match;
      while ((match = percentPattern.exec(text)) !== null) {
        numbers.push(parseFloat(match[1]));
      }
    } else if (type === 'cgpa' || type === 'gpa') {
      const cgpaPattern = /(\d+(?:\.\d+)?)/g;
      let match;
      while ((match = cgpaPattern.exec(text)) !== null) {
        const value = parseFloat(match[1]);
        if (value >= 0 && value <= 10) {
          numbers.push(value);
        }
      }
    } else {
      const numberPattern = /\d+(?:\.\d+)?/g;
      const matches = text.match(numberPattern);
      if (matches) {
        numbers.push(...matches.map(n => parseFloat(n)));
      }
    }

    return numbers.length > 0 ? numbers : null;
  }

  // Spell checker (simple implementation)
  checkSpelling(word) {
    // This is a simple implementation using natural's distance
    // In production, you'd use a proper spell checker library
    const commonWords = [
      'attendance', 'marks', 'grades', 'exam', 'subject', 'cgpa', 
      'performance', 'fee', 'payment', 'notification', 'faculty'
    ];

    let bestMatch = word;
    let minDistance = Infinity;

    for (const correctWord of commonWords) {
      const distance = natural.LevenshteinDistance(word.toLowerCase(), correctWord);
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        bestMatch = correctWord;
      }
    }

    return {
      original: word,
      suggested: bestMatch,
      corrected: minDistance < word.length / 2
    };
  }
}

module.exports = new NLPProcessor();
