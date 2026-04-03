# BMS Knowledge Base — Session State

## Project
LFP BMS Knowledge Base — 7-chapter technical reference
Target: UPS and home energy storage systems engineers

## Current Branch
BRANCH: claude/bms-knowledge-base-v2-1FA9t

## Chapter 1 Status
FILE: docs/chapter1.html
LAST_SECTION: All sections complete
LAST_LINE: 3084
STATUS: complete
LINES: 3084
SIZE: ~165KB

## Sections Written
- Hero + TOC
- 1.1 Battery Technology Evolution
  - Voltaic Pile (1800)
  - Lead-Acid (1859) — full analysis, why it still exists in UPS
  - NiCd (1899) — toxicity, memory effect
  - NiMH (1989) — bridge chemistry, self-discharge
  - Li-ion (1991) — intercalation revolution
  - LFP (1997) — Goodenough, olivine structure
- 1.2 Why LFP for UPS & Home ESS
  - Olivine crystal structure with SVG diagram
  - Thermal runaway physics — P-O bond argument (544 kJ/mol)
  - Cycle life mechanism (3000-5000 cycles, 6.8% volume change)
  - Calendar life (Arrhenius aging, SEI growth, cobalt-free)
  - Cost stability — cobalt-free advantage
  - Full chemistry comparison table (Lead, NiCd, NiMH, NMC, NCA, LFP)
  - UPS application fit: switchover, float charge, deep discharge
  - OCV curve teaser
- 1.3 Li-ion Weaknesses → BMS Requirements
  - Weakness 1: Narrow voltage window → Cell voltage monitoring + OVP/UVP
  - Weakness 2: Thermal sensitivity → Temperature monitoring + thermal management
  - Weakness 3: Cell variation → Cell balancing (passive/active)
  - Weakness 4: No visual state indicator → SoC/SoH estimation engine
  - Weakness 5: Short circuit energy dump → OCP/SCP hardware protection
  - Weakness 6: No self-regulating chemistry → Redundant protection layers
  - Full traceability diagram
- Deep Dive: OCV curve SVG visualization (LFP vs NMC comparison)
- Standards reference table (IEC 62619, IEC 62040, UL 9540A, etc.)
- Key equations reference
- Interactive bar chart (energy density, cycles, cost, self-discharge)
- Chapter summary + navigation

## Design Features
- Dark theme with CSS variables
- Sidebar navigation with scroll-active highlighting
- Animated SVG diagrams (olivine structure, OCV curve)
- Interactive JavaScript bar chart with tabs
- Timeline components
- Traceability diagram (weakness → BMS feature)
- Full comparison table with badges
- Callout boxes (info, warning, danger, success, physics)
- Stat grid cards
- Formula display blocks
- IntersectionObserver for sidebar

## Chapter 2 Status
FILE: docs/chapter2.html
LAST_SECTION: All sections complete (2.1 through 2.14 + Summary + Reference)
LAST_LINE: 4004
STATUS: complete
LINES: 4004
SIZE: ~210KB

## Chapter 2 Sections Written
- 2.1 First Principles — Li-ion intercalation, half-reactions, Nernst equation
- 2.2 LFP Cell Specifically — olivine, two-phase mechanism, flat OCV explanation
- 2.3 Cell Formats — cylindrical, prismatic, pouch; 280Ah standard
- 2.4 Vcell Behaviour — flat OCV curve deep dive, IR drop, Thevenin ECM
- 2.5 Capacity and Coulombs — Peukert, temperature correction, runtime prediction
- 2.6 SoC Estimation — 5 techniques: OCV lookup, coulomb counting, ECM, EKF, T5 hybrid
- 2.7 SOH and Aging — SEI growth, calendar aging, lithium plating, capacity fade SVG
- ECM Parameter Identification — HPPC test, R₀/R₁/C₁ extraction
- Interactive SOC bar chart (accuracy, complexity, drift, RAM metrics)
- LFP/NMC/NCA deep comparison table
- Peukert deep dive with temperature-corrected formula
- OCV-SoC reference table (15 points)
- Key equations reference grid (10 formulas)
- Capacity fade SVG (LFP vs NMC vs NCA)
- Multi-cell pack topology (series/parallel, weakest cell)
- Cell balancing algorithms (passive timing, energy analysis)
- Standards reference table (IEC 62619, 62620, 62933, IEEE 1725, SAE J1772)
- 2.8 Temperature Effects — Arrhenius, lithium plating, derating table
- 2.9 Worked Numerical Examples — runtime, drift budget, balancing energy
- 2.10 BMS Commissioning — pre-power checklist, protection verification, RPT
- 2.11 SOH Trending and SoP — fade model, remaining life, resistance growth
- 2.12 Second-Life Batteries — parameter updates, cell sorting, EIS screening
- 2.13 Chapter Summary — 10 principles traceability, ch3 preview
- 2.14 Quick Reference — full formula index, LFP parameters table, OCV table

## Chapter 3 Status
FILE: docs/chapter3.html
LAST_SECTION: All sections complete (3.1 through 3.5 + Summary + Reference)
LAST_LINE: 2575
STATUS: complete
LINES: 2575
SIZE: ~145KB

## Chapter 3 Sections Written
- Hero + Sidebar + CSS design system (orange thermal theme)
- 3.1 Heat Generation — Joule (I²R), reaction, entropic heat; animated 3-source SVG; real wattage table; cell core vs surface gradient SVG
- 3.2 Thermal Runaway — animated cascade timeline SVG; 5-stage cascade cards (Stages 0–3B); LFP vs NMC comparison; cell-to-cell propagation animated pack SVG; mitigation strategies
- 3.3 Thermal Management — Arrhenius aging calc; passive/active cooling comparison; temperature gradient pack SVG (good vs bad); NTC placement grid (6 positions); BMS control integration
- 3.4 Mechanical — LFP swelling physics (2% vs NMC 5%); animated swell bars; compression fixture animated SVG; vibration/shock standards table
- 3.5 BMS Thermal Features — OT/UT charge cutoffs with physical derivation; derating curve animated SVG; dT/dt firmware code (C language); multi-sensor voting logic code
- Summary — 10-principle traceability diagram
- Quick Reference — thermal parameters table, formula index

## Chapter 4 Status
FILE: docs/chapter4.html
LAST_SECTION: All sections complete (4.1 through 4.5 + Summary + Reference)
LAST_LINE: 1779
STATUS: complete
LINES: 1779
SIZE: ~95KB

## Chapter 4 Sections Written
- Hero + Sidebar + CSS design system (cyan electrical theme)
- 4.1 Voltage Protection — per-cell monitoring, animated weak-cell SVG, OVP/UVP physics, OVP event timeline SVG, Cu dissolution table, 16-bit ADC resolution
- 4.2 Current Protection — response time tier stack (SCD/OCD/OCC), SCD hardware path animated SVG, inrush calc, shunt vs Hall side-by-side cards, interactive current bar chart
- 4.3 Cell Balancing — root causes, imbalance impact SVG, passive vs active topology visuals, LFP plateau blindspot OCV SVG with animated markers
- 4.4 MOSFET Switching — back-to-back FET topology animated SVG, RDS(on) calc, pre-charge 4-phase animated sequence SVG, FET failure mode table
- 4.5 AFE Architecture — full AFE IC block diagram animated SVG, flying capacitor explanation, SPI daisy chain C code, BQ76952 vs LTC6813 comparison table
- Summary — 10-principle traceability diagram
- Quick Reference — protection threshold table, formula grid

## Chapter 5 Status
FILE: docs/chapter5.html
LAST_SECTION: All sections complete (5.1 through 5.6 + Summary + Reference)
LAST_LINE: 1725
STATUS: complete
LINES: 1725
SIZE: ~95KB

## Chapter 5 Sections Written
- Hero + Sidebar + CSS design system (emerald/teal standards theme)
- 5.1 Why Standards Exist — incident timeline (2006–2019), standards bodies stat grid, cost of non-compliance callout
- 5.2 IEC 62133 — portable safety standard card, 6 test cards, BMS contribution animated SVG
- 5.3 IEC 61960 — performance standard card, test table, 5 red-flag datasheet callout
- 5.4 UL 1973 — 3-tier protection hierarchy animated SVG, 8 BMS mandatory requirement cards, 6-phase certification test sequence timeline, harmonisation note
- 5.5 UN 38.3 — standard card, T1–T8 test cards grid (all 8 tests), LFP vs NMC difficulty animated bar chart, LFP transport advantage callout
- 5.6 BMS-to-Standard Compliance Matrix — filterable table (14 BMS features × 6 standards), gap analysis (4 beyond-compliance callouts)
- Summary — 10 design principles grid, chapter traceability animated SVG
- Quick Reference — 8-standard reference table, footer navigation

## Cross-chapter Links
- chapter1.html: sidebar links to chapter2, chapter3, chapter4, chapter5
- chapter2.html: sidebar links to chapter1, chapter3, chapter4, chapter5
- chapter3.html: sidebar links to chapter1, chapter2, chapter4, chapter5; footer links to ch2 and ch4
- chapter4.html: sidebar links to chapter1, chapter2, chapter3, chapter5; footer links to ch3 and ch5
- chapter5.html: footer links to chapter4 and chapter6

## Chapter 6 Status
FILE: docs/chapter6.html
LAST_SECTION: All sections complete (6.1 through 6.6 + Summary + Reference)
LAST_LINE: 3244
STATUS: complete
LINES: 3244
SIZE: ~185KB

## Chapter 6 Sections Written
- Hero + Sidebar + CSS design system (purple/indigo architecture theme)
- 6.1 Requirement Traceability — animated 8-row physics→silicon master map SVG
- 6.2 Hardware Architecture — full system block diagram SVG, AFE deep dive (flying cap + Δ-Σ ADC + watchdog), MCU requirements, MCU selection table, CAN bus physical layer SVG, frame structure, BMS CAN message set (0x351–0x380), STM32 code, NVM write strategy SVG, wear leveling + CRC code, backup SRAM architecture, RTC + calendar aging code, event logging circular buffer + code
- 6.3 Firmware Architecture — module overview SVG, protection timing hierarchy (5 layers), interactive state machine SVG (11 states + click-for-detail), timing architecture (6 timing layers)
- 6.4 World-Class BMS — Tesla (cell-level fusing, OTA, 24-bit shunt), BYD (CTP, blade, nail penetration), CATL (cloud SoH, EIS, adaptive charging), common principles
- 6.5 Communication Stack — SMBus register table (16 registers), I2C code, CAN/SMBus/UART protocol comparison
- 6.6 SOX Complete — animated update cycle SVG, SoC (CC + OCV + EKF + T-comp), SoH (capacity + resistance + cycle + calendar Arrhenius), SoF, SoP, integration code
- Summary — 12 design principles grid, 6-layer architecture animated SVG
- Quick Reference — 8-formula grid, 20-row hardware parameters table (16S 280Ah reference design)

## Cross-chapter Links
- chapter1.html: sidebar links to ch2–ch6
- chapter2.html: sidebar links to ch1, ch3–ch6
- chapter3.html: sidebar links to ch1, ch2, ch4–ch6
- chapter4.html: sidebar links to ch1–ch3, ch5, ch6
- chapter5.html: sidebar links to ch1–ch4, ch6; footer links to ch4 and ch6
- chapter6.html: sidebar links to ch1–ch5; footer links to ch5 and ch7

## NEXT: Chapter 7
FILE: docs/chapter7.html
TOPIC: Advanced Topics — Second Life, Fault Injection Testing, Cloud BMS, AI in BMS

## Resume Instructions
If user says "continue", "resume", "go", "limit reset", "start where u left":
1. Read CLAUDE.md for context
2. Read current chapter file to find exact stop point
3. Continue from there — NEVER rewrite existing content
4. Commit every 5-10 lines
5. Update CLAUDE.md after each commit
