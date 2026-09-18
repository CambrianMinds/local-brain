Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/CherryHQ/cherry-studio/main/.agents/skills/cherry-electron-dev/SKILL.md

---

---
name: cherry-electron-dev
description: Develop, fix, and profile Cherry Studio in a tracked Electron instance. Use for everyday implementation, UI and interaction work, bug fixing, runtime debugging, DevTools inspection, lag or jank investigation, CPU and memory monitoring, leak checks, and startup-performance analysis; reuse a verified workspace instance across instructions and launch or replace one only when required.
---

# Cherry Studio Development

Use this skill for ongoing work in the current checkout. Do not use it to check
out or report on PRs; use `cherry-pr-test` for that workflow.

## Required runtime workflow

Before reading or controlling Electron UI, read
[Electron Instance Management](references/electron-instance.md) and use its
`persistent` policy.

That reference is the only authority for instance discovery, `instance.json`,
CDP target selection, launching, replacement, shutdown, and troubleshooting.
Do not reproduce those procedures here or substitute generic Electron app
control.

## Development loop

1. State the requested behavior and the evidence that will prove it.
2. Read the relevant code and nearby README files.
3. Verify and reuse the tracked instance through the runtime reference.
4. Reproduce or inspect the current behavior before editing when practical.
5. Capture the smallest useful evidence: UI state, DOM, console/network output,
   main-process logs, persisted state, or 

