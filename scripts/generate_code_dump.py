import os

# Configuration
OUTPUT_FILE = "FULL_PROJECT_CODE.txt"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Parent of scripts/
DIRS_TO_INCLUDE = ['core', 'backend', 'frontend', 'database', 'analysis', 'sensors']
EXTENSIONS = {'.py', '.ts', '.tsx', '.sql', '.md', '.json', '.css'}
IGNORE_DIRS = {'node_modules', '.next', '__pycache__', '.git', 'archive', 'test_results'}
IGNORE_FILES = {'package-lock.json', 'FULL_PROJECT_CODE.txt'}

def generate_dump():
    count = 0
    with open(os.path.join(ROOT_DIR, OUTPUT_FILE), 'w', encoding='utf-8') as outfile:
        outfile.write(f"PROJECT CODE DUMP\n")
        outfile.write(f"=================\n\n")
        
        for dir_name in DIRS_TO_INCLUDE:
            full_path = os.path.join(ROOT_DIR, dir_name)
            if not os.path.exists(full_path):
                continue
                
            for root, dirs, files in os.walk(full_path):
                # Filter dirs
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                
                for file in files:
                    if file in IGNORE_FILES:
                        continue
                        
                    ext = os.path.splitext(file)[1]
                    if ext not in EXTENSIONS:
                        continue
                        
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, ROOT_DIR)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                        outfile.write(f"\n\n{'='*50}\n")
                        outfile.write(f"FILE: {rel_path}\n")
                        outfile.write(f"{'='*50}\n\n")
                        outfile.write(content)
                        count += 1
                        print(f"Added: {rel_path}")
                    except Exception as e:
                        print(f"Skipping {rel_path}: {e}")

    print(f"\nDone! Added {count} files to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_dump()
