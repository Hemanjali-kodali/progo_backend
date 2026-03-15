const intentClassifier = require('./intentClassifier');
const performancePredictor = require('./performancePredictor');
const conversationLearner = require('./conversationLearner');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MLTrainer {
  constructor() {
    this.dbConnected = false;
  }

  // Connect to database
  async connectDB() {
    try {
      if (!this.dbConnected) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parent_student_chatbot', {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log('✓ MongoDB connected for ML training');
        this.dbConnected = true;
      }
    } catch (error) {
      console.error('✗ Database connection error:', error);
      throw error;
    }
  }

  // Train Intent Classifier
  async trainIntentClassifier() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TRAINING INTENT CLASSIFIER');
    console.log('═══════════════════════════════════════\n');

    try {
      const startTime = Date.now();
      
      await intentClassifier.train();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n✓ Intent Classifier training completed in ${duration}s\n`);
      
      // Show model statistics
      const stats = intentClassifier.getModelStats();
      console.log('📊 Model Statistics:');
      console.log(`   Total Training Samples: ${stats.totalTrainingSamples}`);
      console.log(`   Base Samples: ${stats.baseTrainingSamples}`);
      console.log(`   Conversation Samples: ${stats.conversationSamples}`);
      console.log(`   Unique Intents: ${stats.uniqueIntents}\n`);
      
      return true;
    } catch (error) {
      console.error('✗ Intent Classifier training failed:', error);
      return false;
    }
  }

  // Train Performance Predictor
  async trainPerformancePredictor() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TRAINING PERFORMANCE PREDICTOR');
    console.log('═══════════════════════════════════════\n');

    try {
      await performancePredictor.initialize();

      const datasetPath = path.join(__dirname, 'data', 'dataset.csv');
      let trainingData;

      if (fs.existsSync(datasetPath)) {
        console.log(`📊 Loading training data from CSV: ${datasetPath}`);
        trainingData = performancePredictor.loadTrainingDataFromCSV(datasetPath);
        console.log(`✓ Loaded ${trainingData.length} training samples from dataset.csv`);
      } else {
        console.log('📊 Generating sample training data...');
        trainingData = performancePredictor.generateSampleTrainingData(1000);
        console.log(`✓ Generated ${trainingData.length} training samples`);
      }

      // Train the model
      await performancePredictor.train(trainingData);
      console.log('\n✓ Performance Predictor training completed\n');
      return true;
    } catch (error) {
      console.error('✗ Performance Predictor training failed:', error);
      return false;
    }
  }

  // Train all models
  async trainAll() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  ML MODEL TRAINING SYSTEM             ║');
    console.log('║  Parent-Student Chatbot               ║');
    console.log('╚═══════════════════════════════════════╝\n');

    const startTime = Date.now();

    try {
      // Train Intent Classifier
      const intentSuccess = await this.trainIntentClassifier();

      // Train Performance Predictor
      const performanceSuccess = await this.trainPerformancePredictor();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n═══════════════════════════════════════');
      console.log('  TRAINING SUMMARY');
      console.log('═══════════════════════════════════════\n');
      console.log(`Intent Classifier: ${intentSuccess ? '✓ Success' : '✗ Failed'}`);
      console.log(`Performance Predictor: ${performanceSuccess ? '✓ Success' : '✗ Failed'}`);
      console.log(`\nTotal Training Time: ${duration} seconds`);
      console.log('\n═══════════════════════════════════════\n');

      return intentSuccess && performanceSuccess;
    } catch (error) {
      console.error('\n✗ Training failed:', error);
      return false;
    }
  }

  // Test Intent Classifier
  async testIntentClassifier() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TESTING INTENT CLASSIFIER');
    console.log('═══════════════════════════════════════\n');

    const testInputs = [
      'show me overall attendance',
      'what is my child cgpa',
      'upcoming exam dates',
      'fee payment status',
      'subject wise attendance',
      'any backlogs?',
      'faculty contact',
      'performance insights',
      'hello',
      'help me',
      'logout'
    ];

    console.log('Testing with sample inputs:\n');
    testInputs.forEach(input => {
      const result = intentClassifier.classifyWithConfidence(input);
      const confidenceBar = '█'.repeat(Math.floor(result.confidence * 20));
      console.log(`Input: "${input}"`);
      console.log(`Intent: ${result.intent}`);
      console.log(`Confidence: [${confidenceBar.padEnd(20)}] ${(result.confidence * 100).toFixed(1)}%`);
      
      if (result.alternativeIntents && result.alternativeIntents.length > 0) {
        console.log('Alternatives:');
        result.alternativeIntents.forEach(alt => {
          console.log(`  - ${alt.intent} (${(alt.confidence * 100).toFixed(1)}%)`);
        });
      }
      console.log('');
    });
  }

  // Test Performance Predictor
  async testPerformancePredictor() {
    console.log('\n═══════════════════════════════════════');
    console.log('  TESTING PERFORMANCE PREDICTOR');
    console.log('═══════════════════════════════════════\n');

    const testCases = [
      {
        name: 'Excellent Student',
        data: {
          attendance: 95,
          previousCGPA: 9.2,
          assignmentScore: 95,
          midtermScore: 92,
          participationScore: 9,
          backlogs: 0,
          studyHours: 22,
          semester: 4
        }
      },
      {
        name: 'Average Student',
        data: {
          attendance: 78,
          previousCGPA: 7.5,
          assignmentScore: 75,
          midtermScore: 72,
          participationScore: 6,
          backlogs: 1,
          studyHours: 15,
          semester: 4
        }
      },
      {
        name: 'Struggling Student',
        data: {
          attendance: 65,
          previousCGPA: 5.8,
          assignmentScore: 55,
          midtermScore: 58,
          participationScore: 4,
          backlogs: 3,
          studyHours: 8,
          semester: 4
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Test Case: ${testCase.name}`);
      console.log('─'.repeat(50));
      console.log('Input Data:');
      console.log(`  Attendance: ${testCase.data.attendance}%`);
      console.log(`  Previous CGPA: ${testCase.data.previousCGPA}`);
      console.log(`  Assignment Score: ${testCase.data.assignmentScore}%`);
      console.log(`  Midterm Score: ${testCase.data.midtermScore}%`);
      console.log(`  Participation: ${testCase.data.participationScore}/10`);
      console.log(`  Backlogs: ${testCase.data.backlogs}`);
      console.log(`  Study Hours/Week: ${testCase.data.studyHours}`);

      try {
        const insights = await performancePredictor.analyzePerformance(testCase.data);
        
        console.log('\n🔮 Prediction Results:');
        console.log(`  Predicted CGPA: ${insights.prediction.toFixed(2)}`);
        console.log(`  Confidence: ${(insights.confidence * 100).toFixed(1)}%`);
        console.log(`  Current Performance: ${insights.currentPerformance}`);
        console.log(`  Predicted Performance: ${insights.predictedPerformance}`);
        console.log(`  Trend: ${insights.trend.direction} (${insights.trend.change >= 0 ? '+' : ''}${insights.trend.change.toFixed(2)})`);
        
        if (insights.recommendations && insights.recommendations.length > 0) {
          console.log('\n💡 Top Recommendations:');
          insights.recommendations.slice(0, 3).forEach((rec, idx) => {
            console.log(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
          });
        }
      } catch (error) {
        console.error(`Error analyzing ${testCase.name}:`, error.message);
      }
    }
    
    console.log('\n');
  }

  // Get conversation learning statistics
  async getConversationStats() {
    console.log('\n═══════════════════════════════════════');
    console.log('  CONVERSATION LEARNING STATISTICS');
    console.log('═══════════════════════════════════════\n');

    const report = conversationLearner.generateReport();
    
    console.log('📊 Summary:');
    console.log(`  Total Conversations: ${report.summary.totalConversations}`);
    console.log(`  Unique Intents: ${report.summary.uniqueIntents}`);
    console.log(`  Average Confidence: ${report.summary.averageConfidence}`);
    console.log(`  Total Feedback: ${report.summary.totalFeedback}`);
    console.log(`  Satisfaction Rate: ${report.summary.satisfactionRate}\n`);

    if (report.lowConfidenceIntents.length > 0) {
      console.log('⚠️  Low Confidence Intents:');
      report.lowConfidenceIntents.forEach(intent => {
        console.log(`  - ${intent.intent}: ${(intent.averageConfidence * 100).toFixed(1)}%`);
      });
      console.log('');
    }

    if (report.suggestions.length > 0) {
      console.log('💡 Improvement Suggestions:');
      report.suggestions.forEach((sug, idx) => {
        console.log(`  ${idx + 1}. [${sug.priority.toUpperCase()}] ${sug.message}`);
      });
      console.log('');
    }

    return report;
  }

  // Retrain models with new conversation data
  async retrainWithConversations() {
    console.log('\n═══════════════════════════════════════');
    console.log('  RETRAINING WITH CONVERSATION DATA');
    console.log('═══════════════════════════════════════\n');

    try {
      console.log('📊 Exporting conversation training data...');
      const conversationData = conversationLearner.exportTrainingData();
      console.log(`✓ Found ${conversationData.length} high-confidence conversations\n`);

      if (conversationData.length > 0) {
        console.log('🔄 Retraining Intent Classifier...');
        await intentClassifier.retrain();
        console.log('✓ Retraining completed\n');
        return true;
      } else {
        console.log('⚠️  Not enough conversation data for retraining\n');
        return false;
      }
    } catch (error) {
      console.error('✗ Retraining failed:', error);
      return false;
    }
  }

  // Run complete ML pipeline
  async runCompletePipeline() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  COMPLETE ML TRAINING PIPELINE        ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // Step 1: Train all models
    await this.trainAll();

    // Step 2: Test models
    console.log('\n📝 STEP 2: Testing Models...\n');
    await this.testIntentClassifier();
    await this.testPerformancePredictor();

    // Step 3: Check conversation learning
    console.log('\n📊 STEP 3: Analyzing Conversations...\n');
    await this.getConversationStats();

    console.log('\n✅ Complete ML training pipeline finished!\n');
  }
}

// Main execution
if (require.main === module) {
  const trainer = new MLTrainer();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  (async () => {
    try {
      switch (command) {
        case 'all':
          await trainer.trainAll();
          break;
        
        case 'intent':
          await trainer.trainIntentClassifier();
          break;
        
        case 'performance':
          await trainer.trainPerformancePredictor();
          break;
        
        case 'test':
          await trainer.testIntentClassifier();
          await trainer.testPerformancePredictor();
          break;
        
        case 'stats':
          await trainer.getConversationStats();
          break;
        
        case 'retrain':
          await trainer.retrainWithConversations();
          break;
        
        case 'pipeline':
          await trainer.runCompletePipeline();
          break;
        
        default:
          console.log('Usage: node trainModels.js [command]');
          console.log('Commands:');
          console.log('  all         - Train all models (default)');
          console.log('  intent      - Train intent classifier only');
          console.log('  performance - Train performance predictor only');
          console.log('  test        - Test all models');
          console.log('  stats       - Show conversation statistics');
          console.log('  retrain     - Retrain with conversation data');
          console.log('  pipeline    - Run complete ML pipeline');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = new MLTrainer();
