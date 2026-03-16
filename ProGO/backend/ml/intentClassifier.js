const brain = require('brain.js');
const fs = require('fs');
const path = require('path');
const natural = require('natural');

class IntentClassifier {
  constructor() {
    // Use NeuralNetwork instead of LSTM to avoid GPU requirements
    this.network = new brain.NeuralNetwork({
      hiddenLayers: [128, 64],
      learningRate: 0.01,
      errorThresh: 0.005
    });
    this.modelPath = path.join(__dirname, 'models', 'intent-model.json');
    this.conversationHistoryPath = path.join(__dirname, 'models', 'conversation-history.json');
    this.isTrained = false;
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Context tracking for better intent recognition
    this.contextHistory = [];
    this.maxContextLength = 5;
    
    // Confidence threshold
    this.confidenceThreshold = 0.6;
  }

  // Enhanced training data for intent classification
  getTrainingData() {
    return [
      // Overall Attendance Intents (expanded)
      { input: 'show overall attendance', output: 'overall_attendance' },
      { input: 'what is my child attendance', output: 'overall_attendance' },
      { input: 'total attendance percentage', output: 'overall_attendance' },
      { input: 'attendance stats', output: 'overall_attendance' },
      { input: 'how much attendance', output: 'overall_attendance' },
      { input: 'check attendance', output: 'overall_attendance' },
      { input: 'attendance report', output: 'overall_attendance' },
      { input: 'overall attendance record', output: 'overall_attendance' },
      { input: 'total attendance', output: 'overall_attendance' },
      { input: 'attendance summary', output: 'overall_attendance' },
      { input: 'how many classes attended', output: 'overall_attendance' },
      { input: 'attendance percentage', output: 'overall_attendance' },
      { input: 'show me the attendance', output: 'overall_attendance' },
      { input: 'what is attendance', output: 'overall_attendance' },
      { input: 'can i see attendance', output: 'overall_attendance' },

      // Subject-wise Attendance Intents (expanded)
      { input: 'subject wise attendance', output: 'subject_attendance' },
      { input: 'attendance for each subject', output: 'subject_attendance' },
      { input: 'show subject attendance', output: 'subject_attendance' },
      { input: 'attendance by subject', output: 'subject_attendance' },
      { input: 'individual subject attendance', output: 'subject_attendance' },
      { input: 'mathematics attendance', output: 'subject_attendance' },
      { input: 'subject attendance details', output: 'subject_attendance' },
      { input: 'attendance in all subjects', output: 'subject_attendance' },
      { input: 'per subject attendance', output: 'subject_attendance' },
      { input: 'subject based attendance', output: 'subject_attendance' },
      { input: 'physics attendance', output: 'subject_attendance' },
      { input: 'chemistry attendance', output: 'subject_attendance' },
      { input: 'computer science attendance', output: 'subject_attendance' },
      { input: 'attendance details for each class', output: 'subject_attendance' },

      // Academic Status Intents (expanded)
      { input: 'academic status', output: 'academic_status' },
      { input: 'check backlogs', output: 'academic_status' },
      { input: 'any backlogs', output: 'academic_status' },
      { input: 'failed subjects', output: 'academic_status' },
      { input: 'academic standing', output: 'academic_status' },
      { input: 'show status', output: 'academic_status' },
      { input: 'incomplete subjects', output: 'academic_status' },
      { input: 'how many backlogs', output: 'academic_status' },
      { input: 'pending subjects', output: 'academic_status' },
      { input: 'cleared subjects', output: 'academic_status' },
      { input: 'status report', output: 'academic_status' },
      { input: 'academic record', output: 'academic_status' },
      { input: 'do they have any failures', output: 'academic_status' },
      { input: 'subjects to clear', output: 'academic_status' },

      // Academic Performance Intents (expanded)
      { input: 'show performance', output: 'academic_performance' },
      { input: 'what is cgpa', output: 'academic_performance' },
      { input: 'check grades', output: 'academic_performance' },
      { input: 'academic performance', output: 'academic_performance' },
      { input: 'semester marks', output: 'academic_performance' },
      { input: 'show results', output: 'academic_performance' },
      { input: 'grade report', output: 'academic_performance' },
      { input: 'current cgpa', output: 'academic_performance' },
      { input: 'gpa details', output: 'academic_performance' },
      { input: 'marks obtained', output: 'academic_performance' },
      { input: 'exam results', output: 'academic_performance' },
      { input: 'how are the marks', output: 'academic_performance' },
      { input: 'performance report', output: 'academic_performance' },
      { input: 'show me grades', output: 'academic_performance' },
      { input: 'what are the scores', output: 'academic_performance' },
      { input: 'semester wise performance', output: 'academic_performance' },

      // Upcoming Exams Intents (expanded)
      { input: 'upcoming exams', output: 'upcoming_exams' },
      { input: 'exam schedule', output: 'upcoming_exams' },
      { input: 'when is next exam', output: 'upcoming_exams' },
      { input: 'exam dates', output: 'upcoming_exams' },
      { input: 'test schedule', output: 'upcoming_exams' },
      { input: 'show exams', output: 'upcoming_exams' },
      { input: 'examination timetable', output: 'upcoming_exams' },
      { input: 'exam calendar', output: 'upcoming_exams' },
      { input: 'future exams', output: 'upcoming_exams' },
      { input: 'next examination', output: 'upcoming_exams' },
      { input: 'exam information', output: 'upcoming_exams' },
      { input: 'test dates', output: 'upcoming_exams' },
      { input: 'when are exams', output: 'upcoming_exams' },
      { input: 'assessment schedule', output: 'upcoming_exams' },

      // Fee Payment Intents (expanded)
      { input: 'fee status', output: 'fee_status' },
      { input: 'payment status', output: 'fee_status' },
      { input: 'check fees', output: 'fee_status' },
      { input: 'fee payment', output: 'fee_status' },
      { input: 'pending fees', output: 'fee_status' },
      { input: 'tuition fee status', output: 'fee_status' },
      { input: 'fee details', output: 'fee_status' },
      { input: 'fees paid', output: 'fee_status' },
      { input: 'outstanding fees', output: 'fee_status' },
      { input: 'payment pending', output: 'fee_status' },
      { input: 'fee due', output: 'fee_status' },
      { input: 'payment information', output: 'fee_status' },
      { input: 'how much fees pending', output: 'fee_status' },
      { input: 'unpaid fees', output: 'fee_status' },

      // Notifications Intents (expanded)
      { input: 'show notifications', output: 'notifications' },
      { input: 'announcements', output: 'notifications' },
      { input: 'latest updates', output: 'notifications' },
      { input: 'any new announcements', output: 'notifications' },
      { input: 'college notifications', output: 'notifications' },
      { input: 'recent news', output: 'notifications' },
      { input: 'important updates', output: 'notifications' },
      { input: 'new notifications', output: 'notifications' },
      { input: 'college updates', output: 'notifications' },
      { input: 'what is new', output: 'notifications' },
      { input: 'any announcements', output: 'notifications' },
      { input: 'school news', output: 'notifications' },
      { input: 'important notices', output: 'notifications' },

      // Faculty Contact Intents (expanded)
      { input: 'faculty contact', output: 'faculty_contact' },
      { input: 'teacher contact details', output: 'faculty_contact' },
      { input: 'how to contact faculty', output: 'faculty_contact' },
      { input: 'class advisor details', output: 'faculty_contact' },
      { input: 'teacher information', output: 'faculty_contact' },
      { input: 'faculty email', output: 'faculty_contact' },
      { input: 'professor contact', output: 'faculty_contact' },
      { input: 'contact teacher', output: 'faculty_contact' },
      { input: 'faculty phone number', output: 'faculty_contact' },
      { input: 'teacher email', output: 'faculty_contact' },
      { input: 'advisor contact', output: 'faculty_contact' },
      { input: 'how to reach faculty', output: 'faculty_contact' },

      // Performance Insights Intents (expanded)
      { input: 'performance insights', output: 'performance_insights' },
      { input: 'analysis report', output: 'performance_insights' },
      { input: 'weak subjects', output: 'performance_insights' },
      { input: 'strong subjects', output: 'performance_insights' },
      { input: 'performance analysis', output: 'performance_insights' },
      { input: 'improvement areas', output: 'performance_insights' },
      { input: 'performance summary', output: 'performance_insights' },
      { input: 'strengths and weaknesses', output: 'performance_insights' },
      { input: 'where to improve', output: 'performance_insights' },
      { input: 'subject analysis', output: 'performance_insights' },
      { input: 'performance prediction', output: 'performance_insights' },
      { input: 'future performance', output: 'performance_insights' },
      { input: 'academic insights', output: 'performance_insights' },

      // Greeting Intents (expanded)
      { input: 'hello', output: 'greeting' },
      { input: 'hi', output: 'greeting' },
      { input: 'hey', output: 'greeting' },
      { input: 'good morning', output: 'greeting' },
      { input: 'good afternoon', output: 'greeting' },
      { input: 'good evening', output: 'greeting' },
      { input: 'namaste', output: 'greeting' },
      { input: 'greetings', output: 'greeting' },

      // Help Intents
      { input: 'help', output: 'help' },
      { input: 'what can you do', output: 'help' },
      { input: 'show menu', output: 'help' },
      { input: 'options', output: 'help' },
      { input: 'what are my options', output: 'help' },
      { input: 'show options', output: 'help' },
      { input: 'menu', output: 'help' },
      { input: 'commands', output: 'help' },

      // Logout Intents (expanded)
      { input: 'logout', output: 'logout' },
      { input: 'exit', output: 'logout' },
      { input: 'quit', output: 'logout' },
      { input: 'sign out', output: 'logout' },
      { input: 'end session', output: 'logout' },
      { input: 'bye', output: 'logout' },
      { input: 'goodbye', output: 'logout' },

      { input: 'sign out', output: 'logout' },
      { input: 'end session', output: 'logout' },
      { input: 'bye', output: 'logout' },
      { input: 'goodbye', output: 'logout' },
      { input: 'close', output: 'logout' },
      { input: 'done', output: 'logout' },
    ];
  }

  // Preprocess input text
  preprocessInput(input) {
    // Convert to lowercase and tokenize
    const tokens = this.tokenizer.tokenize(input.toLowerCase());
    
    // Stem tokens
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));
    
    // Join back to string
    return stemmedTokens.join(' ');
  }

  // Train the neural network with enhanced training data
  async train() {
    try {
      console.log('🧠 Training Intent Classifier...');
      const trainingData = this.getTrainingData();

      // Load existing conversation history and incorporate it
      const additionalData = this.loadConversationHistory();
      const allTrainingData = [...trainingData, ...additionalData];

      console.log(`  📊 Total training samples: ${allTrainingData.length}`);
      console.log(`  📚 Base samples: ${trainingData.length}`);
      console.log(`  💬 Conversation samples: ${additionalData.length}`);

      const startTime = Date.now();

      this.network.train(allTrainingData, {
        iterations: 3000,
        errorThresh: 0.003,
        log: true,
        logPeriod: 200,
        learningRate: 0.01,
        callback: (stats) => {
          if (stats.iterations % 500 === 0) {
            console.log(`  ⏳ Iteration ${stats.iterations}: error = ${stats.error.toFixed(6)}`);
          }
        }
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      this.isTrained = true;
      console.log(`✓ Intent Classifier trained successfully in ${duration}s`);

      // Save the trained model
      this.saveModel();
      return true;
    } catch (error) {
      console.error('✗ Error training Intent Classifier:', error);
      throw error;
    }
  }

  // Classify user intent with context awareness
  classify(input, context = null) {
    try {
      if (!this.isTrained) {
        this.loadModel();
      }

      // Preprocess input
      const processedInput = this.preprocessInput(input);

      // Run classification
      const intent = this.network.run(processedInput);
      
      // Update context history
      this.updateContext(input, intent);

      return intent;
    } catch (error) {
      console.error('Error classifying intent:', error);
      return 'unknown';
    }
  }

  // Get confidence score for classification with multiple possibilities
  classifyWithConfidence(input, context = null) {
    try {
      if (!this.isTrained) {
        this.loadModel();
      }

      // Preprocess input
      const processedInput = this.preprocessInput(input);

      // Run classification
      const result = this.network.run(processedInput);
      
      // Calculate confidence based on pattern matching
      const confidence = this.calculateConfidence(input, result);

      // Update context tracking for conversation flow
      this.updateContext(input, result);

      // Check if we need clarification
      const needsClarification = confidence < this.confidenceThreshold;

      return {
        intent: result,
        confidence: confidence,
        input: input,
        needsClarification: needsClarification,
        alternativeIntents: this.getAlternativeIntents(input, result)
      };
    } catch (error) {
      console.error('Error classifying with confidence:', error);
      return {
        intent: 'unknown',
        confidence: 0,
        input: input,
        needsClarification: true,
        alternativeIntents: []
      };
    }
  }

  // Calculate confidence score based on keyword matching
  calculateConfidence(input, predictedIntent) {
    const trainingData = this.getTrainingData();
    
    // Find similar examples in training data
    const similarExamples = trainingData.filter(d => d.output === predictedIntent);
    
    if (similarExamples.length === 0) {
      return 0.5; // Default confidence
    }

    // Calculate similarity with training examples
    const inputTokens = new Set(this.tokenizer.tokenize(input.toLowerCase()));
    
    let maxSimilarity = 0;
    similarExamples.forEach(example => {
      const exampleTokens = new Set(this.tokenizer.tokenize(example.input.toLowerCase()));
      const intersection = new Set([...inputTokens].filter(x => exampleTokens.has(x)));
      const union = new Set([...inputTokens, ...exampleTokens]);
      
      const similarity = intersection.size / union.size;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    // Convert similarity to confidence (0.5 to 1.0 range)
    return Math.min(0.5 + maxSimilarity, 1.0);
  }

  // Get alternative possible intents
  getAlternativeIntents(input, primaryIntent) {
    const alternatives = [];
    const trainingData = this.getTrainingData();
    const inputTokens = new Set(this.tokenizer.tokenize(input.toLowerCase()));

    // Group by intent
    const intentGroups = {};
    trainingData.forEach(d => {
      if (!intentGroups[d.output]) {
        intentGroups[d.output] = [];
      }
      intentGroups[d.output].push(d.input);
    });

    // Calculate similarity for each intent
    Object.keys(intentGroups).forEach(intent => {
      if (intent === primaryIntent) return;

      let maxSim = 0;
      intentGroups[intent].forEach(example => {
        const exampleTokens = new Set(this.tokenizer.tokenize(example.toLowerCase()));
        const intersection = new Set([...inputTokens].filter(x => exampleTokens.has(x)));
        const union = new Set([...inputTokens, ...exampleTokens]);
        const similarity = intersection.size / union.size;
        maxSim = Math.max(maxSim, similarity);
      });

      if (maxSim > 0.3) {
        alternatives.push({ intent, confidence: maxSim });
      }
    });

    // Sort by confidence and return top 2
    return alternatives
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);
  }

  // Update context history for conversation flow
  updateContext(input, intent) {
    this.contextHistory.push({
      input,
      intent,
      timestamp: Date.now()
    });

    // Keep only recent context
    if (this.contextHistory.length > this.maxContextLength) {
      this.contextHistory.shift();
    }
  }

  // Get recent context
  getContext() {
    return this.contextHistory;
  }

  // Clear context
  clearContext() {
    this.contextHistory = [];
  }

  // Save conversation for future training
  saveConversationForTraining(input, intent, wasCorrect = true) {
    try {
      let history = [];
      
      if (fs.existsSync(this.conversationHistoryPath)) {
        const data = fs.readFileSync(this.conversationHistoryPath, 'utf8');
        history = JSON.parse(data);
      }

      history.push({
        input: input.toLowerCase(),
        output: intent,
        wasCorrect,
        timestamp: new Date().toISOString()
      });

      // Keep only last 1000 conversations
      if (history.length > 1000) {
        history = history.slice(-1000);
      }

      const modelDir = path.join(__dirname, 'models');
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      fs.writeFileSync(this.conversationHistoryPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  // Load conversation history for training
  loadConversationHistory() {
    try {
      if (fs.existsSync(this.conversationHistoryPath)) {
        const data = fs.readFileSync(this.conversationHistoryPath, 'utf8');
        const history = JSON.parse(data);
        
        // Only use correct classifications for training
        return history
          .filter(h => h.wasCorrect !== false)
          .map(h => ({ input: h.input, output: h.output }));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
    return [];
  }

  // Retrain model with new data
  async retrain() {
    console.log('🔄 Retraining model with new conversation data...');
    return await this.train();
  }

  // Save trained model to file
  saveModel() {
    try {
      const modelDir = path.join(__dirname, 'models');
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      const model = this.network.toJSON();
      fs.writeFileSync(this.modelPath, JSON.stringify(model));
      console.log('✓ Model saved to:', this.modelPath);
    } catch (error) {
      console.error('✗ Error saving model:', error);
    }
  }

  // Load trained model from file
  loadModel() {
    try {
      if (fs.existsSync(this.modelPath)) {
        const model = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
        this.network.fromJSON(model);
        this.isTrained = true;
        console.log('✓ Intent Classifier model loaded');
        return true;
      } else {
        console.log('⚠ No trained model found. Please train the model first.');
        return false;
      }
    } catch (error) {
      console.error('✗ Error loading model:', error);
      return false;
    }
  }

  // Get model statistics
  getModelStats() {
    const trainingData = this.getTrainingData();
    const conversationData = this.loadConversationHistory();
    
    const intentCounts = {};
    trainingData.forEach(d => {
      intentCounts[d.output] = (intentCounts[d.output] || 0) + 1;
    });

    return {
      totalTrainingSamples: trainingData.length + conversationData.length,
      baseTrainingSamples: trainingData.length,
      conversationSamples: conversationData.length,
      uniqueIntents: Object.keys(intentCounts).length,
      isTrained: this.isTrained,
      intentDistribution: intentCounts
    };
  }
}

module.exports = new IntentClassifier();
