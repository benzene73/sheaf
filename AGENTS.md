# LiveView Base UI port playground

Read PORTING.md and ARCHITECTURE.md before implementation. The ten-minute
prototype is historical scaffolding, not evidence of an upstream port.

Deadline: 2026-09-07 20:30 UTC (02:00 September 8 Asia/Calcutta), corrected by user.
This overrides the earlier 2 p.m. deadline in the original goal description. Stop implementation at
deadline and report reproducible evidence. Coordinator controls integration.

## Rules
- Work only in assigned files/worktree. No Kaguya/Nila application changes.
- Data destruction, reset --hard, shared stash, force pushes are forbidden.
- Local commits, dependency/browser installs and isolated worktrees authorized.
- Source pin: Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
- Every ported unit needs source/function, upstream test, translation mapping,
  behavioral scenarios and explicit divergences. Keep upstream copyright/license
  attribution when adapting code. Never label independent inventions as ports.
- Shared observable tests must run against upstream and LiveView. LiveView-only
  tests are a separate suite. Never skip or weaken tests to manufacture parity.
- No fixture IDs in reusable behavior. No silent second state protocol.
- Record setup limitations and failures. Source review is not browser evidence.
- Short reports with exact commands and artifact paths. No production integration.

## Initial responsibilities
Coordinator: runtime, state contract, integration, scope and evidence ledger.
Harness agent: upstream React fixture and framework-independent browser scenarios.
Mapping agent: upstream dependency/behavior mapping and first bounded translation.
Reviewer: independent behavior, lifecycle, source fidelity and test review.
