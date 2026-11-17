---
name: validator-handout-generator
description: Generates or updates the confidential organizer and validator Word document (docs/Veranda_PMS_Defect_List.docx) from docs/DEFECT_CATALOG.md, matching the structure of docs/example/ShopSphere_Defect_List.docx.
---

# Validator Handout (.docx) Generator Skill

Use this skill when the user asks to generate or update the printable/shareable `.docx` Defect List handout for PUPQC BSIT *Defect Hunt* organizers and validators.

## 1. Source of Truth

Read `docs/DEFECT_CATALOG.md` as the single source of truth. Verify that it contains:
- System metadata table (`Veranda PMS — Hospitality, Room Allotment, and Guest Folio Management System`, Live URL, Total defects: `60 (Easy 5, Medium 31, Hard 24)`).
- Test accounts table (`Admin`, `Staff`, `Staff (deactivated)`).
- `"Before you start"` section explaining per-browser sandbox storage, `"Reset demo data"`, `Asia/Manila (UTC+8)` timezone requirement for `VH-18` and `VH-44`, and the canonical comparison formulas.
- Three tables sorted by difficulty tier:
  1. **Easy (5 defects)**: `No. 1` to `5`
  2. **Medium (31 defects)**: `No. 6` to `36`
  3. **Hard (24 defects)**: `No. 37` to `60`
- Columns for each defect table: `No. | ID | Module / Page | Category | Steps to Reproduce | Expected | Actual`.

## 2. Generating `.docx` Using `python-docx`

Run `.agents/skills/validator-handout-generator/scripts/generate_docx.py` using `python-docx`.
Using `python-docx` directly on top of the `docs/example/ShopSphere_Defect_List.docx` template preserves all Microsoft Word OpenXML namespaces, styles, borders, column widths, and dynamic footer page fields (`PAGE` / `NUMPAGES`) while replacing:
- Every paragraph and table row with Veranda PMS content from `docs/DEFECT_CATALOG.md`
- `word/footer1.xml` text (`Veranda PMS Defect Hunt - Defect List (Confidential)`)
- `docProps/core.xml` properties (`title`, `author`, `last_modified_by`)

## 3. Verification

After generating `docs/Veranda_PMS_Defect_List.docx`:
1. Open `docs/Veranda_PMS_Defect_List.docx` via `python-docx` and inspect all paragraphs, all 5 tables (`60` defect rows `VH-01`..`VH-60`), `sections[0].footer`, and `core_properties`.
2. Assert zero leftover `"ShopSphere"`, `"Lumina"`, or `"DH-"` strings anywhere in the archive XML (`word/*.xml`, `docProps/*.xml`).
3. Confirm that `docs/example/ShopSphere_Defect_List.docx` remains unmodified.
