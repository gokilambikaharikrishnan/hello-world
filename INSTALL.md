# BMS DocGen — Installation Procedure

## Prerequisites Check

Open **Command Prompt** (search `cmd` in Start — NOT PowerShell) and run:

```cmd
node --version
npm --version
python --version
code --version
```

---

## If Node.js is NOT installed

Download and install from: **https://nodejs.org** → click "LTS" version → run the installer → keep all defaults → restart cmd after installing.

Verify:
```cmd
node --version
npm --version
```
Both should print version numbers.

---

## If Python is NOT installed

Download from: **https://python.org/downloads** → run installer → **tick "Add Python to PATH"** before clicking Install.

Verify:
```cmd
python --version
```

---

## If VS Code is NOT installed

Download from: **https://code.visualstudio.com** → run installer → tick **"Add to PATH"** option during install → restart cmd.

Verify:
```cmd
code --version
```

---

## Step 1 — Download the repo

Download the zip from GitHub → extract to a folder → note the path.

---

## Step 2 — Build the extension

Open cmd, navigate to the `extension` folder inside the repo:

```cmd
cd C:\path\to\hello-world-bms-doc-gen-v1\extension
```

> Use your actual path. If there are spaces in folder names, wrap path in quotes.

**Use hotspot or home wifi — NOT office wifi** (office network blocks npm):

```cmd
npm install
npm run build
npx @vscode/vsce package --no-dependencies
```

Type `y` and press Enter for any prompts that appear.

You should see at the end:
```
DONE  Packaged: ...bms-doc-gen-0.1.0.vsix
```

---

## Step 3 — Install the extension in VS Code

```cmd
code --install-extension "C:\path\to\extension\bms-doc-gen-0.1.0.vsix"
```

Use your actual path. Wrap in quotes if it contains spaces.

Expected output:
```
Extension 'bms-doc-gen-0.1.0.vsix' was successfully installed.
```

---

## Step 4 — Verify the extension works

1. Open VS Code
2. **File → Open Folder** → select the repo root folder
3. Open Output panel: **View → Output**
4. In the dropdown select **BMS DocGen**
5. You should see: `BMS DocGen activated`

---

## Step 5 — Test with a dummy module

In cmd, from the repo root:

```cmd
mkdir CAN_Driver

echo #ifndef CAN_DRIVER_H > CAN_Driver\can_driver.h
echo #define CAN_DRIVER_H >> CAN_Driver\can_driver.h
echo #define CAN_BAUD_RATE 500000 >> CAN_Driver\can_driver.h
echo void CAN_Init(void); >> CAN_Driver\can_driver.h
echo void CAN_Send(uint8_t* data, uint8_t len); >> CAN_Driver\can_driver.h
echo #endif >> CAN_Driver\can_driver.h

echo #include "can_driver.h" > CAN_Driver\can_driver.c
echo void CAN_Init(void) { } >> CAN_Driver\can_driver.c
echo void CAN_Send(uint8_t* data, uint8_t len) { } >> CAN_Driver\can_driver.c
```

---

## Step 6 — Generate documentation

1. In VS Code press `Ctrl+Shift+P`
2. Type **BMS DocGen**
3. Click **BMS DocGen: Open Documentation Generator**
4. You will see `CAN_Driver` with a **Driver** badge
5. Check the checkbox → click **Generate Documentation**
6. Watch the Output panel stream the Copilot response
7. When done, find the generated file at: `docs\CAN_Driver_design.html`

---

## For your real BMS codebase

Once the test works:

1. Open your actual firmware repo in VS Code (**File → Open Folder**)
2. Run **BMS DocGen: Open Documentation Generator**
3. All your module folders will appear automatically
4. Select whichever modules you want documented
5. Click Generate

---

> **GitHub Copilot must be installed and signed in** for generation to work.
> VS Code → Extensions → search `GitHub Copilot Chat` → Install → sign in with your GitHub account.
