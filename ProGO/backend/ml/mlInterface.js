/**
 * Unified ML Interface
 * Provides unified interface to both Python and JavaScript ML models
 */

const pythonBridge = require('./pythonBridge');
const brainJsIntent = require('./intentClassifier');
const brainJsPerformance = require('./performancePredictor');

class MLInterface {
  constructor() {
    this.usePython = false; // Default to Brain.js
    this.pythonAvailable = false;
  }

  /**
   * Initialize ML system and detect available backends
   */
  async initialize() {
    console.log('Initializing ML system...');
    
    // Check if Python is available
    try {
      this.pythonAvailable = await pythonBridge.checkPythonAvailable();
      if (this.pythonAvailable) {
        const packages = await pythonBridge.checkPythonPackages();
        this.pythonAvailable = packages.available;
        
        if (this.pythonAvailable) {
          console.log('✓ Python ML backend available');
          this.usePython = true; // Prefer Python if available
        } else {
          console.log('⚠ Python available but packages missing:', packages.missing_packages);
          console.log('  Install with: pip install -r backend/ml/python/requirements.txt');
        }
      } else {
        console.log('⚠ Python not available, using Brain.js backend');
      }
    } catch (error) {
      console.log('⚠ Could not check Python availability:', error.message);
      console.log('  Falling back to Brain.js backend');
      this.pythonAvailable = false;
    }

    return {
      pythonAvailable: this.pythonAvailable,
      activeBeckend: this.usePython ? 'Python' : 'Brain.js'
    };
  }

  /**
   * Set ML backend preference
   * @param {boolean} usePython - Whether to use Python backend
   */
  setBackend(usePython) {
    if (usePython && !this.pythonAvailable) {
      throw new Error('Python backend not available. Install Python and required packages.');
    }
    this.usePython = usePython;
    console.log(`Switched to ${usePython ? 'Python' : 'Brain.js'} backend`);
  }

  /**
   * Train all ML models
   */
  async trainAll() {
    if (this.usePython) {
      console.log('Training Python ML models...');
      return await pythonBridge.executePythonScript('train', ['train', '2000']);
    } else {
      console.log('Training Brain.js ML models...');
      const intentStats = await brainJsIntent.train();
      const perfStats = await brainJsPerformance.train();
      return {
        intent_classifier: { status: 'success', stats: intentStats },
        performance_predictor: { status: 'success', stats: perfStats }
      };
    }
  }

  /**
   * Predict intent from text (with confidence and alternatives for chatbot)
   * @param {string} text - Input text
   * @param {object} context - Optional context
   * @returns {Promise<Object>} - Intent prediction with confidence and alternatives
   */
  async predictIntent(text, context = null) {
    if (this.usePython) {
      const result = await pythonBridge.predictIntent(text);
      // Convert Python format to Brain.js compatible format
      return {
        intent: result.intent,
        confidence: result.confidence,
        input: text,
        needsClarification: result.confidence < 0.6,
        alternativeIntents: result.alternatives || []
      };
    } else {
      return brainJsIntent.classifyWithConfidence(text, context);
    }
  }

  /**
   * Predict student performance (with insights for chatbot)
   * @param {Object} studentData - Student metrics
   * @returns {Promise<Object>} - Performance prediction with insights
   */
  async predictPerformance(studentData) {
    if (this.usePython) {
      const result = await pythonBridge.predictPerformance(studentData);
      // Python backend returns rich insights directly
      return {
        predictedCGPA: result.predicted_cgpa,
        currentCGPA: result.current_cgpa,
        improvement: result.improvement_potential,
        confidence: result.confidence,
        insights: result.insights,
        recommendations: result.recommendations
      };
    } else {
      // Brain.js backend - use analyzePerformance for insights
      const insights = await brainJsPerformance.analyzePerformance(studentData);
      return insights;
    }
  }

  /**
   * Test all models
   */
  async testAll() {
    if (this.usePython) {
      return await pythonBridge.executePythonScript('train', ['test']);
    } else {
      // Test Brain.js models
      const intentTests = [
        'What is my attendance?',
        'Show me my marks',
        'Thank you'
      ].map(text => ({
        text,
        result: brainJsIntent.classify(text)
      }));

      const perfTest = brainJsPerformance.predict({
        attendance: 85,
        cgpa: 7.5,
        semester: 4,
        backlogs: 0,
        studyHours: 5,
        theoryScore: 75,
        practicalScore: 80,
        assignmentScore: 78
      });

      return {
        intent_classifier: { status: 'success', tests: intentTests },
        performance_predictor: { status: 'success', test: perfTest }
      };
    }
  }

  /**
   * Get ML system info
   */
  getInfo() {
    return {
      pythonAvailable: this.pythonAvailable,
      currentBackend: this.usePython ? 'Python' : 'Brain.js',
      backends: {
        python: {
          available: this.pythonAvailable,
          features: [
            'Scikit-learn Random Forest for intent classification',
            'TensorFlow/Keras Neural Network for performance prediction',
            'Advanced feature engineering',
            'Enhanced accuracy and insights'
          ]
        },
        brainjs: {
          available: true,
          features: [
            'LSTM for intent classification',
            'Neural network for performance prediction',
            'Fast, no external dependencies',
            'Good for basic use cases'
          ]
        }
      }
    };
  }

  /**
   * Save conversation for training (Brain.js compatibility)
   * @param {string} input - User input
   * @param {string} intent - Classified intent
   * @param {boolean} wasCorrect - Whether classification was correct
   */
  saveConversationForTraining(input, intent, wasCorrect = true) {
    if (!this.usePython) {
      // Only Brain.js has this method
      brainJsIntent.saveConversationForTraining(input, intent, wasCorrect);
    }
    // Python backend handles this differently through conversation learning
  }
}

module.exports = new MLInterface();
