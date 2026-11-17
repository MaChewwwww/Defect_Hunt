---
name: workspace-onboarding
description: Automates session bootstrap when working on Veranda PMS (Defect Hunt). Forces the mandatory read order (AGENTS.md -> rules -> relevant docs/DEFECT_CATALOG.md) and emits a pre-flight readiness block before code or doc edits.
---

# Workspace Onboarding Skill

Use this skill at the start of an implementation or verification session (e.g., when the user says "start milestone M1", "work on reservations", "implement the rooms module", or "audit planted defects").

## Trigger

Trigger on session-opening requests that initiate feature building, milestone execution, defect planting, or verification in `d:\repos\Defect_Hunt`.

## Step-by-Step Instructions

1. Read `AGENTS.md` and `docs/README.md`.
2. Read the mandatory rules in `.agents/rules/00-project-context.md` through `.agents/rules/70-commit-conventions.md` relevant to the task.
3. Read the task-specific specification documents:
   - Always check `docs/DEFECT_CATALOG.md` for all `VH-XX` defects mapped to the target module/page so you never accidentally omit or overwrite a required competition defect.
   - Check `docs/DATABASE.md` for exact seed codes (`SB-1001`..`SB-1020`, `RSV-2026`..`RSV-2045`) and field names.
   - Check `docs/DESIGN.md` for **Cypress & Travertine** tokens and custom hospitality component specs.
4. Emit the **Pre-Flight Readiness Block** before writing code or running build commands:

```text
Veranda PMS Pre-Flight:
  milestone / scope: <target milestone or module>
  docs loaded:       <list of docs/*.md files read>
  planted defects:   <list of VH-XX IDs active in this module>
  verify command:    <planned verification command>
Proceeding with task: <concise restatement of task>
```
