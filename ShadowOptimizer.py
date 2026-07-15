#!/usr/bin/env python3
"""
ShadowOptimizer License Validator and Executor
Validates license keys against the ShadowOptimizer API and executes the optimization script.

Usage:
    python ShadowOptimizer.py --key YOUR-LICENSE-KEY [--api-url https://your-api.com] [--script-path path/to/script.bat]
"""

import os
import sys
import json
import hashlib
import subprocess
import argparse
import requests
from pathlib import Path
from typing import Dict, Optional, Tuple
from datetime import datetime

# Configuration
DEFAULT_API_URL = "https://shadow-boost-licensing.manus.space/api"
DEFAULT_SCRIPT_NAME = "shadowWindowsBoost.bat"
CONFIG_DIR = Path.home() / ".shadowoptimizer"
CONFIG_FILE = CONFIG_DIR / "config.json"
LOG_FILE = CONFIG_DIR / "executor.log"


class HWIDCollector:
    """Collects hardware information to generate a unique HWID."""

    @staticmethod
    def get_windows_hwid() -> str:
        """Get Windows hardware ID using WMI."""
        try:
            import wmi

            c = wmi.WMI()
            # Get CPU serial number
            cpu_info = c.Win32_Processor()[0]
            cpu_serial = cpu_info.ProcessorId.strip()

            # Get motherboard serial
            board_info = c.Win32_BaseBoard()[0]
            board_serial = board_info.SerialNumber.strip()

            # Get disk serial
            disk_info = c.Win32_LogicalDisk("name='C:'")[0]
            disk_serial = disk_info.VolumeSerialNumber.strip()

            # Combine and hash
            combined = f"{cpu_serial}|{board_serial}|{disk_serial}"
            hwid = hashlib.sha256(combined.encode()).hexdigest()[:32].upper()
            return hwid
        except Exception as e:
            print(f"[ERROR] Failed to collect Windows HWID: {e}")
            return ""

    @staticmethod
    def get_linux_hwid() -> str:
        """Get Linux hardware ID."""
        try:
            import uuid

            hwid = str(uuid.getnode())[:32].upper()
            return hwid
        except Exception as e:
            print(f"[ERROR] Failed to collect Linux HWID: {e}")
            return ""

    @staticmethod
    def get_hwid() -> str:
        """Get hardware ID based on OS."""
        if sys.platform == "win32":
            return HWIDCollector.get_windows_hwid()
        else:
            return HWIDCollector.get_linux_hwid()


class LicenseValidator:
    """Validates license keys against the API."""

    def __init__(self, api_url: str):
        self.api_url = api_url
        self.session = requests.Session()
        self.session.timeout = 10

    def validate(self, license_key: str, hwid: str) -> Tuple[bool, Dict]:
        """Validate license key against REST API."""
        try:
            # Prepare REST request
            payload = {
                "key": license_key,
                "hwid": hwid
            }

            response = self.session.post(
                f"{self.api_url}/validate-license",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code != 200:
                return False, {
                    "authorized": False,
                    "message": f"API error: {response.status_code}",
                }

            data = response.json()
            return data.get("authorized", False), data

        except requests.exceptions.Timeout:
            return False, {
                "authorized": False,
                "message": "API request timeout",
            }
        except requests.exceptions.ConnectionError:
            return False, {
                "authorized": False,
                "message": "Cannot connect to API server",
            }
        except Exception as e:
            return False, {
                "authorized": False,
                "message": f"Validation error: {str(e)}",
            }


class ScriptExecutor:
    """Executes the optimization script."""

    @staticmethod
    def execute(script_path: str) -> Tuple[bool, str]:
        """Execute the .bat script."""
        try:
            if not os.path.exists(script_path):
                return False, f"Script not found: {script_path}"

            if sys.platform != "win32":
                return False, "Script execution only supported on Windows"

            # Execute the .bat file
            result = subprocess.run(
                [script_path],
                shell=True,
                capture_output=True,
                text=True,
                timeout=3600,  # 1 hour timeout
            )

            if result.returncode == 0:
                return True, "Script executed successfully"
            else:
                return False, f"Script failed with code {result.returncode}"

        except subprocess.TimeoutExpired:
            return False, "Script execution timeout"
        except Exception as e:
            return False, f"Execution error: {str(e)}"


class Logger:
    """Logs events to file."""

    @staticmethod
    def log(message: str, level: str = "INFO"):
        """Log a message."""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().isoformat()
        log_message = f"[{timestamp}] [{level}] {message}"

        # Print to console
        print(log_message)

        # Write to file
        try:
            with open(LOG_FILE, "a") as f:
                f.write(log_message + "\n")
        except Exception:
            pass


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="ShadowOptimizer License Validator and Executor"
    )
    parser.add_argument(
        "--key",
        required=True,
        help="License key (e.g., SHADOW-XXXX-XXXX)",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"API URL (default: {DEFAULT_API_URL})",
    )
    parser.add_argument(
        "--script-path",
        help="Path to the .bat script to execute",
    )
    parser.add_argument(
        "--no-execute",
        action="store_true",
        help="Validate license without executing script",
    )

    args = parser.parse_args()

    Logger.log("=" * 60)
    Logger.log("ShadowOptimizer License Validator Started")
    Logger.log(f"License Key: {args.key[:8]}...{args.key[-4:]}")

    # Step 1: Collect HWID
    Logger.log("Collecting hardware information...")
    hwid = HWIDCollector.get_hwid()

    if not hwid:
        Logger.log("Failed to collect HWID", "ERROR")
        sys.exit(1)

    Logger.log(f"HWID: {hwid[:16]}...")

    # Step 2: Validate license
    Logger.log("Validating license against API...")
    validator = LicenseValidator(args.api_url)
    authorized, response = validator.validate(args.key, hwid)

    Logger.log(f"Validation Result: {response.get('message', 'Unknown')}")

    if not authorized:
        Logger.log("License validation FAILED", "ERROR")
        print("\n" + "=" * 60)
        print("❌ License Validation Failed")
        print(f"Reason: {response.get('message', 'Unknown error')}")
        print("=" * 60)
        sys.exit(1)

    Logger.log("License validation PASSED")

    # Step 3: Execute script (if not disabled)
    if args.no_execute:
        Logger.log("Script execution skipped (--no-execute flag)")
        print("\n" + "=" * 60)
        print("✅ License is Valid")
        print("Script execution skipped")
        print("=" * 60)
        sys.exit(0)

    # Determine script path
    if args.script_path:
        script_path = args.script_path
    else:
        # Look for script in same directory as executor
        script_path = os.path.join(os.path.dirname(__file__), DEFAULT_SCRIPT_NAME)

    Logger.log(f"Executing script: {script_path}")

    success, message = ScriptExecutor.execute(script_path)

    if success:
        Logger.log(message)
        print("\n" + "=" * 60)
        print("✅ License Valid - Script Executed Successfully")
        print("=" * 60)
        sys.exit(0)
    else:
        Logger.log(f"Script execution failed: {message}", "ERROR")
        print("\n" + "=" * 60)
        print("❌ Script Execution Failed")
        print(f"Error: {message}")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        Logger.log("Execution interrupted by user", "WARNING")
        sys.exit(130)
    except Exception as e:
        Logger.log(f"Unexpected error: {str(e)}", "ERROR")
        sys.exit(1)
