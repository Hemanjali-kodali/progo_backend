/**
 * Python ML Bridge
 * Connects Node.js backend to Python ML models
 */

const { spawn } = require('child_process');
const path = require('path');

class PythonMLBridge {
  constructor() {
    this.pythonPath = 'python'; // Use 'python3' on Unix systems if needed
    this.mlPath = path.join(__dirname, 'python');
  }

  /**
   * Execute Python script and return parsed JSON result
   * @param {string} scriptName - Name of Python script (without .py)
   * @param {Array} args - Arguments to pass to script
   * @returns {Promise<any>} - Parsed JSON result
   */
  executePythonScript(scriptName, args = []) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.mlPath, `${scriptName}.py`);
      
      console.log(`Executing: ${this.pythonPath} ${scriptPath} ${args.join(' ')}`);
      
      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script error:\n${stderr}`);
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Try to parse last JSON object from output
          const lines = stdout.trim().split('\n');
          let jsonResult = null;
          
          // Search for JSON from end of output (some scripts print logs then JSON)
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              jsonResult = JSON.parse(lines[i]);
              break;
            } catch (e) {
              // Not JSON, continue searching
              continue;
            }
          }
          
          if (jsonResult) {
            resolve(jsonResult);
          } else {
            // If no JSON found, try parsing entire output
            resolve(JSON.parse(stdout.trim()));
          }
        } catch (error) {
          console.error('Failed to parse Python output as JSON:', stdout);
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Train intent classifier
   * @returns {Promise<Object>} - Training statistics
   */
  async trainIntentClassifier() {
    console.log('Training Intent Classifier (Python)...');
    return await this.executePythonScript('intent_classifier', ['train']);
  }

  /**
   * Predict intent for text
   * @param {string} text - Input text
   * @returns {Promise<Object>} - Intent prediction with confidence
   */
  async predictIntent(text) {
    return await this.executePythonScript('intent_classifier', ['predict', text]);
  }

  /**
   * Test intent classifier
   * @returns {Promise<Array>} - Test results
   */
  async testIntentClassifier() {
    return await this.executePythonScript('intent_classifier', ['test']);
  }

  /**
   * Train performance predictor
   * @param {number} nSamples - Number of training samples
   * @returns {Promise<Object>} - Training statistics
   */
  async trainPerformancePredictor(nSamples = 2000) {
    console.log(`Training Performance Predictor (Python) with ${nSamples} samples...`);
    return await this.executePythonScript('performance_predictor', ['train', nSamples.toString()]);
  }

  /**
   * Predict student performance
   * @param {Object} studentData - Student metrics
   * @returns {Promise<Object>} - Performance prediction with insights
   */
  async predictPerformance(studentData) {
    const jsonData = JSON.stringify(studentData);
    return await this.executePythonScript('performance_predictor', ['predict', jsonData]);
  }

  /**
   * Test performance predictor
   * @returns {Promise<Array>} - Test results
   */
  async testPerformancePredictor() {
    return await this.executePythonScript('performance_predictor', ['test']);
  }

  /**
   * Check if Python is available
   * @returns {Promise<boolean>}
   */
  async checkPythonAvailable() {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonPath, ['--version']);
      
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });
      
      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Check if required Python packages are installed
   * @returns {Promise<Object>} - Status of package availability
   */
  async checkPythonPackages() {
    try {
      const result = await this.executePythonScript('check_dependencies', []);
      return result;
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new PythonMLBridge();
