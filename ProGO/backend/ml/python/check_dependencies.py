"""
Check Python dependencies for ML system
"""

import sys
import json

def check_dependencies():
    """Check if all required packages are installed"""
    required_packages = {
        'numpy': 'numpy',
        'pandas': 'pandas',
        'sklearn': 'scikit-learn',
        'tensorflow': 'tensorflow',
        'keras': 'keras',
        'nltk': 'nltk',
        'joblib': 'joblib'
    }
    
    installed = {}
    missing = []
    
    for import_name, package_name in required_packages.items():
        try:
            __import__(import_name)
            installed[package_name] = True
        except ImportError:
            installed[package_name] = False
            missing.append(package_name)
    
    result = {
        'available': len(missing) == 0,
        'installed_packages': installed,
        'missing_packages': missing,
        'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    }
    
    return result

if __name__ == '__main__':
    result = check_dependencies()
    print(json.dumps(result, indent=2))
