"""
Feature Engineering Utilities for Student Performance Prediction
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, List, Tuple

class PerformanceFeatureEngineer:
    """Advanced feature engineering for student performance prediction"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = []
        
    def create_features(self, data: Dict) -> np.ndarray:
        """
        Create engineered features from raw student data
        
        Args:
            data: Dictionary containing student metrics
            
        Returns:
            Numpy array of engineered features
        """
        features = {}
        
        # Basic features (normalize to 0-1)
        features['attendance_rate'] = data.get('attendance', 0) / 100.0
        features['cgpa'] = data.get('cgpa', 0) / 10.0
        features['semester'] = data.get('semester', 1) / 8.0  # Assuming max 8 semesters
        features['backlogs'] = min(data.get('backlogs', 0) / 10.0, 1.0)  # Cap at 10
        features['study_hours'] = data.get('studyHours', 0) / 24.0  # Normalize to daily hours
        
        # Subject-specific features
        features['theory_score'] = data.get('theoryScore', 0) / 100.0
        features['practical_score'] = data.get('practicalScore', 0) / 100.0
        features['assignment_score'] = data.get('assignmentScore', 0) / 100.0
        
        # Derived features
        # 1. Attendance category (categorical to numerical)
        attendance = data.get('attendance', 0)
        if attendance >= 75:
            features['attendance_category'] = 1.0  # High
        elif attendance >= 65:
            features['attendance_category'] = 0.5  # Medium
        else:
            features['attendance_category'] = 0.0  # Low
            
        # 2. Engagement score (composite of attendance and study hours)
        features['engagement_score'] = (
            features['attendance_rate'] * 0.6 + 
            features['study_hours'] * 0.4
        )
        
        # 3. Academic consistency (based on theory, practical, assignment balance)
        scores = [
            features['theory_score'],
            features['practical_score'],
            features['assignment_score']
        ]
        features['academic_consistency'] = 1.0 - np.std(scores)  # Lower std = higher consistency
        
        # 4. Risk score (composite indicator)
        features['risk_score'] = self._calculate_risk_score(data, features)
        
        # 5. Performance trend (if historical data available)
        features['performance_trend'] = self._calculate_trend(data)
        
        # 6. Workload pressure
        features['workload_pressure'] = min(
            (data.get('backlogs', 0) * 0.3 + data.get('semester', 1) * 0.1) / 2.0,
            1.0
        )
        
        # 7. Study efficiency (CGPA relative to study hours)
        if features['study_hours'] > 0:
            features['study_efficiency'] = features['cgpa'] / features['study_hours']
        else:
            features['study_efficiency'] = 0.0
            
        # Store feature names for later use
        self.feature_names = list(features.keys())
        
        # Convert to numpy array
        return np.array(list(features.values())).reshape(1, -1)
    
    def _calculate_risk_score(self, data: Dict, features: Dict) -> float:
        """Calculate composite risk score"""
        risk = 0.0
        
        # Attendance risk (inverse)
        risk += (1.0 - features['attendance_rate']) * 0.3
        
        # CGPA risk (inverse)
        risk += (1.0 - features['cgpa']) * 0.3
        
        # Backlog risk
        risk += features['backlogs'] * 0.2
        
        # Low study hours risk
        if features['study_hours'] < 0.2:  # Less than ~5 hours per day
            risk += 0.2
            
        return min(risk, 1.0)
    
    def _calculate_trend(self, data: Dict) -> float:
        """Calculate performance trend if historical data available"""
        if 'historicalCGPA' in data and len(data['historicalCGPA']) >= 2:
            cgpas = data['historicalCGPA']
            # Simple linear trend
            trend = (cgpas[-1] - cgpas[0]) / len(cgpas)
            return np.clip(trend / 2.0 + 0.5, 0, 1)  # Normalize to 0-1
        return 0.5  # Neutral if no history
    
    def batch_create_features(self, data_list: List[Dict]) -> np.ndarray:
        """Create features for multiple data points"""
        features_list = [self.create_features(data) for data in data_list]
        return np.vstack(features_list)
    
    def fit_scaler(self, features: np.ndarray):
        """Fit the scaler on training data"""
        self.scaler.fit(features)
        
    def transform(self, features: np.ndarray) -> np.ndarray:
        """Transform features using fitted scaler"""
        return self.scaler.transform(features)
    
    def fit_transform(self, features: np.ndarray) -> np.ndarray:
        """Fit and transform in one step"""
        return self.scaler.fit_transform(features)


class IntentFeatureExtractor:
    """Feature extraction for intent classification"""
    
    def __init__(self):
        self.vocab = set()
        self.max_features = 1000
        
    def extract_features(self, text: str) -> Dict[str, float]:
        """
        Extract features from text for intent classification
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of features
        """
        features = {}
        text_lower = text.lower()
        
        # Keyword presence features
        keyword_groups = {
            'attendance': ['attendance', 'present', 'absent', 'leave'],
            'marks': ['marks', 'score', 'grade', 'result', 'exam'],
            'fee': ['fee', 'payment', 'paid', 'due', 'amount'],
            'schedule': ['schedule', 'timetable', 'class', 'timing'],
            'performance': ['performance', 'cgpa', 'gpa', 'semester'],
            'backlog': ['backlog', 'fail', 'kt', 'arrear'],
            'exam': ['exam', 'test', 'assessment', 'quiz'],
            'subject': ['subject', 'course', 'syllabus'],
            'time': ['when', 'time', 'date', 'today', 'tomorrow'],
            'comparison': ['compare', 'difference', 'versus', 'vs'],
        }
        
        for group, keywords in keyword_groups.items():
            features[f'has_{group}_keywords'] = float(
                any(kw in text_lower for kw in keywords)
            )
        
        # Question indicators
        question_words = ['what', 'when', 'where', 'who', 'why', 'how', 'which']
        features['is_question'] = float(
            any(text_lower.startswith(qw) for qw in question_words) or
            '?' in text
        )
        
        # Sentiment indicators (basic)
        positive_words = ['good', 'great', 'excellent', 'thank', 'thanks']
        negative_words = ['bad', 'poor', 'low', 'fail', 'problem']
        
        features['has_positive'] = float(any(pw in text_lower for pw in positive_words))
        features['has_negative'] = float(any(nw in text_lower for nw in negative_words))
        
        # Text statistics
        words = text_lower.split()
        features['word_count'] = min(len(words) / 20.0, 1.0)  # Normalize
        features['avg_word_length'] = min(np.mean([len(w) for w in words]) / 10.0, 1.0) if words else 0
        
        # Special characters
        features['has_question_mark'] = float('?' in text)
        features['has_exclamation'] = float('!' in text)
        
        return features


def create_synthetic_training_data(n_samples: int = 1000) -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Create synthetic training data for performance prediction
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        Tuple of (features_df, target_array)
    """
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        # Generate correlated features
        base_performance = np.random.normal(0.7, 0.15)  # Base performance level
        
        attendance = np.clip(base_performance * 100 + np.random.normal(0, 10), 0, 100)
        current_cgpa = np.clip(base_performance * 10 + np.random.normal(0, 0.5), 0, 10)
        study_hours = np.clip(base_performance * 8 + np.random.normal(0, 2), 0, 12)
        
        # Backlogs inversely correlated
        backlogs = max(0, int((1 - base_performance) * 5 + np.random.normal(0, 1)))
        
        # Scores
        theory = np.clip(base_performance * 100 + np.random.normal(0, 10), 0, 100)
        practical = np.clip(base_performance * 100 + np.random.normal(0, 10), 0, 100)
        assignment = np.clip(base_performance * 100 + np.random.normal(0, 10), 0, 100)
        
        semester = np.random.randint(1, 9)
        
        # Target: Future CGPA with some noise
        future_cgpa = np.clip(
            current_cgpa + np.random.normal(0, 0.2),
            max(0, current_cgpa - 1),
            min(10, current_cgpa + 0.5)
        )
        
        data.append({
            'attendance': attendance,
            'cgpa': current_cgpa,
            'semester': semester,
            'backlogs': backlogs,
            'studyHours': study_hours,
            'theoryScore': theory,
            'practicalScore': practical,
            'assignmentScore': assignment,
            'target_cgpa': future_cgpa
        })
    
    df = pd.DataFrame(data)
    targets = df['target_cgpa'].values
    features_df = df.drop('target_cgpa', axis=1)
    
    return features_df, targets
