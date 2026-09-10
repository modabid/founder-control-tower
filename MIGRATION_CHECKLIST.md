# GitHub Migration Checklist

## Already Mirrored

- Phase-1 locked specialist snapshots/runners
- SENTINEL / ORBIT / ATLAS locked hierarchy code
- Phase-1 Final Orchestrator V5
- Meta Ads legacy/source code available in migration workspace
- Product/technical spec
- prior master handoff
- regression/smoke-test baseline

## Still Must Be Exported From Live Apps Script

The following files were documented as installed in the live runtime but were not present in the migration workspace, so this repository must **not** yet be called a byte-for-byte mirror of the Apps Script project:

- `AIConfig.gs`
- `AgentSchema.gs`
- `AgentConfig.gs`
- `AgentPrompt.gs`
- `AIClientOpenAI.gs`
- `AIClientAnthropic.gs`
- `AgentSnapshot.gs`
- `AgentRuntime.gs`
- `AgentReport.gs`
- `AgentRunner.gs`
- `Code.gs`
- `TikTokOAuth.gs`

Export these into `apps-script/runtime/` (or the appropriate module folder) before deleting/decommissioning the Apps Script project.

## Credentials

Do **not** export Script Property values into Git.

Known property names include:

- `FCT_SPREADSHEET_ID`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Meta access-token properties

Only names/placeholders belong in `.env.example`.

## GitHub Initial Setup

Recommended private repository name:

`founder-control-tower`

After creating the empty GitHub repository from the founder's account:

```bash
git remote add origin https://github.com/<OWNER>/founder-control-tower.git
git push -u origin main
```

Direct GitHub push requires an authenticated GitHub connector/CLI/session. The migration workspace that generated this baseline did not have GitHub authentication available.

## Apps Script Sync During Transition

Use `clasp` only as a transition tool if desired. Keep Apps Script source isolated under `apps-script/`; do not let Apps Script become the permanent domain layer.
