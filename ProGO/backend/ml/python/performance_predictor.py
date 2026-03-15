"""
Performance Prediction using TensorFlow/Keras
Advanced ML model with feature engineering for student performance prediction
"""

import json
import numpy as np
import pandas as pd
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import os
import sys
sys.path.append(os.path.dirname(__file__))
from utils.feature_engineering import PerformanceFeatureEngineer, create_synthetic_training_data

class PerformancePredictor:
    """Advanced Performance Prediction with Neural Network"""
    
    def __init__(self, 
                 model_path='models/performance_predictor.h5',
                 scaler_path='models/performance_scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_engineer = PerformanceFeatureEngineer()
        self.feature_names = []
        
    def build_model(self, input_dim: int) -> keras.Model:
        """
        Build neural network model
        
        Args:
            input_dim: Number of input features
            
        Returns:
            Compiled Keras model
        """
        model = keras.Sequential([
            layers.Input(shape=(input_dim,)),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.3),
            layers.BatchNormalization(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.BatchNormalization(),
            layers.Dense(32, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dense(1, activation='linear')  # Regression output
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae', 'mse']
        )
        
        return model
    
    def train(self, use_synthetic: bool = True, n_samples: int = 2000):
        """
        Train the performance predictor
        
        Args:
            use_synthetic: Whether to use synthetic training data
            n_samples: Number of synthetic samples to generate
        """
        print(f"Generating {n_samples} training samples...")
        
        # Generate synthetic training data
        raw_data, targets = create_synthetic_training_data(n_samples)
        
        # Engineer features
        print("Engineering features...")
        engineered_features = []
        for idx in range(len(raw_data)):
            row_dict = raw_data.iloc[idx].to_dict()
            features = self.feature_engineer.create_features(row_dict)
            engineered_features.append(features[0])
        
        X = np.array(engineered_features)
        y = targets
        
        self.feature_names = self.feature_engineer.feature_names
        print(f"Created {X.shape[1]} features: {', '.join(self.feature_names)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        print("Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build model
        print("Building neural network...")
        self.model = self.build_model(X_train_scaled.shape[1])
        
        print(f"\nModel Architecture:")
        self.model.summary()
        
        # Callbacks
        early_stop = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        )
        
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001,
            verbose=1
        )
        
        # Train
        print("\nTraining model...")
        history = self.model.fit(
            X_train_scaled, y_train,
            validation_split=0.2,
            epochs=100,
            batch_size=32,
            callbacks=[early_stop, reduce_lr],
            verbose=1
        )
        
        # Evaluate
        print("\nEvaluating model...")
        train_loss, train_mae, train_mse = self.model.evaluate(X_train_scaled, y_train, verbose=0)
        test_loss, test_mae, test_mse = self.model.evaluate(X_test_scaled, y_test, verbose=0)
        
        # Predictions for metrics
        y_train_pred = self.model.predict(X_train_scaled, verbose=0).flatten()
        y_test_pred = self.model.predict(X_test_scaled, verbose=0).flatten()
        
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        print(f"\n{'='*60}")
        print(f"Training Results:")
        print(f"{'='*60}")
        print(f"Train MAE: {train_mae:.4f} | Train MSE: {train_mse:.4f} | Train R²: {train_r2:.4f}")
        print(f"Test  MAE: {test_mae:.4f} | Test  MSE: {test_mse:.4f} | Test  R²: {test_r2:.4f}")
        print(f"{'='*60}")
        
        # Save model
        self.save()
        
        return {
            'train_mae': float(train_mae),
            'train_mse': float(train_mse),
            'train_r2': float(train_r2),
            'test_mae': float(test_mae),
            'test_mse': float(test_mse),
            'test_r2': float(test_r2),
            'n_samples': n_samples,
            'n_features': X.shape[1],
            'feature_names': self.feature_names,
            'epochs_trained': len(history.history['loss'])
        }
    
    def predict(self, student_data: dict) -> dict:
        """
        Predict student performance
        
        Args:
            student_data: Dictionary containing student metrics
            
        Returns:
            Prediction results with insights
        """
        if self.model is None:
            self.load()
        
        # Engineer features
        features = self.feature_engineer.create_features(student_data)
        
        # Scale
        features_scaled = self.scaler.transform(features)
        
        # Predict
        prediction = self.model.predict(features_scaled, verbose=0)[0][0]
        predicted_cgpa = float(np.clip(prediction, 0, 10))
        
        # Generate insights
        insights = self._generate_insights(student_data, features[0], predicted_cgpa)
        
        return {
            'predicted_cgpa': predicted_cgpa,
            'current_cgpa': student_data.get('cgpa', 0),
            'improvement_potential': float(predicted_cgpa - student_data.get('cgpa', 0)),
            'confidence': self._calculate_confidence(student_data),
            'insights': insights,
            'recommendations': self._generate_recommendations(student_data, features[0])
        }
    
    def _calculate_confidence(self, data: dict) -> float:
        """Calculate prediction confidence based on data quality"""
        confidence = 1.0
        
        # Reduce confidence for missing or unrealistic data
        if data.get('attendance', 0) == 0:
            confidence *= 0.7
        if data.get('studyHours', 0) == 0:
            confidence *= 0.8
        if data.get('cgpa', 0) == 0:
            confidence *= 0.6
            
        return float(confidence)
    
    def _generate_insights(self, data: dict, features: np.ndarray, predicted_cgpa: float) -> list:
        """Generate actionable insights"""
        insights = []
        
        # Attendance insight
        attendance = data.get('attendance', 0)
        if attendance < 75:
            insights.append({
                'type': 'warning',
                'category': 'attendance',
                'message': f'Low attendance ({attendance}%) is a major concern. Aim for 75%+ to avoid detention.',
                'priority': 'high'
            })
        elif attendance >= 90:
            insights.append({
                'type': 'positive',
                'category': 'attendance',
                'message': f'Excellent attendance ({attendance}%)! Keep it up.',
                'priority': 'low'
            })
        
        # CGPA trend
        current_cgpa = data.get('cgpa', 0)
        improvement = predicted_cgpa - current_cgpa
        if improvement > 0.5:
            insights.append({
                'type': 'positive',
                'category': 'performance',
                'message': f'Strong improvement trajectory! Predicted CGPA: {predicted_cgpa:.2f} (up from {current_cgpa:.2f})',
                'priority': 'medium'
            })
        elif improvement < -0.3:
            insights.append({
                'type': 'warning',
                'category': 'performance',
                'message': f'Performance may decline to {predicted_cgpa:.2f}. Take corrective action now.',
                'priority': 'high'
            })
        
        # Backlog warning
        backlogs = data.get('backlogs', 0)
        if backlogs > 0:
            insights.append({
                'type': 'warning',
                'category': 'backlog',
                'message': f'You have {backlogs} backlog(s). Clear them as soon as possible.',
                'priority': 'high'
            })
        
        # Study hours
        study_hours = data.get('studyHours', 0)
        if study_hours < 3:
            insights.append({
                'type': 'warning',
                'category': 'study_habits',
                'message': f'Low study hours ({study_hours}h/day). Recommend 4-6 hours for optimal results.',
                'priority': 'medium'
            })
        
        # Academic consistency (feature index 10)
        if len(features) > 10:
            consistency = features[10]
            if consistency < 0.7:
                insights.append({
                    'type': 'warning',
                    'category': 'consistency',
                    'message': 'Inconsistent performance across subjects. Focus on weaker areas.',
                    'priority': 'medium'
                })
        
        return insights
    
    def _generate_recommendations(self, data: dict, features: np.ndarray) -> list:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Attendance recommendations
        attendance = data.get('attendance', 0)
        if attendance < 75:
            recommendations.append({
                'action': 'Attend all upcoming classes regularly',
                'impact': 'high',
                'category': 'attendance'
            })
        
        # Study recommendations
        study_hours = data.get('studyHours', 0)
        if study_hours < 4:
            target_hours = 5
            recommendations.append({
                'action': f'Increase study time from {study_hours}h to {target_hours}h per day',
                'impact': 'high',
                'category': 'study_habits'
            })
        
        # Backlog clearing
        backlogs = data.get('backlogs', 0)
        if backlogs > 0:
            recommendations.append({
                'action': f'Prioritize clearing {backlogs} backlog subject(s) this semester',
                'impact': 'critical',
                'category': 'backlog'
            })
        
        # Score improvement
        theory_score = data.get('theoryScore', 0)
        practical_score = data.get('practicalScore', 0)
        
        if theory_score < 60 or practical_score < 60:
            recommendations.append({
                'action': 'Focus on fundamentals - revise weak topics regularly',
                'impact': 'high',
                'category': 'academics'
            })
        
        # Balanced performance
        if abs(theory_score - practical_score) > 20:
            recommendations.append({
                'action': 'Balance theory and practical preparation',
                'impact': 'medium',
                'category': 'academics'
            })
        
        # Engagement
        if len(features) > 9:
            engagement = features[9]  # engagement_score
            if engagement < 0.5:
                recommendations.append({
                    'action': 'Increase classroom participation and self-study time',
                    'impact': 'high',
                    'category': 'engagement'
                })
        
        return recommendations
    
    def save(self):
        """Save model and scaler"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Save Keras model
        self.model.save(self.model_path)
        print(f"Model saved to {self.model_path}")
        
        # Save scaler and feature engineer
        joblib.dump({
            'scaler': self.scaler,
            'feature_engineer': self.feature_engineer,
            'feature_names': self.feature_names
        }, self.scaler_path)
        print(f"Scaler saved to {self.scaler_path}")
    
    def load(self):
        """Load model and scaler"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}. Please train first.")
        
        # Load Keras model
        self.model = keras.models.load_model(self.model_path)
        print(f"Model loaded from {self.model_path}")
        
        # Load scaler and feature engineer
        data = joblib.load(self.scaler_path)
        self.scaler = data['scaler']
        self.feature_engineer = data['feature_engineer']
        self.feature_names = data['feature_names']


# CLI Interface
if __name__ == '__main__':
    predictor = PerformancePredictor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'train':
            # Train the model
            n_samples = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
            stats = predictor.train(n_samples=n_samples)
            print(json.dumps(stats, indent=2))
            
        elif command == 'predict':
            # Predict performance for student data (JSON input)
            if len(sys.argv) < 3:
                print("Usage: python performance_predictor.py predict <json_data>")
                sys.exit(1)
            
            student_data = json.loads(sys.argv[2])
            result = predictor.predict(student_data)
            print(json.dumps(result, indent=2))
            
        elif command == 'test':
            # Test with sample data
            test_cases = [
                {
                    'name': 'Excellent Student',
                    'data': {
                        'attendance': 95,
                        'cgpa': 8.5,
                        'semester': 4,
                        'backlogs': 0,
                        'studyHours': 6,
                        'theoryScore': 85,
                        'practicalScore': 88,
                        'assignmentScore': 90
                    }
                },
                {
                    'name': 'Average Student',
                    'data': {
                        'attendance': 75,
                        'cgpa': 6.5,
                        'semester': 5,
                        'backlogs': 1,
                        'studyHours': 4,
                        'theoryScore': 65,
                        'practicalScore': 70,
                        'assignmentScore': 68
                    }
                },
                {
                    'name': 'Struggling Student',
                    'data': {
                        'attendance': 60,
                        'cgpa': 5.2,
                        'semester': 3,
                        'backlogs': 3,
                        'studyHours': 2,
                        'theoryScore': 50,
                        'practicalScore': 55,
                        'assignmentScore': 52
                    }
                }
            ]
            
            results = []
            for case in test_cases:
                print(f"\n{'='*60}")
                print(f"Testing: {case['name']}")
                print(f"{'='*60}")
                result = predictor.predict(case['data'])
                results.append({
                    'name': case['name'],
                    'prediction': result
                })
                print(f"Current CGPA: {result['current_cgpa']:.2f}")
                print(f"Predicted CGPA: {result['predicted_cgpa']:.2f}")
                print(f"Improvement: {result['improvement_potential']:.2f}")
                print(f"Confidence: {result['confidence']:.2f}")
                print(f"\nInsights:")
                for insight in result['insights']:
                    print(f"  [{insight['priority']}] {insight['message']}")
                print(f"\nRecommendations:")
                for rec in result['recommendations']:
                    print(f"  [{rec['impact']}] {rec['action']}")
            
            print(f"\n{'='*60}")
            print(json.dumps(results, indent=2))
    else:
        print("Usage:")
        print("  python performance_predictor.py train [n_samples]")
        print("  python performance_predictor.py predict '<json_data>'")
        print("  python performance_predictor.py test")
