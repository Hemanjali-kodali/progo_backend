"""
Intent Classification using Scikit-learn
Advanced ML model for chatbot intent recognition
"""

import json
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import joblib
from typing import Dict, List, Tuple
import os

class IntentClassifier:
    """Advanced Intent Classification with Random Forest"""
    
    def __init__(self, model_path='models/intent_classifier.pkl',
                 vectorizer_path='models/intent_vectorizer.pkl'):
        self.model_path = model_path
        self.vectorizer_path = vectorizer_path
        self.model = None
        self.vectorizer = None
        self.label_encoder = LabelEncoder()
        self.intent_labels = []
        
    def get_training_data(self) -> Tuple[List[str], List[str]]:
        """Get comprehensive training data"""
        
        training_data = {
            'greeting': [
                'hello', 'hi', 'hey', 'good morning', 'good afternoon',
                'good evening', 'greetings', 'hi there', 'hello there',
                'hey there', 'whats up', 'how are you', 'howdy'
            ],
            'attendance': [
                'what is my attendance', 'show my attendance', 'check attendance',
                'my attendance percentage', 'how much attendance do i have',
                'attendance status', 'am i present today', 'how many days present',
                'attendance record', 'view attendance', 'total attendance',
                'attendance report', 'show attendance details', 'check my presence',
                'how many classes attended', 'attendance percentage', 'my present days'
            ],
            'marks': [
                'what are my marks', 'show my marks', 'check marks', 'my scores',
                'what did i score', 'exam results', 'my grades', 'show grades',
                'marks obtained', 'view marks', 'result', 'my performance in exams',
                'how much did i score', 'marks in subject', 'subject marks',
                'exam marks', 'test scores', 'my marks card'
            ],
            'fees': [
                'what are my fees', 'fee status', 'how much fees', 'pending fees',
                'fees due', 'payment status', 'fee payment', 'outstanding fees',
                'total fees', 'fees amount', 'check fees', 'fee details',
                'how much do i owe', 'fee structure', 'tuition fees', 'fees paid'
            ],
            'schedule': [
                'what is my schedule', 'show timetable', 'class schedule', 'todays classes',
                'class timings', 'when is next class', 'timetable', 'class timing',
                'what classes today', 'schedule for tomorrow', 'weekly schedule',
                'class routine', 'subject schedule', 'show my timetable'
            ],
            'performance': [
                'how am i performing', 'my performance', 'academic performance',
                'am i doing well', 'performance analysis', 'how is my progress',
                'cgpa details', 'my cgpa', 'gpa status', 'overall performance',
                'semester performance', 'academic progress', 'performance report',
                'how am i doing academically', 'my grades overview'
            ],
            'backlog': [
                'do i have backlogs', 'backlog status', 'how many backlogs',
                'failed subjects', 'backlog details', 'kt details', 'arrears',
                'which subjects failed', 'backlog list', 'failed exams',
                'subjects to clear', 'pending subjects'
            ],
            'exam': [
                'when is exam', 'exam schedule', 'exam dates', 'upcoming exams',
                'exam timetable', 'next exam', 'exam details', 'test schedule',
                'when is next exam', 'exam calendar', 'examination dates',
                'exam information', 'test dates'
            ],
            'subject': [
                'what subjects am i studying', 'my subjects', 'subject list',
                'subjects this semester', 'which subjects', 'subject details',
                'subjects enrolled', 'course subjects', 'subject information',
                'syllabus', 'course details', 'subjects in current semester'
            ],
            'help': [
                'help', 'what can you do', 'help me', 'how to use this',
                'what are your features', 'assist me', 'guide me',
                'how does this work', 'need help', 'support', 'what can i ask'
            ],
            'thank_you': [
                'thank you', 'thanks', 'appreciate it', 'thanks a lot',
                'thank you very much', 'grateful', 'thanks so much',
                'that helps', 'perfect thanks', 'great thank you'
            ],
            'general_query': [
                'tell me about', 'what is', 'explain', 'how does', 'why',
                'can you tell me', 'i want to know', 'information about',
                'details about', 'what do you know about'
            ]
        }
        
        # Expand training data
        texts = []
        labels = []
        
        for intent, phrases in training_data.items():
            for phrase in phrases:
                texts.append(phrase)
                labels.append(intent)
                # Add variations
                texts.append(phrase + '?')
                labels.append(intent)
                texts.append(phrase.title())
                labels.append(intent)
        
        return texts, labels
    
    def train(self, texts: List[str] = None, labels: List[str] = None):
        """
        Train the intent classifier
        
        Args:
            texts: List of training texts (optional, uses default if None)
            labels: List of intent labels (optional, uses default if None)
        """
        # Get training data
        if texts is None or labels is None:
            texts, labels = self.get_training_data()
        
        print(f"Training with {len(texts)} samples across {len(set(labels))} intents")
        
        # Encode labels
        y = self.label_encoder.fit_transform(labels)
        self.intent_labels = list(self.label_encoder.classes_)
        
        # Create TF-IDF features
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),  # Unigrams, bigrams, trigrams
            min_df=1,
            lowercase=True,
            strip_accents='unicode'
        )
        
        X = self.vectorizer.fit_transform(texts)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=50,
            min_samples_split=2,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training Random Forest classifier...")
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"\nTraining Accuracy: {train_score:.4f}")
        print(f"Testing Accuracy: {test_score:.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5)
        print(f"Cross-Validation Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Detailed evaluation
        y_pred = self.model.predict(X_test)
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                   target_names=self.intent_labels,
                                   zero_division=0))
        
        # Save models
        self.save()
        
        return {
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_accuracy': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'n_samples': len(texts),
            'n_intents': len(self.intent_labels)
        }
    
    def predict(self, text: str, return_probabilities: bool = False) -> Dict:
        """
        Predict intent for given text
        
        Args:
            text: Input text
            return_probabilities: Whether to return all probabilities
            
        Returns:
            Dictionary with intent, confidence, and optionally all probabilities
        """
        if self.model is None or self.vectorizer is None:
            self.load()
        
        # Transform text
        X = self.vectorizer.transform([text])
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Get intent and confidence
        intent = self.label_encoder.inverse_transform([prediction])[0]
        confidence = float(probabilities[prediction])
        
        result = {
            'intent': intent,
            'confidence': confidence
        }
        
        # Add alternative intents
        if len(probabilities) > 1:
            # Get top 3 alternatives
            top_indices = np.argsort(probabilities)[-3:][::-1]
            alternatives = [
                {
                    'intent': self.label_encoder.inverse_transform([idx])[0],
                    'confidence': float(probabilities[idx])
                }
                for idx in top_indices if idx != prediction and probabilities[idx] > 0.1
            ]
            result['alternatives'] = alternatives
        
        if return_probabilities:
            result['all_probabilities'] = {
                self.label_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(probabilities)
            }
        
        return result
    
    def save(self):
        """Save model and vectorizer to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Save model
        joblib.dump(self.model, self.model_path)
        print(f"Model saved to {self.model_path}")
        
        # Save vectorizer and label encoder
        with open(self.vectorizer_path, 'wb') as f:
            pickle.dump({
                'vectorizer': self.vectorizer,
                'label_encoder': self.label_encoder,
                'intent_labels': self.intent_labels
            }, f)
        print(f"Vectorizer saved to {self.vectorizer_path}")
    
    def load(self):
        """Load model and vectorizer from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}. Please train first.")
        
        # Load model
        self.model = joblib.load(self.model_path)
        
        # Load vectorizer and label encoder
        with open(self.vectorizer_path, 'rb') as f:
            data = pickle.load(f)
            self.vectorizer = data['vectorizer']
            self.label_encoder = data['label_encoder']
            self.intent_labels = data['intent_labels']
        
        print(f"Model loaded from {self.model_path}")


# CLI Interface
if __name__ == '__main__':
    import sys
    
    classifier = IntentClassifier()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'train':
            # Train the model
            stats = classifier.train()
            print(json.dumps(stats, indent=2))
            
        elif command == 'predict':
            # Predict intent for text
            if len(sys.argv) < 3:
                print("Usage: python intent_classifier.py predict <text>")
                sys.exit(1)
            
            text = ' '.join(sys.argv[2:])
            result = classifier.predict(text, return_probabilities=True)
            print(json.dumps(result, indent=2))
            
        elif command == 'test':
            # Test the model
            test_cases = [
                "What is my attendance?",
                "Show me my marks",
                "How much fees do I have to pay?",
                "Hello",
                "Thank you",
                "When is the next exam?",
                "Do I have any backlogs?",
                "How am I performing this semester?"
            ]
            
            results = []
            for text in test_cases:
                result = classifier.predict(text)
                results.append({
                    'text': text,
                    'intent': result['intent'],
                    'confidence': result['confidence']
                })
                print(f"Text: {text}")
                print(f"  Intent: {result['intent']} ({result['confidence']:.3f})")
                print()
            
            print(json.dumps(results, indent=2))
    else:
        print("Usage:")
        print("  python intent_classifier.py train")
        print("  python intent_classifier.py predict <text>")
        print("  python intent_classifier.py test")
