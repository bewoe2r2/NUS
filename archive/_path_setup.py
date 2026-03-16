"""Path setup for archive scripts. Import this before any project imports."""
import sys
import os

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _subdir in ['core', 'scripts', 'sensors', 'tools', '']:
    _path = os.path.join(_root, _subdir) if _subdir else _root
    if _path not in sys.path:
        sys.path.insert(0, _path)
