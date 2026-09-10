# Hands-Off Founder Operating Model

## Goal

Founder Control Tower development should not depend on Mohammed Abid repeatedly running PowerShell commands, copying code, or manually invoking Apps Script test functions.

ChatGPT handles the technical loop wherever connected tools permit it:

`inspect -> implement -> deterministic tests -> GitHub PR -> CI -> review -> merge`

Founder involvement is reserved for explicit approval gates.

## No Founder Approval Needed

The following are internal development/control activities and may proceed without interrupting the founder:

- read-only inspection of repository and configured business data;
- architecture and implementation work on non-production branches;
- deterministic/local/no-API tests;
- security/static checks;
- documentation and regression-test updates;
- creation of pull requests;
- CI troubleshooting that does not touch production;
- cached replay and no-write previews;
- generation of recommendations and internal audit results;
- internal ACTION_QUEUE creation when it creates no external commitment.

## Yes / No Founder Approval Required

Ask one concise Yes/No question before any of these:

- production deployment or externally effective system change;
- ad budget/campaign/creative changes;
- payment, refund, transfer, payout, purchase or financial commitment;
- supplier/customer/courier message or external evidence request;
- order, courier, routing or shipment status change;
- inventory adjustment, PO, reorder, transfer or supplier commitment;
- creating paid infrastructure or accepting a recurring platform cost;
- production database migration/destructive schema change;
- booking, purchase, domain or subscription commitment;
- any action that locked governance classifies as founder-controlled.

The approval question should identify exactly what will happen, e.g.:

`Deploy reviewed commit abc123 to Apps Script production? Yes / No`

## Controlled Apps Script Deployment

GitHub branch `deploy/apps-script` is the production source-deployment gate.

Normal development never pushes production automatically.

After the founder answers **Yes** to a specific deployment:

1. confirm the approved `main` commit and CI status;
2. move `deploy/apps-script` to that exact commit;
3. GitHub Actions runs the deterministic regression suite;
4. the workflow verifies the private clasp credential exists;
5. it performs `clasp push` to the known Founder Control Tower Apps Script project;
6. it immediately performs `clasp pull`;
7. Git diff must remain clean or the workflow fails.

This updates Apps Script source/HEAD only. A separate versioned web-app deployment is a different approval-controlled operation.

## One-Time Credential Prerequisite

GitHub Actions needs one repository secret named:

`FCT_CLASP_AUTH_JSON`

It must contain the authenticated `.clasprc.json` credential already used by clasp on the founder's machine.

The credential must never be committed, pasted into source code, or stored in project documentation.

Once this one-time secret is configured, routine Apps Script source deployments no longer require local PowerShell.

## Cost Control

- default to deterministic/no-API testing;
- do not repeat paid OpenAI/Anthropic runs to debug deterministic code;
- use cached Phase-1 replay where possible;
- Codex is optional and reserved for repo-heavy implementation/debugging when it materially saves time;
- no paid infrastructure is created without founder approval.

## Failure Policy

If any test, parity check, security check, credential preflight or deployment step fails:

- stop;
- do not force deploy;
- diagnose using logs/source;
- fix on a branch;
- rerun deterministic checks;
- request a new Yes/No deployment approval only when the approved production commit changes materially.
