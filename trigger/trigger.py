#!/usr/bin/env python3
"""
BMS DocGen - IAR Post-Build Trigger Script
==========================================
Signals VS Code to open the BMS DocGen panel after each IAR build.

Usage (from IAR post-build command):
    python "%PROJ_DIR%\..\..\trigger\trigger.py" "$PROJ_DIR$"

Or with an explicit absolute path to the repo root:
    python "C:\Projects\bms-firmware\trigger\trigger.py" "C:\Projects\bms-firmware"

Arguments:
    <repo_root>  Absolute path to the repository root directory.
                 IAR provides this as $PROJ_DIR$ (project directory) or a
                 path you derive from it. Spaces in the path are handled correctly.
"""

import sys
import subprocess
import urllib.parse
import os
import time


def main() -> int:
    if len(sys.argv) < 2:
        print("ERROR: No repo root path provided.", file=sys.stderr)
        print("Usage: python trigger.py <repo_root>", file=sys.stderr)
        return 1

    repo_root = sys.argv[1].strip()

    # Normalise path separators and resolve to absolute
    repo_root = os.path.normpath(os.path.abspath(repo_root))

    if not os.path.isdir(repo_root):
        print(f"ERROR: Repo root does not exist or is not a directory: {repo_root}", file=sys.stderr)
        return 1

    # URL-encode the path so it is safe inside the VS Code URI
    # Windows paths like C:\Projects\foo become C%3A%5CProjects%5Cfoo
    encoded_path = urllib.parse.quote(repo_root, safe='')

    uri = f"vscode://bms-doc-gen/trigger?repoPath={encoded_path}"

    print(f"[BMS DocGen] Triggering VS Code with URI: {uri}")
    print(f"[BMS DocGen] Repo root: {repo_root}")

    # Launch VS Code with the custom URI.
    # --open-url is the documented way to open a URI handler from the CLI.
    # We pass shell=False to avoid injection via the path.
    cmd = ["code", "--open-url", uri]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
            # On Windows, avoid showing a console window for this child process
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
    except FileNotFoundError:
        print(
            "ERROR: 'code' command not found. "
            "Make sure VS Code is installed and 'code' is in your PATH.\n"
            "In VS Code: open the Command Palette → 'Shell Command: Install code command in PATH'",
            file=sys.stderr
        )
        return 1
    except subprocess.TimeoutExpired:
        print("ERROR: VS Code did not respond within 30 seconds.", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"ERROR: Failed to launch VS Code: {exc}", file=sys.stderr)
        return 1

    if result.returncode != 0:
        print(f"WARNING: 'code --open-url' exited with code {result.returncode}", file=sys.stderr)
        if result.stderr:
            print(f"stderr: {result.stderr.strip()}", file=sys.stderr)
        # Non-fatal — VS Code sometimes returns non-zero even on success
    else:
        print("[BMS DocGen] VS Code triggered successfully.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
