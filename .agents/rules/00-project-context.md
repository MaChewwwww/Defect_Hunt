# 00 — Project Context

Read the root [AGENTS.md](../../AGENTS.md), [PROJECT_OVERVIEW.md](../../docs/PROJECT_OVERVIEW.md), [FRS_NFRS.md](../../docs/FRS_NFRS.md), and [DEFECT_CATALOG.md](../../docs/DEFECT_CATALOG.md) before starting any work.

## Core Identity & Purpose

- **Veranda PMS** is a Hospitality, Room Allotment, and Guest Folio Management System built for the fictional coastal resort operator **Solstice Bay Resort & Villas**.
- It is commissioned for the **Polytechnic University of the Philippines — Quezon City (PUPQC) BSIT Foundation Month** competition event: **Defect Hunt**.
- It serves as the official second competition platform alongside the co-developer's *ShopSphere (`Lumina Goods`)* retail system. Never copy ShopSphere's retail domain, product names, or purple-glow visual theme.

## Dual-Contract System Model

Veranda PMS operates under two simultaneous, strictly reconciled contracts:
1. **Canonical Baseline ([FRS_NFRS.md](../../docs/FRS_NFRS.md))**: Defines how the resort management platform behaves as a realistic, production-quality B2B hospitality workspace ("Expected Behavior").
2. **Planted Defect Catalog ([DEFECT_CATALOG.md](../../docs/DEFECT_CATALOG.md))**: Defines the **60 intentional software defects (`VH-01` through `VH-60`: 5 Easy, 31 Medium, 24 Hard)** that contestants must discover and report ("Actual Behavior").

## Scope & Reference Boundaries

- Treat `D:\repos\Capstone_BGH` and `D:\repos\EHR_System` as strictly read-only reference workspaces for documentation-driven development and AI rules/skills patterns. Never modify files in those directories.
- Preserve `docs/example/ShopSphere_Defect_List.docx` untouched as the reference handout from the co-developer.
- Do not add real payment gateways, external OTA channel sync, external SMTP mail dependencies, or unrequested microservices.
- Check Git status when available and preserve user work. Resolve discoverable facts from the repository documentation before asking the user to repeat them.
