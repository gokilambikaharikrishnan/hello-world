# SESSION 5 PLAN — BMS DocGen: Full Prompt System

## WHAT CURRENTLY EXISTS

### promptBuilder.ts
- 4 string constants: PART_A (format rules), PART_B (identity/audience), PART_D (10 sections)
- 1 helper: getLayerFocus(layerName) — 5 layer-specific paragraphs
- 1 helper: buildPartC() — assembles BMS context + module id + source files
- buildPrompt(ModuleFolder, SourceFile[], SourceFile[], OutputChannel) → PromptPayload
- PromptPayload = { systemPrompt: string, userPrompt: string, totalChars: number }
- All 4 parts are in one file — no separation of concerns

### layerMap.ts (current: 36 modules)
- MCAL: ADC, CAN, GPIO, SPI, PWM, TIMER, UART (7 — missing 10)
- CDD: AFE, EWDG, RelayDriver, SerialFlash (4 — check Serial_Flash vs SerialFlash)
- ESAL: BATT_IF, CONTACTOR_IF, HEATER_IF, RTC_IF, SAFETY_IF, UART_IF,
        HEARTBEAT_IF, DCDCHWSIGNAL_IF (8 — missing 4)
- SRVLayer: Battery_Diagnostics, BMS_PWR_MNGT_SRVC, BootManagerSw, CAN_NM,
            Event_Manager, NVM, RTCAppl, Scheduler, SWTimer (9 — complete)
- ASW: CodeExecution, ContactorControl, CriticalFaultControl, DcDcHwSignal,
       DynamicPwrLimitsComp, Heartbeat, HeaterControl, PowerComputation,
       PyroControl, Safety_Appl, Segger, StackMon, Tester (13 — missing 6)

### extension.ts
- Imports buildPrompt from ./promptBuilder
- Calls: buildPrompt(moduleFolder, moduleFiles, resolvedIncludes, output)
- Uses: payload.totalChars (for logging), payload.systemPrompt + payload.userPrompt (sent to LLM)

### scanFolders.ts
- No hardcoded ignore list — reads actual filesystem directories
- No changes needed

## WHAT NEEDS TO CHANGE

### layerMap.ts — additions only (no removals, no edits)
MCAL add: CLOCK, DMA, FLASH, I2C, IRQM, IWDG, MCU, RTC, Safety, STM32H743ZI, Timer
CDD add:  Serial_Flash (keep SerialFlash too — unsure of folder name)
ESAL add: BKPSR_IF, CANIF, ECU_IF, MEM_IF
ASW add:  App_Stubs, BatProtection, BatteryEstimation, BattFaultModule,
          BattStateMachine, CANAppl, DynamicPwrlLimitsComp

### New file structure
extension/src/prompts/
  index.ts          — orchestrator, new buildPrompt()
  constants.ts      — FORMAT_RULES, IDENTITY, BMS_CONTEXT, SECTION_INSTRUCTIONS
  moduleHints.ts    — 58 module placeholders
  layers/
    mcal.ts         — MCAL_FOCUS
    cdd.ts          — CDD_FOCUS
    esal.ts         — ESAL_FOCUS
    srvlayer.ts     — SRVLAYER_FOCUS
    asw.ts          — ASW_FOCUS
  specs/            — AMENDMENT 1: spec content files (empty for now)
    bmsSpecs.ts     — BMS_HARDWARE_SPECS = ''
    canSpecs.ts     — CAN_SPECS = ''
    protectionSpecs.ts — PROTECTION_SPECS = ''
    nvmSpecs.ts     — NVM_SPECS = ''

### promptBuilder.ts — compatibility shim (OPTION A)
Keep existing file. Replace contents with re-export from new system.
Adapts old signature (ModuleFolder, SourceFile[], SourceFile[], OutputChannel)
to new PromptInput, returns PromptPayload (first chunk only).
Zero changes needed in extension.ts.

### BundledContext type
Defined in prompts/index.ts:
  { primaryFiles: {name,content}[], resolvedIncludes: {name,fromFolder,content}[], truncated: boolean }
Shim in promptBuilder.ts constructs it from SourceFile[] (relativePath → name).

## ORDER OF WORK

Step 1: Update layerMap.ts — add all missing modules
Step 2: Create prompts/ folder structure (all empty files)
Step 2b: Create specs/ files (Amendment 1)
Step 3: Fill constants.ts (4 exports)
Step 4a: Fill layers/mcal.ts
Step 4b: Fill layers/cdd.ts
Step 4c: Fill layers/esal.ts
Step 4d: Fill layers/srvlayer.ts
Step 4e: Fill layers/asw.ts
Step 5: Fill moduleHints.ts (58 placeholders)
Step 6: Fill prompts/index.ts (orchestrator)
Step 7: Rewrite promptBuilder.ts as compatibility shim
Step 8: Build + test
Step 9: Add hint validation
