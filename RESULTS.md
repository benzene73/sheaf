# Viability result

GO for a broader isolated experiment. Not ready for application migration.

Started 2026-09-07 18:15:48 UTC; acceptance review completed by18:20:38 UTC,
within the ten-minute limit. One implementation plus independent adversarial review.

Eight real-LiveView Chromium checks passed twice (implementer and reviewer),
with no captured browser JavaScript errors:

1. ArrowDown/Enter selection without navigation.
2. New query invalidates old choices immediately.
3. Out-of-order server results cannot replace newer results.
4. Actual option attribute patch preserves focus and valid active descendant.
5. Initial ArrowUp targets last option.
6. Second Escape closes native dialog.
7. First Escape closes only combobox; delayed reply cannot reopen it.
8. Server-rejected selection preserves accepted form value.

Review caught and corrected two keyboard bugs and a weak test before acceptance.
See REVIEW.md for independent findings and PORTING.md for the ownership contract.

This implementation is an independently written behavioral sketch informed by
Base UI source/tests. No paired upstream fixture or mechanical code translation
ran. It tests source-informed architecture feasibility, not porting throughput.
The first overnight milestone should establish upstream differential scenarios,
option removal/reordering, reusable IDs/multiple instances, asynchronous save
failure, reconnection and cross-browser behavior before expanding components.

Bootstrap reused installed dependencies from adjacent Kaguya; no Kaguya application
was started by this lab and no application source/dependency changed. A separate
Mix project definition is present but standalone resolution remains unverified.
Port4010 conflicted with a Windows service; fixture moved to4197 and the extra
trial server was stopped. No existing service was stopped. No commits or pushes.
