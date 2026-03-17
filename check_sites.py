import subprocess
import json
import sys

def get_sites():
    try:
        result = subprocess.run(['firebase', 'hosting:sites:list', '--json', '--project', 'finance-book-pro-777888'], 
                              capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        if 'result' in locals():
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")

if __name__ == "__main__":
    get_sites()
