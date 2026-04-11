# BMS DocGen — IAR Post-Build Setup

This folder contains the Python trigger script that connects IAR Embedded Workbench
to the BMS DocGen VS Code extension.

---

## How It Works

1. IAR finishes a build and executes the post-build command.
2. `trigger.py` is called with the repo root path as an argument.
3. The script calls:
   ```
   code --open-url "vscode://bms-doc-gen/trigger?repoPath=<encoded_path>"
   ```
4. VS Code receives the URI and activates the BMS DocGen extension.
5. The extension opens a panel where you can select modules and generate docs.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.7+ | Must be available in IAR's build environment PATH |
| VS Code | Installed on the developer's machine |
| `code` in PATH | Run **Shell Command: Install 'code' command in PATH** from VS Code command palette |
| GitHub Copilot Chat | Extension installed in VS Code, user signed in |

---

## IAR Post-Build Command

In IAR Embedded Workbench, open your project's **Options → Build Actions**.

### Post-build command line:

```
python "$PROJ_DIR$\..\..\trigger\trigger.py" "$PROJ_DIR$\.."
```

**Important:** Adjust the relative path (`..\..\`) to reach the repo root from your
IAR project directory. For example:

| IAR project location | Repo root | Command |
|---|---|---|
| `repo\firmware\BMS.ewp` | `repo\` | `python "$PROJ_DIR$\..\..\trigger\trigger.py" "$PROJ_DIR$\.."` |
| `repo\iar\project\BMS.ewp` | `repo\` | `python "$PROJ_DIR$\..\..\..\trigger\trigger.py" "$PROJ_DIR$\..\.."` |

### Alternative — absolute path (most reliable):

```
python "C:\Projects\bms-firmware\trigger\trigger.py" "C:\Projects\bms-firmware"
```

Using an absolute path avoids any confusion about relative paths in the IAR build system.

---

## Verifying the Setup

1. Open VS Code and ensure the BMS DocGen extension is installed (see root README).
2. Do a full build in IAR.
3. Watch the IAR build log — you should see:
   ```
   [BMS DocGen] Triggering VS Code with URI: vscode://bms-doc-gen/trigger?repoPath=...
   [BMS DocGen] VS Code triggered successfully.
   ```
4. VS Code should come to the foreground with the DocGen panel open.

---

## Troubleshooting

**"code command not found"**
- Open VS Code → Command Palette → `Shell Command: Install 'code' command in PATH`
- Restart your PC or at least the IAR process after adding it to PATH

**Panel does not open**
- Make sure the BMS DocGen extension is installed and enabled
- Check VS Code's Output panel → select "BMS DocGen" from the dropdown
- Look for any activation errors

**Python not found**
- Ensure Python 3 is installed and on the system PATH
- Test in a command prompt: `python --version`
- If you use `python3` on your system, update the post-build command accordingly

**Build log shows non-zero exit code from `code`**
- This is usually harmless. VS Code sometimes exits with non-zero when opening URIs.
- Check if the panel opened in VS Code — if yes, the trigger worked.

---

## Running Manually (for testing)

```cmd
python trigger\trigger.py "C:\path\to\your\bms-repo"
```

Or from the repo root:

```cmd
python trigger/trigger.py .
```
