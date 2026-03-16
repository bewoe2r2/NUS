import sys
import os

# Add project root and core directory to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'core'))
sys.path.insert(0, os.path.join(project_root, 'scripts'))
sys.path.insert(0, os.path.join(project_root, 'sensors'))
sys.path.insert(0, os.path.join(project_root, 'tools'))
