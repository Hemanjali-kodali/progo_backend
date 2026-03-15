"""
Master Training Script for All Python ML Models
"""

import json
import sys
import os
from intent_classifier import IntentClassifier
from performance_predictor import PerformancePredictor

def train_all_models(n_samples=2000):
    """Train all ML models"""
    print("="*80)
    print("PYTHON ML MODEL TRAINING")
    print("="*80)
    print()
    
    results = {}
    
    # Train Intent Classifier
    print("="*80)
    print("1. TRAINING INTENT CLASSIFIER")
    print("="*80)
    try:
        classifier = IntentClassifier()
        intent_stats = classifier.train()
        results['intent_classifier'] = {
            'status': 'success',
            'stats': intent_stats
        }
        print("✓ Intent Classifier training completed successfully")
    except Exception as e:
        print(f"✗ Intent Classifier training failed: {str(e)}")
        results['intent_classifier'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    print()
    
    # Train Performance Predictor
    print("="*80)
    print("2. TRAINING PERFORMANCE PREDICTOR")
    print("="*80)
    try:
        predictor = PerformancePredictor()
        perf_stats = predictor.train(n_samples=n_samples)
        results['performance_predictor'] = {
            'status': 'success',
            'stats': perf_stats
        }
        print("✓ Performance Predictor training completed successfully")
    except Exception as e:
        print(f"✗ Performance Predictor training failed: {str(e)}")
        results['performance_predictor'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    print()
    print("="*80)
    print("TRAINING SUMMARY")
    print("="*80)
    
    success_count = sum(1 for r in results.values() if r['status'] == 'success')
    total_count = len(results)
    
    print(f"Models trained successfully: {success_count}/{total_count}")
    print()
    
    for model_name, result in results.items():
        status_symbol = "✓" if result['status'] == 'success' else "✗"
        print(f"{status_symbol} {model_name}: {result['status']}")
        if result['status'] == 'success' and 'stats' in result:
            stats = result['stats']
            if 'test_accuracy' in stats:
                print(f"  - Test Accuracy: {stats['test_accuracy']:.4f}")
            if 'test_r2' in stats:
                print(f"  - Test R²: {stats['test_r2']:.4f}")
                print(f"  - Test MAE: {stats['test_mae']:.4f}")
    
    print()
    print("="*80)
    
    return results

def test_all_models():
    """Test all ML models"""
    print("="*80)
    print("TESTING ALL PYTHON ML MODELS")
    print("="*80)
    print()
    
    results = {}
    
    # Test Intent Classifier
    print("="*80)
    print("1. TESTING INTENT CLASSIFIER")
    print("="*80)
    try:
        classifier = IntentClassifier()
        classifier.load()
        
        test_texts = [
            "What is my attendance?",
            "Show me my marks",
            "How much fees?",
            "Hello",
            "Thank you",
            "When is the exam?"
        ]
        
        test_results = []
        for text in test_texts:
            prediction = classifier.predict(text)
            test_results.append({
                'text': text,
                'intent': prediction['intent'],
                'confidence': prediction['confidence']
            })
            print(f"  '{text}' -> {prediction['intent']} ({prediction['confidence']:.3f})")
        
        results['intent_classifier'] = {
            'status': 'success',
            'tests': test_results
        }
        print("✓ Intent Classifier tests passed")
    except Exception as e:
        print(f"✗ Intent Classifier tests failed: {str(e)}")
        results['intent_classifier'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    print()
    
    # Test Performance Predictor
    print("="*80)
    print("2. TESTING PERFORMANCE PREDICTOR")
    print("="*80)
    try:
        predictor = PerformancePredictor()
        predictor.load()
        
        test_student = {
            'attendance': 85,
            'cgpa': 7.5,
            'semester': 4,
            'backlogs': 0,
            'studyHours': 5,
            'theoryScore': 75,
            'practicalScore': 80,
            'assignmentScore': 78
        }
        
        prediction = predictor.predict(test_student)
        print(f"  Current CGPA: {prediction['current_cgpa']:.2f}")
        print(f"  Predicted CGPA: {prediction['predicted_cgpa']:.2f}")
        print(f"  Improvement: {prediction['improvement_potential']:.2f}")
        print(f"  Confidence: {prediction['confidence']:.2f}")
        
        results['performance_predictor'] = {
            'status': 'success',
            'test': prediction
        }
        print("✓ Performance Predictor tests passed")
    except Exception as e:
        print(f"✗ Performance Predictor tests failed: {str(e)}")
        results['performance_predictor'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    print()
    print("="*80)
    
    return results

if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'train':
            n_samples = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
            results = train_all_models(n_samples)
            print(json.dumps(results, indent=2))
            
        elif command == 'test':
            results = test_all_models()
            print(json.dumps(results, indent=2))
            
        else:
            print("Unknown command. Use 'train' or 'test'")
            sys.exit(1)
    else:
        print("Usage:")
        print("  python train.py train [n_samples]")
        print("  python train.py test")
        sys.exit(1)
