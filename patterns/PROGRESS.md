# C Pattern Library — Progress Tracker

## Status Overview

| File | Patterns | Status | Last Updated |
|------|----------|--------|--------------|
| index.html | nav | ✅ Done | 2026-04-24 |
| arrays.html | 54 | ✅ Done | 2026-05-01 |
| pointers.html | 30 | 🔄 Rework In Progress | 2026-05-04 |
| strings.html | 44 | ✅ Done | 2026-05-04 |
| linkedlist.html | 35 | ✅ Done | 2026-04-29 |
| stacks.html | 32 | ✅ Done | 2026-04-29 |
| queues.html | 22 | ✅ Done | 2026-04-29 |

---

## arrays.html — Rework Audit (All 54 Cards)

### Prefix Sum (P01–P03)
- [x] P01 · Prefix Sum: Range Query
- [x] P02 · Prefix Sum: Running Total / Pivot Index
- [x] P03 · Prefix Sum: 2D Matrix Range Sum

### Two Pointer (P04–P08)
- [x] P04 · Two Pointer: Sorted Array Pair Sum
- [x] P05 · Two Pointer: Remove Duplicates In-Place
- [x] P06 · Two Pointer: Move Zeros to End
- [x] P07 · Two Pointer: Three Sum
- [x] P08 · Two Pointer: Container With Most Water

### Sliding Window (P09–P13)
- [x] P09 · Sliding Window: Fixed Size Maximum Sum
- [x] P10 · Sliding Window: Variable Size (Shrink When Invalid)
- [x] P11 · Sliding Window: Longest Substring Without Repeat (Freq Map)
- [x] P12 · Sliding Window: Minimum Window Substring
- [x] P13 · Sliding Window: Count Subarrays with Condition

### Binary Search (P14–P19)
- [x] P14 · Binary Search: Classic Target Find
- [x] P15 · Binary Search: Find Leftmost (First) Occurrence
- [x] P16 · Binary Search: Find Rightmost (Last) Occurrence
- [x] P17 · Binary Search: Search in Rotated Sorted Array
- [x] P18 · Binary Search: Find Peak Element
- [x] P19 · Binary Search: Answer Space (Minimize/Maximize a Value)

### Kadane's (P20–P22)
- [x] P20 · Kadane's Algorithm: Maximum Subarray Sum
- [x] P21 · Kadane's Variant: Maximum Product Subarray
- [x] P22 · Kadane's Variant: Circular Maximum Subarray

### In-Place (P23–P26)
- [x] P23 · In-Place: Cyclic Sort (1-to-N Values)
- [x] P24 · In-Place: Dutch National Flag (3-Way Partition)
- [x] P25 · In-Place: Rotate Array Right by K
- [x] P26 · In-Place: Reverse Segments

### Sorting (P27–P29)
- [x] P27 · Sorting: Custom Comparator with qsort
- [x] P28 · Sorting: Merge Overlapping Intervals
- [x] P29 · Sorting: Meeting Rooms / Interval Overlap Check

### Greedy (P30–P33)
- [x] P30 · Greedy: Jump Game (Can You Reach the End?)
- [x] P31 · Greedy: Jump Game II (Minimum Jumps to Reach End)
- [x] P32 · Greedy: Gas Station Circular Tour
- [x] P33 · Greedy: Assign Cookies (Two-Sorted-Array Matching)

### Matrix (P34–P37)
- [x] P34 · Matrix: Spiral Order Traversal
- [x] P35 · Matrix: Set Row and Column to Zero
- [x] P36 · Matrix: Rotate 90 Degrees In-Place
- [x] P37 · Matrix: Word Search (DFS on Grid)

### Hashmap (P38–P42)
- [x] P38 · Hashmap: Two Sum (Single Pass)
- [x] P39 · Hashmap: Subarray Sum Equals K (Prefix + HashMap)
- [x] P40 · Hashmap: Longest Consecutive Sequence
- [x] P41 · Hashmap: Group Anagrams
- [x] P42 · Hashmap: Top K Frequent Elements

### Hard Classics (P43–P48)
- [x] P43 · Hard Classic: Trapping Rain Water
- [x] P44 · Hard Classic: Largest Rectangle in Histogram
- [x] P45 · Hard Classic: Median of Two Sorted Arrays
- [x] P46 · Hard Classic: Next Permutation
- [x] P47 · Hard Classic: First Missing Positive
- [x] P48 · Hard Classic: Count of Smaller Numbers After Self

### Monotonic / Bit / Advanced (P49–P54)
- [x] P49 · Monotonic Stack: Next Greater Element
- [x] P50 · Monotonic Stack: Daily Temperatures
- [x] P51 · Bit Manipulation: Single Number (XOR Trick)
- [x] P52 · Bit Manipulation: Missing Number
- [x] P53 · Divide & Conquer: Count Inversions (Merge Sort)
- [x] P54 · Difference Array: Range Update in O(1)

---

## Rework Progress Log

| Batch | Cards | Status |
|-------|-------|--------|
| Batch 1 | P01–P10 | ✅ Done |
| Batch 2 | P11–P20 | ✅ Done |
| Batch 3 | P21–P30 | ✅ Done |
| Batch 4 | P31–P40 | ✅ Done |
| Batch 5 | P41–P50 | ✅ Done |
| Batch 6 | P51–P54 | ✅ Done |

**All 54 cards reworked. Rework complete 2026-05-01.**

---

## strings.html — Rework Audit (All 44 Cards)

### C String Mechanics (S01–S05)
- [x] S01 · Null Terminator and String Length
- [x] S02 · char* vs char[] — Pointer vs Array
- [x] S03 · Safe String Copy (strcpy pitfalls)
- [x] S04 · String Comparison (strcmp)
- [x] S05 · String Search and Scan (strchr, strstr)

### Frequency / Char Counting (S06–S09)
- [x] S06 · Frequency Array int[26]
- [x] S07 · Anagram Detection
- [x] S08 · First Non-Repeating Character
- [x] S09 · Character Classification (isalpha, isdigit, tolower)

### Two Pointer on Strings (S10–S13)
- [x] S10 · Reverse String In-Place
- [x] S11 · Palindrome Check (Two Pointer)
- [x] S12 · Valid Palindrome (Skip Non-Alphanumeric)
- [x] S13 · Filter Characters In-Place (Write Pointer)

### Sliding Window on Strings (S14–S17)
- [x] S14 · Longest Substring Without Repeating Characters
- [x] S15 · Minimum Window Substring
- [x] S16 · Longest Substring with At Most K Distinct Characters
- [x] S17 · Count Substrings with Condition

### Palindrome Patterns (S18–S21)
- [x] S18 · Longest Palindromic Substring (Expand Around Center)
- [x] S19 · Count Palindromic Substrings
- [x] S20 · Valid Palindrome II (One Deletion Allowed)
- [x] S21 · Palindrome Partitioning Check

### Parsing and Construction (S22–S27)
- [x] S22 · Reverse Words in a String
- [x] S23 · Custom atoi (String to Integer)
- [x] S24 · Integer to String (itoa)
- [x] S25 · Run-Length Encoding
- [x] S26 · Decode String (Stack)
- [x] S27 · Roman Numerals to Integer

### Pattern Matching (S28–S32)
- [x] S28 · Naive String Search O(nm)
- [x] S29 · KMP: Failure Function Construction
- [x] S30 · KMP: Search Phase
- [x] S31 · Rolling Hash (Rabin-Karp)
- [x] S32 · Longest Common Prefix

### Number / Conversion (S33–S36)
- [x] S33 · Add Two Binary Strings
- [x] S34 · Multiply Strings
- [x] S35 · Valid Number Detection
- [x] S36 · Integer to Roman

### Hashing and Grouping (S37–S40)
- [x] S37 · Group Anagrams by Sorted Key
- [x] S38 · Isomorphic Strings
- [x] S39 · Word Pattern Matching
- [x] S40 · Edit Distance (Levenshtein DP)

### Advanced (S41–S44)
- [x] S41 · Longest Palindromic Subsequence
- [x] S42 · Zigzag String Conversion
- [x] S43 · Longest Common Subsequence (LCS)
- [x] S44 · String Hashing (Polynomial Rolling Hash)

---

## strings.html Rework Progress Log

| Batch | Cards | Status |
|-------|-------|--------|
| Batch 1 | S01–S10 | ✅ Done |
| Batch 2 | S11–S20 | ✅ Done |
| Batch 3 | S21–S30 | ✅ Done |
| Batch 4 | S31–S40 | ✅ Done |
| Batch 5 | S41–S44 | ✅ Done |

**All 44 cards complete. Rework complete 2026-05-04.**

---

## pointers.html — Rework Audit (All 30 Cards)

### Pointer Mechanics (Q01–Q09)
- [ ] Q01 · Address vs Value — What a Pointer Actually Is
- [ ] Q02 · Dereferencing — Reading and Writing Through a Pointer
- [ ] Q03 · Pointer Arithmetic — Why ptr+1 Moves by sizeof(*ptr)
- [ ] Q04 · Array Decay to Pointer — arr[i] == *(arr+i)
- [ ] Q05 · Double Pointer — Modifying a Pointer from a Function
- [ ] Q06 · Function Pointers — Storing and Calling Functions by Address
- [ ] Q07 · void* — The Generic Pointer and memcpy
- [ ] Q08 · const Pointer Variations — const int* vs int* const vs const int* const
- [ ] Q09 · Pointer Subtraction — Counting Elements Between Two Pointers

### Two Pointer Algorithms (Q10–Q14)
- [ ] Q10 · Fast/Slow — Cycle Detection (Floyd's Algorithm)
- [ ] Q11 · Fast/Slow — Find Cycle Entry Point (Floyd Phase 2)
- [ ] Q12 · Fast/Slow — Find Midpoint of a Sequence
- [ ] Q13 · Read/Write Pointers — In-Place Compaction
- [ ] Q14 · Runner Technique — K-Gap Between Two Pointers

### Embedded C Pointer Patterns (Q15–Q22)
- [ ] Q15 · Pointer to Hardware Register — volatile uint32_t* at Fixed Address
- [ ] Q16 · Struct Pointer for Memory-Mapped IO — Cast Base Address to Struct*
- [ ] Q17 · Circular Buffer with Head/Tail Pointer Wrap
- [ ] Q18 · memcpy/memmove — How They Walk src and dst Pointers
- [ ] Q19 · Byte-Level Access via uint8_t* Cast
- [ ] Q20 · Function Pointer Dispatch Table — Indexed State Machine
- [ ] Q21 · const Pointer for Read-Only Buffer Passing
- [ ] Q22 · restrict Keyword — Promising No Aliasing to the Compiler

### Pointer Pitfalls (Q23–Q30)
- [ ] Q23 · Dangling Pointer — Pointer to Freed or Stack Memory
- [ ] Q24 · NULL Dereference — and What HardFault Looks Like in Embedded
- [ ] Q25 · Strict Aliasing — What the Optimizer Assumes About Pointer Types
- [ ] Q26 · sizeof(ptr) vs sizeof(array) — Size Info Loss on Decay
- [ ] Q27 · Off-by-One in Pointer Walk — Walking Past End of Array
- [ ] Q28 · Returning Pointer to Local Variable
- [ ] Q29 · Uninitialized Pointer — Wild Pointer
- [ ] Q30 · memcpy vs memmove — Overlapping Regions

---

## pointers.html Rework Progress Log

| Batch | Cards | Status |
|-------|-------|--------|
| Batch 1 | Q01–Q10 | ⏳ Next |
| Batch 2 | Q11–Q20 | |
| Batch 3 | Q21–Q30 | |

**Currently reworking:** Q01 — Address vs Value
