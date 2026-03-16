#!/usr/bin/env python3
"""
Setup script for Python ML environment
Automatically configures Python ML backend for ProGO chatbot
"""

import sys
import subprocess
import json
import os

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*80)
    print(text.center(80))
    print("="*80 + "\n")

def print_step(step_num, total, text):
    """Print step information"""
    print(f"\n[{step_num}/{total}] {text}")
    print("-" * 80)

def run_command(cmd, description):
    """Run a shell command and return success status"""
    print(f"\nExecuting: {description}")
    print(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        print("✓ Success")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"✗ Command not found: {cmd[0]}")
        return False

def check_python():
    """Check Python installation"""
    print_step(1, 6, "Checking Python Installation")
    
    for python_cmd in ['python', 'python3']:
        try:
            result = subprocess.run(
                [python_cmd, '--version'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            version = result.stdout or result.stderr
            print(f"✓ Found: {version.strip()}")
            
            # Check version
            version_num = version.split()[1]
            major, minor = map(int, version_num.split('.')[:2])
            
            if major >= 3 and minor >= 8:
                print(f"✓ Python version {version_num} is compatible (≥3.8 required)")
                return python_cmd
            else:
                print(f"✗ Python {version_num} is too old (≥3.8 required)")
        except (subprocess.SubprocessError, FileNotFoundError):
            continue
    
    print("\n✗ Python 3.8+ not found!")
    print("Please install Python from: https://www.python.org/downloads/")
    return None

def check_pip(python_cmd):
    """Check pip installation"""
    print_step(2, 6, "Checking pip Installation")
    
    try:
        result = subprocess.run(
            [python_cmd, '-m', 'pip', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        print(f"✓ pip found: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError:
        print("✗ pip not found!")
        print(f"Install with: {python_cmd} -m ensurepip --upgrade")
        return False

def install_packages(python_cmd):
    """Install Python packages"""
    print_step(3, 6, "Installing Python Packages")
    
    requirements_file = os.path.join('backend', 'ml', 'python', 'requirements.txt')
    
    if not os.path.exists(requirements_file):
        print(f"✗ Requirements file not found: {requirements_file}")
        return False
    
    print(f"Installing packages from: {requirements_file}")
    print("This may take several minutes...")
    
    return run_command(
        [python_cmd, '-m', 'pip', 'install', '-r', requirements_file, '--upgrade'],
        "Installing Python ML packages"
    )

def verify_packages(python_cmd):
    """Verify package installation"""
    print_step(4, 6, "Verifying Package Installation")
    
    check_script = os.path.join('backend', 'ml', 'python', 'check_dependencies.py')
    
    if not os.path.exists(check_script):
        print(f"✗ Check script not found: {check_script}")
        return False
    
    try:
        result = subprocess.run(
            [python_cmd, check_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        
        data = json.loads(result.stdout)
        
        if data.get('available'):
            print("✓ All required packages are installed!")
            print(f"  Python version: {data.get('python_version')}")
            return True
        else:
            print("✗ Some packages are missing:")
            for pkg in data.get('missing_packages', []):
                print(f"  - {pkg}")
            return False
            
    except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
        print(f"✗ Verification failed: {e}")
        return False

def train_models(python_cmd):
    """Train ML models"""
    print_step(5, 6, "Training ML Models")
    
    train_script = os.path.join('backend', 'ml', 'python', 'train.py')
    
    if not os.path.exists(train_script):
        print(f"✗ Training script not found: {train_script}")
        return False
    
    print("Training Intent Classifier and Performance Predictor...")
    print("This will take 2-5 minutes...")
    
    return run_command(
        [python_cmd, train_script, 'train', '2000'],
        "Training ML models"
    )

def test_models(python_cmd):
    """Test trained models"""
    print_step(6, 6, "Testing ML Models")
    
    train_script = os.path.join('backend', 'ml', 'python', 'train.py')
    
    return run_command(
        [python_cmd, train_script, 'test'],
        "Testing ML models"
    )

def main():
    """Main setup function"""
    print_header("ProGO Python ML Setup")
    
    print("This script will:")
    print("  1. Check Python installation")
    print("  2. Check pip installation")
    print("  3. Install required Python packages")
    print("  4. Verify package installation")
    print("  5. Train ML models")
    print("  6. Test ML models")
    
    input("\nPress Enter to continue or Ctrl+C to cancel...")
    
    # Step 1: Check Python
    python_cmd = check_python()
    if not python_cmd:
        sys.exit(1)
    
    # Step 2: Check pip
    if not check_pip(python_cmd):
        sys.exit(1)
    
    # Step 3: Install packages
    if not install_packages(python_cmd):
        print("\n✗ Package installation failed!")
        print("You may need to:")
        print("  1. Update pip: python -m pip install --upgrade pip")
        print("  2. Install Visual C++ Build Tools (Windows)")
        print("  3. Use tensorflow-cpu instead of tensorflow")
        sys.exit(1)
    
    # Step 4: Verify packages
    if not verify_packages(python_cmd):
        print("\n✗ Package verification failed!")
        sys.exit(1)
    
    # Step 5: Train models
    if not train_models(python_cmd):
        print("\n⚠ Model training failed, but you can try again later")
        print("Run: npm run ml:python:train")
    
    # Step 6: Test models
    if not test_models(python_cmd):
        print("\n⚠ Model testing failed, but you can try again later")
        print("Run: npm run ml:python:test")
    
    # Success
    print_header("Setup Complete!")
    
    print("✓ Python ML backend is ready to use!")
    print("\nNext steps:")
    print("  1. Start the server: npm run dev")
    print("  2. The system will automatically use Python ML backend")
    print("  3. Check backend status in server logs")
    print("\nUseful commands:")
    print("  npm run ml:python:train      - Retrain models")
    print("  npm run ml:python:test       - Test models")
    print("  npm run ml:python:check      - Check dependencies")
    print("\nFor more information, see: PYTHON_ML_README.md")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Unexpected error: {e}")
        sys.exit(1)
