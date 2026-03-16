#!/usr/bin/env python3
"""
HMM Engine Exhaustive Test Runner
Runs all test suites in parallel and generates a comprehensive report.
"""
import subprocess
import sys
import os
import json
from datetime import datetime

def main():
    test_dir = os.path.dirname(os.path.abspath(__file__))
    report_dir = os.path.join(test_dir, "reports")
    os.makedirs(report_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print("=" * 70)
    print("  NEXUS 2026 - HMM ENGINE EXHAUSTIVE TEST SUITE")
    print(f"  Timestamp: {datetime.now().isoformat()}")
    print("=" * 70)

    # Run pytest with parallel execution, JUnit XML, and terminal output
    result = subprocess.run(
        [
            sys.executable, "-m", "pytest",
            test_dir,
            "-v",
            "--tb=short",
            f"--junitxml={os.path.join(report_dir, f'results_{timestamp}.xml')}",
            "-x" if "--failfast" in sys.argv else "--no-header",
            "--co" if "--count-only" in sys.argv else "--no-header",
        ],
        capture_output=False,
        cwd=test_dir
    )

    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
