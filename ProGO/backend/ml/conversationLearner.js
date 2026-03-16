const fs = require('fs');
const path = require('path');
const natural = require('natural');
const intentClassifier = require('./intentClassifier');

class ConversationLearner {
  constructor() {
    this.conversationsPath = path.join(__dirname, 'models', 'conversations.json');
    this.feedbackPath = path.join(__dirname, 'models', 'feedback.json');
    this.responsePatternsPath = path.join(__dirname, 'models', 'response-patterns.json');
    
    this.conversations = [];
    this.feedback = [];
    this.responsePatterns = {};
    
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    
    this.loadData();
  }

  // Load existing conversation data
  loadData() {
    try {
      // Load conversations
      if (fs.existsSync(this.conversationsPath)) {
        const data = fs.readFileSync(this.conversationsPath, 'utf8');
        this.conversations = JSON.parse(data);
      }

      // Load feedback
      if (fs.existsSync(this.feedbackPath)) {
        const data = fs.readFileSync(this.feedbackPath, 'utf8');
        this.feedback = JSON.parse(data);
      }

      // Load response patterns
      if (fs.existsSync(this.responsePatternsPath)) {
        const data = fs.readFileSync(this.responsePatternsPath, 'utf8');
        this.responsePatterns = JSON.parse(data);
      }

      console.log('✓ Conversation Learner data loaded');
    } catch (error) {
      console.error('Error loading conversation learner data:', error);
    }
  }

  // Save data
  saveData() {
    try {
      const modelDir = path.join(__dirname, 'models');
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      fs.writeFileSync(this.conversationsPath, JSON.stringify(this.conversations, null, 2));
      fs.writeFileSync(this.feedbackPath, JSON.stringify(this.feedback, null, 2));
      fs.writeFileSync(this.responsePatternsPath, JSON.stringify(this.responsePatterns, null, 2));
    } catch (error) {
      console.error('Error saving conversation learner data:', error);
    }
  }

  // Record a conversation turn
  recordConversation(sessionId, userMessage, botResponse, intent, confidence, additionalData = {}) {
    const conversation = {
      sessionId,
      userMessage,
      botResponse,
      intent,
      confidence,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    this.conversations.push(conversation);

    // Keep only last 5000 conversations
    if (this.conversations.length > 5000) {
      this.conversations = this.conversations.slice(-5000);
    }

    // Update response patterns
    this.updateResponsePatterns(intent, userMessage, botResponse);

    // Auto-save periodically
    if (this.conversations.length % 10 === 0) {
      this.saveData();
    }
  }

  // Update response patterns based on successful conversations
  updateResponsePatterns(intent, userMessage, botResponse) {
    if (!this.responsePatterns[intent]) {
      this.responsePatterns[intent] = {
        successfulPhrases: [],
        commonQuestions: [],
        responseTemplates: []
      };
    }

    // Track common question patterns
    const tokens = this.tokenizer.tokenize(userMessage.toLowerCase());
    this.responsePatterns[intent].commonQuestions.push({
      message: userMessage,
      tokens: tokens,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 patterns per intent
    if (this.responsePatterns[intent].commonQuestions.length > 50) {
      this.responsePatterns[intent].commonQuestions.shift();
    }
  }

  // Record user feedback on bot response
  recordFeedback(sessionId, messageId, isHelpful, correctedIntent = null, comment = null) {
    const feedbackEntry = {
      sessionId,
      messageId,
      isHelpful,
      correctedIntent,
      comment,
      timestamp: new Date().toISOString()
    };

    this.feedback.push(feedbackEntry);

    // If incorrect intent was identified, save for retraining
    if (correctedIntent) {
      const conversation = this.conversations.find(c => 
        c.sessionId === sessionId && c.userMessage
      );
      
      if (conversation) {
        intentClassifier.saveConversationForTraining(
          conversation.userMessage,
          correctedIntent,
          true
        );
      }
    }

    this.saveData();
  }

  // Analyze conversation patterns
  analyzeConversations() {
    const analysis = {
      totalConversations: this.conversations.length,
      intentDistribution: {},
      averageConfidence: 0,
      lowConfidenceIntents: [],
      commonQueries: [],
      feedbackStats: {
        total: this.feedback.length,
        helpful: 0,
        notHelpful: 0,
        correctionRate: 0
      }
    };

    // Analyze intents
    let totalConfidence = 0;
    this.conversations.forEach(conv => {
      if (!analysis.intentDistribution[conv.intent]) {
        analysis.intentDistribution[conv.intent] = {
          count: 0,
          totalConfidence: 0,
          hasLowConfidence: 0
        };
      }
      
      analysis.intentDistribution[conv.intent].count++;
      analysis.intentDistribution[conv.intent].totalConfidence += conv.confidence;
      totalConfidence += conv.confidence;

      if (conv.confidence < 0.6) {
        analysis.intentDistribution[conv.intent].hasLowConfidence++;
      }
    });

    // Calculate average confidence
    if (this.conversations.length > 0) {
      analysis.averageConfidence = totalConfidence / this.conversations.length;
    }

    // Find low confidence intents
    Object.keys(analysis.intentDistribution).forEach(intent => {
      const stats = analysis.intentDistribution[intent];
      const avgConf = stats.totalConfidence / stats.count;
      
      if (avgConf < 0.7 || stats.hasLowConfidence > stats.count * 0.3) {
        analysis.lowConfidenceIntents.push({
          intent,
          averageConfidence: avgConf,
          lowConfidenceCount: stats.hasLowConfidence
        });
      }
    });

    // Analyze feedback
    this.feedback.forEach(fb => {
      if (fb.isHelpful) {
        analysis.feedbackStats.helpful++;
      } else {
        analysis.feedbackStats.notHelpful++;
      }
    });

    if (this.feedback.length > 0) {
      const corrections = this.feedback.filter(fb => fb.correctedIntent).length;
      analysis.feedbackStats.correctionRate = corrections / this.feedback.length;
    }

    return analysis;
  }

  // Get suggestions for improving chatbot
  getImprovementSuggestions() {
    const analysis = this.analyzeConversations();
    const suggestions = [];

    // Low confidence intents need more training data
    if (analysis.lowConfidenceIntents.length > 0) {
      suggestions.push({
        type: 'training_data',
        priority: 'high',
        message: `${analysis.lowConfidenceIntents.length} intents have low confidence. Consider adding more training examples.`,
        intents: analysis.lowConfidenceIntents.map(i => i.intent)
      });
    }

    // High correction rate suggests intent classification issues
    if (analysis.feedbackStats.correctionRate > 0.2) {
      suggestions.push({
        type: 'intent_classification',
        priority: 'critical',
        message: `${(analysis.feedbackStats.correctionRate * 100).toFixed(1)}% of feedback includes intent corrections. Retrain the model.`,
        action: 'retrain_classifier'
      });
    }

    // Low feedback rate might indicate engagement issues
    const feedbackRate = this.feedback.length / this.conversations.length;
    if (feedbackRate < 0.1 && this.conversations.length > 100) {
      suggestions.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Low feedback rate. Consider prompting users for feedback.',
        action: 'add_feedback_prompts'
      });
    }

    return suggestions;
  }

  // Get popular queries by intent
  getPopularQueries(intent, limit = 10) {
    if (!this.responsePatterns[intent]) {
      return [];
    }

    return this.responsePatterns[intent].commonQuestions
      .slice(-limit)
      .map(q => q.message);
  }

  // Suggest similar past responses
  getSimilarPastResponses(userMessage, intent, limit = 3) {
    const relevantConversations = this.conversations.filter(c => c.intent === intent);
    
    if (relevantConversations.length === 0) {
      return [];
    }

    // Calculate similarity
    const userTokens = new Set(this.tokenizer.tokenize(userMessage.toLowerCase()));
    
    const scored = relevantConversations.map(conv => {
      const convTokens = new Set(this.tokenizer.tokenize(conv.userMessage.toLowerCase()));
      const intersection = new Set([...userTokens].filter(x => convTokens.has(x)));
      const union = new Set([...userTokens, ...convTokens]);
      const similarity = intersection.size / union.size;
      
      return { ...conv, similarity };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(c => ({
        userMessage: c.userMessage,
        botResponse: c.botResponse,
        similarity: c.similarity
      }));
  }

  // Export training data for intent classifier
  exportTrainingData() {
    const exportData = this.conversations
      .filter(c => c.confidence > 0.7) // Only export high-confidence conversations
      .map(c => ({
        input: c.userMessage.toLowerCase(),
        output: c.intent
      }));

    return exportData;
  }

  // Generate statistics report
  generateReport() {
    const analysis = this.analyzeConversations();
    const suggestions = this.getImprovementSuggestions();

    return {
      summary: {
        totalConversations: analysis.totalConversations,
        uniqueIntents: Object.keys(analysis.intentDistribution).length,
        averageConfidence: (analysis.averageConfidence * 100).toFixed(2) + '%',
        totalFeedback: analysis.feedbackStats.total,
        satisfactionRate: analysis.feedbackStats.total > 0
          ? ((analysis.feedbackStats.helpful / analysis.feedbackStats.total) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      intentDistribution: analysis.intentDistribution,
      lowConfidenceIntents: analysis.lowConfidenceIntents,
      feedback: analysis.feedbackStats,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    };
  }

  // Clear old conversations (data retention)
  clearOldConversations(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldLength = this.conversations.length;
    this.conversations = this.conversations.filter(c => 
      new Date(c.timestamp) > cutoffDate
    );

    const removed = oldLength - this.conversations.length;
    console.log(`Removed ${removed} conversations older than ${daysToKeep} days`);

    this.saveData();
    return removed;
  }
}

module.exports = new ConversationLearner();
