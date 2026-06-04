import os
import sys
import subprocess
import threading
import time
import signal

# Change working directory to the script's directory so it works from anywhere
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir:
    os.chdir(script_dir)


# ANSI Color Codes for terminal beauty
BLUE = "\033[94m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Print banner
banner = f"""
{BLUE}{BOLD}======================================================================{RESET}
{CYAN}{BOLD}🩺  Diabetes Prediction Platform - Dual Server Launcher{RESET}
{BLUE}{BOLD}======================================================================{RESET}
{GREEN}✔ Streamlit Dashboard URL: {BOLD}http://localhost:8501{RESET}
{BLUE}✔ FastAPI REST API URL:   {BOLD}http://localhost:8000{RESET}
{BLUE}✔ FastAPI Interactive Docs: {BOLD}http://localhost:8000/docs{RESET}
{YELLOW}• Press Ctrl+C to stop both applications gracefully.{RESET}
{BLUE}{BOLD}======================================================================{RESET}
"""

def check_requirements():
    """Verify that all required files and libraries are available."""
    print(f"{CYAN}[System]{RESET} Checking files and packages...")
    
    # Check for files
    required_files = ["app_api.py", "app_dashboard.py", "diabetes_model.keras", "scaler.joblib", "metadata.json"]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"{RED}[Error]{RESET} Missing files required for execution: {', '.join(missing_files)}")
        if "diabetes_model.keras" in missing_files:
            print(f"{YELLOW}[Warning]{RESET} It seems you haven't trained/exported the model yet. Make sure to run 'main.py' or 'predict_diabetes.ipynb' first.")
        sys.exit(1)
        
    # Check for imports
    required_libs = {
        "fastapi": "fastapi",
        "uvicorn": "uvicorn",
        "streamlit": "streamlit",
        "tensorflow": "tensorflow",
        "joblib": "joblib",
        "sklearn": "scikit-learn",
        "pandas": "pandas",
        "numpy": "numpy"
    }
    
    missing_libs = []
    for lib, pkg in required_libs.items():
        try:
            __import__(lib)
        except ImportError:
            missing_libs.append(pkg)
            
    if missing_libs:
        print(f"{YELLOW}[System]{RESET} Missing python packages: {', '.join(missing_libs)}")
        print(f"{CYAN}[System]{RESET} Installing missing dependencies from requirements.txt...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print(f"{GREEN}[System] All dependencies successfully installed!{RESET}")
        except Exception as e:
            print(f"{RED}[Error]{RESET} Failed to install packages automatically: {e}")
            print(f"{YELLOW}[System]{RESET} Please run: pip install -r requirements.txt")
            sys.exit(1)
    else:
        print(f"{GREEN}[System]{RESET} All files and dependencies verified successfully!")

def log_reader(pipe, prefix, color):
    """Read logs from a process pipe and display them with a colored prefix."""
    try:
        for line in iter(pipe.readline, b''):
            decoded = line.decode('utf-8', errors='replace').strip()
            if decoded:
                print(f"{color}{prefix}{RESET} | {decoded}")
    except Exception:
        pass

def main():
    check_requirements()
    print(banner)

    # Set up environment variables to avoid buffering output
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    # Define commands using the current python executable (extremely robust on Windows)
    api_cmd = [sys.executable, "-m", "uvicorn", "app_api:app", "--host", "127.0.0.1", "--port", "8000"]
    dashboard_cmd = [sys.executable, "-m", "streamlit", "run", "app_dashboard.py", "--server.port", "8501", "--server.headless", "true"]

    api_process = None
    dashboard_process = None

    try:
        print(f"{BLUE}[System] Starting FastAPI REST API on port 8000...{RESET}")
        api_process = subprocess.Popen(
            api_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            bufsize=1
        )

        print(f"{GREEN}[System] Starting Streamlit Dashboard on port 8501...{RESET}")
        dashboard_process = subprocess.Popen(
            dashboard_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            bufsize=1
        )

        # Create background threads for log reading
        threads = [
            threading.Thread(target=log_reader, args=(api_process.stdout, "FastAPI", BLUE), daemon=True),
            threading.Thread(target=log_reader, args=(api_process.stderr, "FastAPI [Err]", RED), daemon=True),
            threading.Thread(target=log_reader, args=(dashboard_process.stdout, "Streamlit", GREEN), daemon=True),
            threading.Thread(target=log_reader, args=(dashboard_process.stderr, "Streamlit [Err]", RED), daemon=True),
        ]

        # Start log reader threads
        for t in threads:
            t.start()

        print(f"{CYAN}[System] Both applications are running! Use Ctrl+C to terminate both servers.{RESET}\n")

        # Keep the main thread alive and monitor processes
        while True:
            # Check if any process terminated unexpectedly
            api_status = api_process.poll()
            dash_status = dashboard_process.poll()

            if api_status is not None:
                print(f"\n{RED}[System] FastAPI process stopped unexpectedly with exit code {api_status}.{RESET}")
                break
            if dash_status is not None:
                print(f"\n{RED}[System] Streamlit process stopped unexpectedly with exit code {dash_status}.{RESET}")
                break

            time.sleep(1)

    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}[System] Shutdown signal received. Terminating applications...{RESET}")
    finally:
        # Graceful shutdown of both processes
        for name, proc in [("FastAPI", api_process), ("Streamlit", dashboard_process)]:
            if proc and proc.poll() is None:
                print(f"{CYAN}[System] Stopping {name} (PID: {proc.pid})...{RESET}")
                try:
                    # On Windows, taskkill or standard terminate works well
                    proc.terminate()
                except Exception:
                    pass

        # Wait a moment for processes to stop, or kill them if they persist
        time.sleep(2)
        for name, proc in [("FastAPI", api_process), ("Streamlit", dashboard_process)]:
            if proc and proc.poll() is None:
                print(f"{RED}[Warning] {name} did not stop gracefully. Force killing...{RESET}")
                try:
                    proc.kill()
                except Exception:
                    pass

        print(f"{GREEN}[System] Both servers stopped. Thank you for using the platform!{RESET}")

if __name__ == "__main__":
    # Handle console closing or SIGTERM elegantly
    def sig_handler(sig, frame):
        raise KeyboardInterrupt
    
    signal.signal(signal.SIGTERM, sig_handler)
    
    # Try calling color support on Windows
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
        except Exception:
            pass

    main()
