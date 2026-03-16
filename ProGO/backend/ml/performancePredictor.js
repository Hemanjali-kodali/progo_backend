const brain = require('brain.js');
const fs = require('fs');
const path = require('path');

class PerformancePredictor {
  constructor() {
    this.network = new brain.NeuralNetwork({
      hiddenLayers: [64, 32, 16],
      activation: 'sigmoid',
      learningRate: 0.01
    });
    this.modelPath = path.join(__dirname, 'models', 'performance-model.json');
    this.isInitialized = false;
  }

  // Initialize or load model
  async initialize() {
    try {
      if (fs.existsSync(this.modelPath)) {
        console.log('📊 Loading Performance Prediction Model...');
        await this.loadModel();
      } else {
        console.log('📊 Performance Prediction Model ready for training...');
      }
      this.isInitialized = true;
      console.log('✓ Performance Predictor initialized');
    } catch (error) {
      console.error('✗ Error initializing Performance Predictor:', error);
      throw error;
    }
  }

  // Generate sample training data for initial model training
  generateSampleTrainingData(sampleCount = 1000) {
    const trainingData = [];

    for (let i = 0; i < sampleCount; i++) {
      // Generate random but realistic student data
      const attendance = 50 + Math.random() * 50; // 50-100%
      const previousCGPA = 5 + Math.random() * 5; // 5-10
      const assignmentScore = 40 + Math.random() * 60; // 40-100
      const midtermScore = 40 + Math.random() * 60; // 40-100
      const participationScore = Math.random() * 10; // 0-10
      const backlogs = Math.floor(Math.random() * 5); // 0-4
      const studyHours = 5 + Math.random() * 20; // 5-25 hours/week
      const semester = Math.floor(Math.random() * 8) + 1; // 1-8

      // Calculate next semester CGPA with realistic formula
      let nextSemesterCGPA = 
        (attendance * 0.15 / 10) +
        (previousCGPA * 0.40) +
        (assignmentScore * 0.15 / 10) +
        (midtermScore * 0.15 / 10) +
        (participationScore * 0.05) -
        (backlogs * 0.3) +
        (studyHours * 0.05);

      // Add some randomness
      nextSemesterCGPA += (Math.random() - 0.5) * 0.5;

      // Normalize to 0-10 range
      nextSemesterCGPA = Math.max(0, Math.min(10, nextSemesterCGPA));

      trainingData.push({
        attendance,
        previousCGPA,
        assignmentScore,
        midtermScore,
        participationScore,
        backlogs,
        studyHours,
        semester,
        nextSemesterCGPA
      });
    }

    return trainingData;
  }

  // Load training data from CSV dataset
  loadTrainingDataFromCSV(csvPath) {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Dataset not found at ${csvPath}`);
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      throw new Error('Dataset CSV is empty');
    }

    const lines = raw.split(/\r?\n/);
    const headers = this.parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => this.parseCsvLine(line));

    return rows
      .filter((cols) => cols.length === headers.length)
      .map((cols) => {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = cols[idx];
        });

        const attendance = parseFloat(row.attendance_percentage || 0);
        const previousCGPA = parseFloat(row.previous_cgpa || 0);
        const assignmentsCompleted = parseFloat(row.assignments_completed || 0);
        const extracurricular = parseFloat(row.extracurricular_activities || 0);
        const semester = parseInt(row.semester || 1, 10);
        const studyHoursPerDay = parseFloat(row.study_hours_per_day || 0);
        const hasBacklogs = String(row['Do I have any backlogs?'] || '').toLowerCase() === 'yes';

        const studyHours = Math.min(studyHoursPerDay * 4, 25);
        const assignmentScore = Math.max(0, Math.min(100, assignmentsCompleted));
        const participationScore = Math.max(0, Math.min(10, extracurricular * 1.6));
        const backlogs = hasBacklogs ? Math.max(1, Math.round((10 - previousCGPA) / 2)) : 0;
        const midtermScore = Math.max(
          40,
          Math.min(100, previousCGPA * 10 + (attendance - 75) * 0.35 + (Math.random() - 0.5) * 8)
        );

        let nextSemesterCGPA =
          previousCGPA * 0.6 +
          (attendance / 100) * 1.3 +
          (assignmentScore / 100) * 0.9 +
          (midtermScore / 100) * 1.0 +
          (participationScore / 10) * 0.4 -
          backlogs * 0.35 +
          (studyHours / 25) * 0.6 +
          (Math.random() - 0.5) * 0.25;

        if (row.performance_category === 'Excellent') nextSemesterCGPA += 0.25;
        if (row.performance_category === 'Needs Improvement') nextSemesterCGPA -= 0.25;

        nextSemesterCGPA = Math.max(0, Math.min(10, nextSemesterCGPA));

        return {
          attendance,
          previousCGPA,
          assignmentScore,
          midtermScore,
          participationScore,
          backlogs,
          studyHours,
          semester,
          nextSemesterCGPA
        };
      });
  }

  parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }

    values.push(current);
    return values;
  }

  // Train the model with historical data
  async train(trainingData) {
    try {
      console.log('🎓 Training Performance Prediction Model...');

      // Prepare training data for Brain.js
      const brainTrainingData = trainingData.map(d => ({
        input: [
          d.attendance / 100,           // Normalized attendance
          d.previousCGPA / 10,           // Normalized CGPA
          d.assignmentScore / 100,       // Normalized assignment score
          d.midtermScore / 100,          // Normalized midterm score
          d.participationScore / 10,     // Normalized participation
          d.backlogs / 10,               // Normalized backlogs count
          d.studyHours / 25,             // Normalized study hours (assuming max 25)
          d.semester / 8                 // Normalized semester number
        ],
        output: [d.nextSemesterCGPA / 10] // Normalized target
      }));

      console.log(`  📊 Training with ${brainTrainingData.length} samples...`);

      const startTime = Date.now();

      const stats = this.network.train(brainTrainingData, {
        iterations: 5000,
        errorThresh: 0.005,
        log: true,
        logPeriod: 500,
        learningRate: 0.01,
        callback: (stats) => {
          if (stats.iterations % 500 === 0) {
            console.log(`  ⏳ Iteration ${stats.iterations}: error = ${stats.error.toFixed(6)}`);
          }
        }
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✓ Model trained successfully in ${duration}s. Final error: ${stats.error.toFixed(6)}`);
      
      // Save the trained model
      await this.saveModel();
      
      return stats;
    } catch (error) {
      console.error('✗ Error training model:', error);
      throw error;
    }
  }

  // Predict next semester CGPA
  async predict(studentData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const input = [
        studentData.attendance / 100,
        studentData.previousCGPA / 10,
        studentData.assignmentScore / 100,
        studentData.midtermScore / 100,
        studentData.participationScore / 10,
        studentData.backlogs / 10,
        studentData.studyHours / 25,
        studentData.semester / 8
      ];

      const output = this.network.run(input);
      const predictedCGPA = output[0] * 10;

      return {
        predictedCGPA: parseFloat(predictedCGPA.toFixed(2)),
        confidence: this.calculatePredictionConfidence(studentData),
        factors: this.analyzeContributingFactors(studentData)
      };
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw error;
    }
  }

  // Calculate prediction confidence based on data quality
  calculatePredictionConfidence(studentData) {
    let confidence = 1.0;

    // Reduce confidence if we have incomplete data
    if (!studentData.attendance) confidence *= 0.9;
    if (!studentData.previousCGPA) confidence *= 0.9;
    if (!studentData.assignmentScore) confidence *= 0.95;
    if (!studentData.midtermScore) confidence *= 0.95;

    // Reduce confidence for edge cases
    if (studentData.attendance < 60) confidence *= 0.85;
    if (studentData.backlogs > 3) confidence *= 0.85;

    return parseFloat(confidence.toFixed(2));
  }

  // Analyze which factors contribute most to performance
  analyzeContributingFactors(studentData) {
    const factors = [];

    // Attendance analysis
    if (studentData.attendance >= 85) {
      factors.push({ factor: 'Attendance', impact: 'positive', weight: 'high', value: `${studentData.attendance}%` });
    } else if (studentData.attendance >= 75) {
      factors.push({ factor: 'Attendance', impact: 'neutral', weight: 'medium', value: `${studentData.attendance}%` });
    } else {
      factors.push({ factor: 'Attendance', impact: 'negative', weight: 'high', value: `${studentData.attendance}%` });
    }

    // Previous CGPA analysis
    if (studentData.previousCGPA >= 8) {
      factors.push({ factor: 'Previous CGPA', impact: 'positive', weight: 'very high', value: studentData.previousCGPA });
    } else if (studentData.previousCGPA >= 6) {
      factors.push({ factor: 'Previous CGPA', impact: 'neutral', weight: 'high', value: studentData.previousCGPA });
    } else {
      factors.push({ factor: 'Previous CGPA', impact: 'negative', weight: 'very high', value: studentData.previousCGPA });
    }

    // Backlogs analysis
    if (studentData.backlogs === 0) {
      factors.push({ factor: 'Backlogs', impact: 'positive', weight: 'high', value: 0 });
    } else if (studentData.backlogs <= 2) {
      factors.push({ factor: 'Backlogs', impact: 'negative', weight: 'medium', value: studentData.backlogs });
    } else {
      factors.push({ factor: 'Backlogs', impact: 'negative', weight: 'high', value: studentData.backlogs });
    }

    // Study hours analysis
    if (studentData.studyHours >= 18) {
      factors.push({ factor: 'Study Hours', impact: 'positive', weight: 'medium', value: `${studentData.studyHours}/week` });
    } else if (studentData.studyHours >= 12) {
      factors.push({ factor: 'Study Hours', impact: 'neutral', weight: 'low', value: `${studentData.studyHours}/week` });
    } else {
      factors.push({ factor: 'Study Hours', impact: 'negative', weight: 'medium', value: `${studentData.studyHours}/week` });
    }

    return factors;
  }

  // Analyze performance and provide insights
  async analyzePerformance(studentData) {
    try {
      const prediction = await this.predict(studentData);
      
      const insights = {
        prediction: prediction.predictedCGPA,
        confidence: prediction.confidence,
        currentPerformance: this.categorizePerformance(studentData.previousCGPA),
        predictedPerformance: this.categorizePerformance(prediction.predictedCGPA),
        trend: this.analyzeTrend(studentData.previousCGPA, prediction.predictedCGPA),
        contributingFactors: prediction.factors,
        recommendations: this.generateRecommendations(studentData, prediction)
      };

      return insights;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  // Categorize performance level
  categorizePerformance(cgpa) {
    if (cgpa >= 9) return 'Excellent';
    if (cgpa >= 8) return 'Very Good';
    if (cgpa >= 7) return 'Good';
    if (cgpa >= 6) return 'Satisfactory';
    if (cgpa >= 5) return 'Needs Improvement';
    return 'Critical';
  }

  // Analyze performance trend
  analyzeTrend(currentCGPA, predictedCGPA) {
    const diff = predictedCGPA - currentCGPA;
    
    if (diff >= 0.5) return { direction: 'improving', magnitude: 'significant', change: diff };
    if (diff >= 0.2) return { direction: 'improving', magnitude: 'moderate', change: diff };
    if (diff > -0.2) return { direction: 'stable', magnitude: 'minimal', change: diff };
    if (diff > -0.5) return { direction: 'declining', magnitude: 'moderate', change: diff };
    return { direction: 'declining', magnitude: 'significant', change: diff };
  }

  // Generate personalized recommendations
  generateRecommendations(studentData, prediction) {
    const recommendations = [];

    // Attendance recommendation
    if (studentData.attendance < 85) {
      recommendations.push({
        area: 'Attendance',
        priority: studentData.attendance < 75 ? 'critical' : 'high',
        message: `Increase attendance to at least 85%. Current: ${studentData.attendance}%`,
        potentialImpact: '+0.4 CGPA points'
      });
    }

    // Backlogs recommendation
    if (studentData.backlogs > 0) {
      recommendations.push({
        area: 'Backlogs',
        priority: 'critical',
        message: `Clear ${studentData.backlogs} pending backlog(s) immediately`,
        potentialImpact: '+0.5 CGPA points'
      });
    }

    // Study hours recommendation
    if (studentData.studyHours < 15) {
      recommendations.push({
        area: 'Study Time',
        priority: 'medium',
        message: `Increase study hours to at least 15-20 hours per week. Current: ${studentData.studyHours}`,
        potentialImpact: '+0.3 CGPA points'
      });
    }

    // Assignment scores recommendation
    if (studentData.assignmentScore < 80) {
      recommendations.push({
        area: 'Assignments',
        priority: 'medium',
        message: 'Focus on completing assignments with better quality',
        potentialImpact: '+0.2 CGPA points'
      });
    }

    // Midterm scores recommendation
    if (studentData.midtermScore < 75) {
      recommendations.push({
        area: 'Exam Preparation',
        priority: 'high',
        message: 'Improve exam preparation and revision strategies',
        potentialImpact: '+0.3 CGPA points'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Train from database records
  async trainFromDatabase(studentRecords) {
    try {
      console.log('📚 Training from database records...');
      
      const trainingData = studentRecords.map(record => ({
        attendance: record.attendance || 75,
        previousCGPA: record.previousCGPA || 7,
        assignmentScore: record.assignmentScore || 75,
        midtermScore: record.midtermScore || 75,
        participationScore: record.participationScore || 5,
        backlogs: record.backlogs || 0,
        studyHours: record.studyHours || 15,
        semester: record.semester || 1,
        nextSemesterCGPA: record.nextSemesterCGPA || record.previousCGPA
      }));

      await this.train(trainingData);
      console.log('✓ Model trained from database successfully');
    } catch (error) {
      console.error('Error training from database:', error);
      throw error;
    }
  }

  // Save trained model to file
  async saveModel() {
    try {
      const modelDir = path.join(__dirname, 'models');
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      const model = this.network.toJSON();
      fs.writeFileSync(this.modelPath, JSON.stringify(model));
      console.log('✓ Performance model saved to:', this.modelPath);
    } catch (error) {
      console.error('✗ Error saving model:', error);
    }
  }

  // Load trained model from file
  async loadModel() {
    try {
      if (fs.existsSync(this.modelPath)) {
        const model = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
        this.network.fromJSON(model);
        console.log('✓ Performance Prediction model loaded');
        return true;
      } else {
        console.log('⚠ No trained model found');
        return false;
      }
    } catch (error) {
      console.error('✗ Error loading model:', error);
      return false;
    }
  }
}

module.exports = new PerformancePredictor();
