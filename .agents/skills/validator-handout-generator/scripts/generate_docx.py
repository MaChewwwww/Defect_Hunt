"""
Generates docs/Veranda_PMS_Defect_List.docx from docs/DEFECT_CATALOG.md
using python-docx and docs/example/ShopSphere_Defect_List.docx as the exact
visual/layout template while cleanly updating headers, footers, metadata, and
all 60 defect rows (VH-01..VH-60).
"""

import copy
import os
import re
from datetime import datetime, timezone
import docx
from docx.text.paragraph import Paragraph


def set_paragraph_runs_text(paragraph: Paragraph, new_text: str) -> None:
    """Replace paragraph text while preserving paragraph style and first run formatting."""
    runs = paragraph.runs
    if not runs:
        paragraph.add_run(new_text)
        return
    runs[0].text = new_text
    for extra in runs[1:]:
        extra.text = ""


def set_cell_text(cell, new_text: str) -> None:
    """Replace text inside a table cell while preserving its first paragraph & run style."""
    if not cell.paragraphs:
        cell.text = new_text
        return
    p0 = cell.paragraphs[0]
    set_paragraph_runs_text(p0, new_text)
    for extra_p in cell.paragraphs[1:]:
        extra_p._element.getparent().remove(extra_p._element)


def parse_markdown_tables(md_path: str) -> dict[str, list[list[str]]]:
    """Extract Easy, Medium, and Hard defect rows from docs/DEFECT_CATALOG.md."""
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    sections: dict[str, list[list[str]]] = {"Easy": [], "Medium": [], "Hard": []}
    current_section = None

    for line in lines:
        if line.startswith("## Easy"):
            current_section = "Easy"
        elif line.startswith("## Medium"):
            current_section = "Medium"
        elif line.startswith("## Hard"):
            current_section = "Hard"
        elif current_section and line.startswith("|"):
            cols = [c.strip() for c in line.strip("|").split("|")]
            if len(cols) == 7 and cols[0].isdigit():
                cleaned = [re.sub(r"`([^`]+)`", r"\1", c) for c in cols]
                sections[current_section].append(cleaned)

    return sections


def generate_veranda_docx(
    template_docx: str, catalog_md: str, output_docx: str
) -> None:
    sections = parse_markdown_tables(catalog_md)
    assert len(sections["Easy"]) == 5, f"Expected 5 Easy, got {len(sections['Easy'])}"
    assert len(sections["Medium"]) == 31, f"Expected 31 Medium, got {len(sections['Medium'])}"
    assert len(sections["Hard"]) == 24, f"Expected 24 Hard, got {len(sections['Hard'])}"

    doc = docx.Document(template_docx)

    # Update document core properties (metadata)
    doc.core_properties.title = "Veranda PMS Defect Hunt - Defect List"
    doc.core_properties.author = "Veranda PMS Defect Hunt"
    doc.core_properties.last_modified_by = "Veranda PMS"
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    doc.core_properties.created = now_utc
    doc.core_properties.modified = now_utc

    # Update top-level headings & introductory notes
    set_paragraph_runs_text(doc.paragraphs[0], "Veranda PMS Defect Hunt - Defect List")
    set_paragraph_runs_text(
        doc.paragraphs[1], "All 60 planted defects, sorted from Easy to Hard"
    )
    set_paragraph_runs_text(
        doc.paragraphs[2],
        "Confidential - for organizers and validators only. Do not share with contestants.",
    )
    set_paragraph_runs_text(doc.paragraphs[3], "Test accounts")
    set_paragraph_runs_text(doc.paragraphs[4], "Before you start")
    set_paragraph_runs_text(
        doc.paragraphs[5],
        'Data is isolated per browser sandbox (Supabase + localStorage mirror). Use "Reset demo data" in the footer of the login page to restore the original seed data.',
    )
    set_paragraph_runs_text(
        doc.paragraphs[6],
        "VH-18 and VH-44 only appear when the browser timezone is not UTC. VH-18 needs a timezone ahead of UTC, for example Asia/Manila (UTC+8).",
    )
    set_paragraph_runs_text(
        doc.paragraphs[7],
        "Correct rules for comparison: total = (subtotal - discount) + 12% VAT on (subtotal - discount) + 250.00 Service & Environmental Fee. Allotment (available units) is deducted once when the reservation is created and restored on cancel. Low allotment means available units of 5 or less. Revenue excludes Cancelled reservations and includes the 250.00 service fee. Dates are MM/DD/YYYY in local time.",
    )
    set_paragraph_runs_text(
        doc.paragraphs[8],
        "Older reservation timestamps are anchored relative to the day the sandbox was initialized or reset, so older reservations are described by their content or code.",
    )
    set_paragraph_runs_text(doc.paragraphs[9], "Easy (5 defects)")
    set_paragraph_runs_text(doc.paragraphs[10], "Medium (31 defects)")
    set_paragraph_runs_text(doc.paragraphs[11], "Hard (24 defects)")

    # Table 0: System summary
    sys_tbl = doc.tables[0]
    set_cell_text(sys_tbl.rows[0].cells[0], "System")
    set_cell_text(
        sys_tbl.rows[0].cells[1],
        "Veranda PMS - Hospitality, Room Allotment and Guest Folio Management System (fictional resort Solstice Bay Resort & Villas, fictional data only)",
    )
    set_cell_text(sys_tbl.rows[1].cells[0], "Live URL")
    set_cell_text(
        sys_tbl.rows[1].cells[1],
        "https://veranda-pms.vercel.app",
    )
    set_cell_text(sys_tbl.rows[2].cells[0], "Total defects")
    set_cell_text(sys_tbl.rows[2].cells[1], "60  (Easy 5, Medium 31, Hard 24)")

    # Table 1: Test accounts (5 isolated competition groups, each with Admin, Staff, and Deactivated Staff)
    acct_tbl = doc.tables[1]
    groups = [
        (1, "Coral Villa"),
        (2, "Cypress Cove"),
        (3, "Lagoon Sanctuary"),
        (4, "Terracotta Cliff"),
        (5, "Solstice Horizon"),
    ]
    accounts = []
    for num, wing in groups:
        accounts.append(
            (
                f"Group {num} - {wing} (Admin)",
                f"admin.group{num}@verandapms.test",
                "Admin@123",
                f"Elena Marasigan (isolated Group {num} data)",
            )
        )
        accounts.append(
            (
                f"Group {num} - {wing} (Staff)",
                f"staff.group{num}@verandapms.test",
                "Staff@123",
                f"Marco Villanueva (isolated Group {num} data)",
            )
        )
        accounts.append(
            (
                f"Group {num} - {wing} (Deactivated)",
                f"former.group{num}@verandapms.test",
                "Former@123",
                f"Tricia Soriano, inactive (Group {num})",
            )
        )
    while len(acct_tbl.rows) < len(accounts) + 1:
        acct_tbl._tbl.append(copy.deepcopy(acct_tbl.rows[1]._tr))
    while len(acct_tbl.rows) > len(accounts) + 1:
        acct_tbl._tbl.remove(acct_tbl.rows[-1]._tr)
    for idx, acct_vals in enumerate(accounts, start=1):
        for cell, val in zip(acct_tbl.rows[idx].cells, acct_vals):
            set_cell_text(cell, val)

    # Tables 2, 3, 4: Easy (5), Medium (31), Hard (24)
    for tbl_idx, tier in [(2, "Easy"), (3, "Medium"), (4, "Hard")]:
        tbl = doc.tables[tbl_idx]
        rows = sections[tier]
        assert len(tbl.rows) == len(rows) + 1
        for row_obj, row_vals in zip(tbl.rows[1:], rows):
            for cell, val in zip(row_obj.cells, row_vals):
                set_cell_text(cell, val)

    # Update footer text while preserving PAGE / NUMPAGES Word field XML
    for section in doc.sections:
        for fp in section.footer.paragraphs:
            if len(fp.runs) >= 2 and "ShopSphere" in fp.runs[0].text:
                fp.runs[0].text = "Veranda PMS"
                fp.runs[1].text = " Defect Hunt - Defect List (Confidential)"

    doc.save(output_docx)
    print(f"Successfully generated {output_docx}")


if __name__ == "__main__":
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
    )
    template_path = os.path.join(
        repo_root, "docs", "example", "ShopSphere_Defect_List.docx"
    )
    catalog_path = os.path.join(repo_root, "docs", "DEFECT_CATALOG.md")
    output_path = os.path.join(repo_root, "docs", "Veranda_PMS_Defect_List.docx")
    generate_veranda_docx(template_path, catalog_path, output_path)
