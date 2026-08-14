# Repository Agent Instructions

This file applies to **all contributors and agents** working in this repository: ChatGPT, Codex, Claude, Cursor, Copilot, Gemini, local agents, scripts acting as agents, and humans.

The repository—not a chat session—is the durable source of work state.

Canonical cross-repository delivery protocol:

`reallaksh19/Common/skills/engineering-pr-delivery/`

Repository-local rules may be stricter. Explicit current owner instructions override generic defaults, but no agent may silently weaken engineering evidence, controlled-data provenance, validation integrity, authority boundaries, or handover requirements.

## 1. Repository criticality

Treat changes affecting calculation workbooks, engineering formulas/correlations, controlled-source transcriptions, coefficients, limits, master/reference data, units, engineering outputs, or data used by downstream engineering tools as:

```text
CRITICALITY = ENGINEERING_CRITICAL
```

unless a stronger classification is required.

Source transcription/reference evidence is not automatically qualified engineering authority.

## 2. Continuous handover invariant

Assume the active agent may disappear, lose context, become incapable, or be replaced after any meaningful action.

At every durable checkpoint another qualified agent must be able to recover the mission, source/provenance basis, current truth, evidence, partial work, risks, authority boundaries, validation state, and exact next action from repository + PR artifacts without chat history.

No essential technical state may exist only in private reasoning or conversation history.

## 3. Establish live ground truth and provenance before mutation

Before changing engineering-sensitive content, determine from live Git/GitHub where available:

- current base/main SHA;
- WIP/branch/PR identity;
- current PR head and merge base;
- actual changed files and commits;
- source task/issue;
- predecessor/follow-on PRs;
- other active PR/WIP overlap;
- exact controlled/reference source identity where applicable;
- workbook/file/blob/sheet/cell/range provenance where applicable;
- base/main drift.

Live mutable repository state overrides stale reports and prior conversation.

Never invent source provenance or silently promote project/reference data to controlled engineering authority.

## 4. Durable WIP/PR recovery artifacts

Before PR allocation use:

```text
WIP-<short-id>
agents/WIP-<short-id>_workreport.md
```

Do not use one shared `PR_PENDING_workreport.md`.

After PR allocation use:

```text
agents/PR<NUMBER>_workreport.md
```

If status/claim registries exist, keep them synchronized.

The work report must continuously preserve mission/scope, source/provenance basis, current implementation/transcription state, active findings/risks/decisions/questions, current hypothesis and falsifier, authority/publication state, validation PASS/FAIL/NOT_RUN, changed-file ledger, highest risk, exact work location, and one executable `EXACT_NEXT_ACTION`.

## 5. Engineering-critical takeover starts READ_ONLY

An incoming agent taking over engineering-critical work begins with:

```text
TAKEOVER_AUTHORITY = READ_ONLY
```

Before modifying formulas, engineering data, or publication state it must re-ground independently, reconcile the prior report against the actual PR, inspect the exact source evidence, complete repository-specific Appendix A qualification, and decide whether to `CONTINUE`, `QUARANTINE`, `SALVAGE_PARTIAL`, or `SUPERSEDE`.

Do not grant implementation authority because an agent claims expertise.

## 6. Appendix A — Implementation Takeover Qualification

Appendix A must test the actual unresolved engineering/data problem, not generic theory.

Normally require:

```text
A1 Source / Production Trace
A2 Current Failure or Data-Isolation Challenge
A3 Authority / Provenance Invariant
A4 Independent Validation Challenge
A5 Next-Commit / Minimal-Patch Challenge
```

A question is invalid if it can be answered correctly without opening the current repository, PR diff, workbook/source evidence, tests, or work report.

Prefer exact source tracing, formula replay, unit interpretation, provenance verification, single-factor comparison, falsification, and patch-boundary tasks over generic explanation questions.

Engineering-critical default qualification:

```text
total >= 92/100
minimum per challenge >= 17/20
```

Fabricated provenance, unsafe engineering claims, silent authority promotion, incorrect unit/source assumptions, or validation gaming may fail immediately regardless of score.

## 7. Multi-agent coordination

Before implementation and before each new stage inspect other active PRs/WIPs for:

- exact-file/workbook overlap;
- source-data/master-data authority overlap;
- shared coefficients/correlations;
- dependency/stacked-PR relationships;
- base drift.

Classify:

```text
SAFE
COORDINATION_REQUIRED
BLOCKED_BY_ACTIVE_CLAIM
UNKNOWN
```

No exact-file overlap does not prove engineering-data independence.

## 8. Validation and authority integrity

Every material check must distinguish:

```text
STATUS      = PASS | FAIL | NOT_RUN | NOT_APPLICABLE
OBSERVATION = execution/inspection/inference basis
ORACLE      = implementation-coupled or independent authority class
```

Never:

- replace source values with current implementation output;
- fit coefficients from benchmark outputs when source literals are required;
- change implementation and expected values together and call the result independently verified;
- omit failing source cases to obtain green status;
- infer units, applicability limits, or engineering authority without evidence;
- claim workbook parity as controlled-source qualification;
- claim `NOT_RUN` as `PASS`.

Candidate/reference/transcription state must remain distinct from qualified/active engineering authority.

## 9. Damaged PRs and incapable agents

Do not preserve a PR because of sunk effort.

If source provenance is unclear, copied values cannot be traced, authority has been silently promoted, commits cannot be classified, or conflict resolution requires guessing engineering intent, quarantine and perform a salvage assessment.

Valid outcomes:

```text
CONTINUE
SALVAGE_PARTIAL
SUPERSEDE
ABANDON
```

Preserve known-good source identities, exact data literals, independent evidence, decisions, invariants and provenance even when the implementation PR is superseded.

## 10. Scope and merge discipline

- One coherent assignment per PR unless the owner explicitly changes scope.
- Keep changes surgical and explain every changed file.
- Do not silently broaden scope or promote engineering authority.
- Do not modify workflow files unless explicitly authorized.
- Keep the PR handover-ready while waiting for review/merge.
- **Never merge without explicit owner authorization.**

## 11. AUTO MODE — autonomous phase execution

The exact owner keyword `AUTO MODE` sets:

```text
EXECUTION_MODE = AUTO
AUTO_STATE = RUNNING
SCOPE_AUTHORITY = LOCKED_TO_APPROVED_MISSION
PHASE_PROGRESSION = AUTO
MERGE_AUTHORITY = OWNER_ONLY
```

AUTO MODE authorizes automatic progression through the approved source/data/calculation plan without routine phase confirmation. It does not authorize scope expansion, source/provenance invention, authority promotion, formula/methodology changes beyond approved scope, weakening validation, destructive actions, or merge.

After each phase the agent must validate source/provenance and implementation evidence, synchronize the work report/status/claims/Appendix A as needed, create a durable checkpoint, evaluate hard stops, and continue automatically when none applies.

In addition to universal hard stops, stop AUTO when continuing requires an unapproved change to formula/correlation authority, controlled-source identity, coefficient/limit interpretation, units/applicability, workbook publication authority, master/reference data authority, or downstream engineering-output semantics.

Workbook parity alone is never sufficient reason to continue through a controlled-source contradiction.

If repeated attempts do not narrow uncertainty, or the agent cannot state a concrete hypothesis, falsifier, next source/provenance check, and protected invariants, stop mutation and set:

```text
PR_RECOVERY_STATE = TAKEOVER_REQUIRED
TAKEOVER_AUTHORITY = READ_ONLY
AUTO_STATE = TAKEOVER_REQUIRED
```

Refresh the work report and Appendix A for immediate takeover.

`AUTO MODE` never implies `AUTO MERGE`; merge remains owner-only unless separately and explicitly authorized.
