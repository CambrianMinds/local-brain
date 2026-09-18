---
name: plan-orchestrator
description: >-
  Trigger this skill whenever the user uses the `/plan` command or asks to orchestrate a plan based on their requirements.
---

# Plan Orchestrator

When the user invokes the `/plan` command or asks to create a comprehensive plan, follow these steps to orchestrate the planning process:

## 1. Requirement Gathering
Start by thoroughly understanding the user's request. If the requirements are ambiguous, prompt the user for clarification.
- Identify the core goal, constraints, and success criteria.
- **Tip**: You can recommend that the user use the `/grill-me` command if the feature is complex and requires an interactive interview to align on design decisions.

## 2. Research Phase
Conduct deep research before proposing any changes:
- Read relevant documentation, project structure, and existing code patterns.
- Do **not** execute any code editing commands during this phase. Focus solely on investigation.

## 3. Create the Implementation Plan
Draft a comprehensive implementation plan using the `implementation_plan.md` artifact. Be sure to set `request_feedback = true` and `user_facing = true` when creating the artifact. The plan should include:
- **Goal Description**: A brief summary of what will be accomplished.
- **User Review Required**: Document any breaking changes or critical design choices using GitHub alerts (e.g., `> [!IMPORTANT]`).
- **Open Questions**: List any remaining ambiguities that affect the implementation.
- **Proposed Changes**: Detail the file-level changes grouped by component.
- **Verification Plan**: Outline how the changes will be tested (e.g., automated tests, manual UI checks).

## 4. Obtain Approval
Once the implementation plan is created, **stop** and wait for the user's explicit approval. Do not proceed to execution until the user agrees with the proposed approach.

## 5. Execution and Tracking
After receiving approval:
- Create a `task.md` artifact to serve as a checklist.
- Systematically execute the changes according to the plan.
- Update the `task.md` checklist (using `[/]` for in-progress and `[x]` for completed) as you progress through the tasks.
- Verify your changes upon completion and generate a `walkthrough.md` summarizing the completed work.
