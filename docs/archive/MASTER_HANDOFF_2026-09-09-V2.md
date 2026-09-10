# Founder Control Tower — Master Handoff
**Date:** 09 Sep 2026  
**Status:** Core AI runtime installed and first SENTINEL → ORBIT → ATLAS smoke test passed.

---

## 1. Purpose

Founder Control Tower is a founder-level decision system, not just a dashboard.

It should answer:

1. What changed?
2. What is wrong?
3. Where are we losing money?
4. What opportunity should we act on?
5. What should Abid do today?

Founder-facing priority states:

- 🔴 ACT NOW
- 🟡 WATCH
- 🟢 OPPORTUNITY
- ⚪ NORMAL / no noise

Architecture:

**Sources → deterministic Raw/Normalized/Control → Economics/KPI → Alert/Decision → Specialist Agents → SENTINEL → ORBIT → ATLAS → Founder**

Core rule: **code calculates, AI interprets/recommends.**

No AI-calculated authoritative financial arithmetic.

---

## 2. Main Workbook

**Founder Control Tower - MVP**

Spreadsheet ID:

`1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU`

Important constraint:

The workbook is at/near the Google Sheets 10 million cell limit.  
Do **not** create new tabs unless cells are first reduced. Store new config/registry blocks inside existing `CONFIG`.

---

## 3. Permanent Agent Architecture — 15 Agents

1. **ATLAS** — Founder Agent
2. **ORBIT** — Control Tower Supervisor / Chief of Staff
3. **LEDGER** — Finance & Cash
4. **SCALE** — Ads & Growth
5. **ROUTE** — Logistics & Courier
6. **STOCK** — Inventory
7. **RECOVER** — Customer Recovery / Ops
8. **SCOUT** — Product Intelligence
9. **SOURCE** — Procurement / Sourcing
10. **VENTURE** — Portfolio / Projects
11. **SHIELD** — VAT / Compliance
12. **SENTINEL** — Data Quality & Audit watchdog
13. **UPTIME** — Website / Portal Reliability
14. **INBOX** — Email & Inbox
15. **NOVA** — Personal Assistant

Reporting chain:

**Domain Agent → ORBIT → ATLAS → Abid**

SENTINEL audits/challenges where relevant.

---

## 4. Locked Governance Rules

### Agent autonomy
Agents are **analysis / recommendation only** by default.

No autonomous:

- ad pause/scale
- payments/refunds
- courier/order status changes
- inventory changes
- production deploys
- email/message sending
- calendar changes
- bookings
- purchases
- moving money

### Approval chain

**Domain Agent → ORBIT → ATLAS → Abid**

Abid remains final authority.

### Ambiguity

**ASK, DO NOT GUESS**

### Internal investigation vs approval

Internal analysis/reconciliation does **not** require founder approval.

Approval is required for:

- external contact
- spending
- ad changes
- purchase/replenishment
- payment/refund
- deployment
- external messages
- commitments

### Source precedence

**Deterministic source/control data → current deterministic ALERTS → Founder Snapshot → AI interpretation**

Important:

`DATA_QUALITY` being empty **does not mean data is clean**.

Current deterministic OPEN/ACTIVE alerts still govern if relevant.

---

## 5. Phase-1 Agents

Current Phase-1:

- AG001 ATLAS
- AG002 ORBIT
- AG003 LEDGER
- AG004 SCALE
- AG005 ROUTE
- AG006 STOCK
- AG012 SENTINEL

Phase-2 later:

- RECOVER
- SCOUT
- SOURCE
- VENTURE
- SHIELD
- UPTIME
- INBOX
- NOVA

---

## 6. Runtime / Model Routing

Current routing:

### ATLAS
- Primary: `gpt-5.6-sol`
- Standard: HIGH
- Deep/Critical: XHIGH when needed
- Challenger: `claude-opus-5`

### ORBIT
- Primary: `gpt-5.6-sol`
- Standard: MEDIUM
- Deep: HIGH
- Challenger: `claude-sonnet-5`

### LEDGER
- Primary: `gpt-5.6-terra`
- Escalation: `gpt-5.6-sol`
- Challenger: `claude-sonnet-5`

### SCALE
- Primary: `gpt-5.6-terra`
- Escalation: `gpt-5.6-sol`
- Challenger: `claude-sonnet-5`

### ROUTE
- Primary: `gpt-5.6-luna`
- Deep: `gpt-5.6-terra`
- Challenger: `claude-sonnet-5`

### STOCK
- Primary: `gpt-5.6-luna`
- Deep: `gpt-5.6-terra`
- Challenger: `claude-sonnet-5`

### SENTINEL
- Primary: `claude-sonnet-5`
- Deep/escalation: `gpt-5.6-sol`

Runtime policy:

- AI runs only on delta / scheduled brief / founder query / pending approval / audit
- if nothing changed, skip/reuse
- structured bounded JSON handoffs
- no endless agent chats
- max two hierarchy passes
- confidence = HIGH / MEDIUM / LOW
- no fake percentages
- raw PII blocked/redacted
- API failure: retry then fallback
- semantic disagreement: challenger + ORBIT
- SENTINEL FAIL due missing/bad data → HOLD / ASK, not model voting

---

## 7. Step 5 — AI Runtime Installed

The following Apps Script files were added successfully without replacing existing `Code.gs` or `TikTokOAuth.gs`:

1. `AIConfig.gs`
2. `AgentSchema.gs`
3. `AgentConfig.gs`
4. `AgentPrompt.gs`
5. `AIClientOpenAI.gs`
6. `AIClientAnthropic.gs`
7. `AgentSnapshot.gs`
8. `AgentRuntime.gs`
9. `AgentReport.gs`
10. `AgentRunner.gs`

Existing files remain untouched:

- `Code.gs`
- `TikTokOAuth.gs`

Script Properties configured:

- `FCT_SPREADSHEET_ID`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

Never put API keys in Sheets/chat/code.

---

## 8. API / Runtime Tests Completed

### No-API test

`testFctPhase1NoApi()` passed.

Verified:

- spreadsheet ID set
- OpenAI key set
- Anthropic key set
- 7 Phase-1 agents load
- Founder snapshot loads
- Action Queue loads
- Alerts load
- Data Quality loads
- Report History headers ready

### OpenAI test

`testFctOpenAIConnection()` passed.

Model:

`gpt-5.6-sol`

Structured output working.

### Anthropic test

Initial issue:

Claude returned `AG012-SENTINEL` instead of exact `AG012`.

Fix added to prompt:

> agent_id must exactly equal the assigned Agent ID.

Schema was also hardened to exact enum for expected Agent ID.

Anthropic connection test then passed successfully with:

`claude-sonnet-5`

---

## 9. Runtime Hardening Changes Made

### Exact Agent ID enforcement

`AgentSchema.gs` was changed so:

`fctAgentResultSchema_(expectedAgentId)`

can enforce:

`agent_id = exact expected ID`

Both OpenAI and Anthropic clients now pass `opts.agentId` into schema generation.

### Anthropic max-token handling

`AIClientAnthropic.gs` detects:

`stop_reason === 'max_tokens'`

and raises a structured schema failure instead of generic invalid JSON.

### Compact repair behavior

Agent repair prompt now demands:

- max 4 findings
- max 3 recommendations
- summary max 100 words
- finding detail max 60 words
- no repeated evidence/methodology

Repair retry uses larger token cap.

### Cross-provider failover

If structured output repair still fails:

- retry larger output budget
- cross-provider fallback allowed
- fallback gets larger token limit

### OpenAI incomplete output handling

OpenAI `status === incomplete` with:

`reason === max_output_tokens`

is treated as schema/output completion failure so the same provider gets a larger compact repair retry before cross-provider fallback.

---

## 10. First Real Smoke Test — PASSED

Function:

`runFctPhase1SmokeTest()`

Chain:

**SENTINEL → ORBIT → ATLAS**

Result successfully generated a Founder Brief.

Founder Brief included:

### Group pulse
- Orders: 658
- Finalized delivery: 81.7%
- Delivered revenue: AED 20,650.25207
- Gross contribution: AED 12,709.00207
- Meta spend: AED 6,701.85
- Real Operating Profit: PENDING TIKTOK API
- Audit: FAIL
- Confidence: HIGH

### ACT NOW
1. Final P&L blocked by missing TikTok spend
2. Last Mile below 70% delivery gate + cash exposure
3. Inventory mismatches + critical stock risk

### Opportunity
PLG632 strong provisional contribution but held due unresolved TikTok/country split/inventory mismatch.

### CEO priorities
1. Complete TikTok reporting after approval
2. Fix Last Mile + cash
3. Reconcile/replenish critical stock

---

## 11. Live Alert Cross-Check

The AI output was verified against current `ALERTS`.

Current deterministic OPEN inventory reconciliation ACT NOW alerts include:

- PLG593 — +40 pickup mismatch
- PLG617 — +50
- PLG623 — +100
- PLG628 — +30
- PLG629 — +30
- PLG632 — +25
- PLG636 — +48

Current critical stock alerts include:

- UAE PLG597 ~1.9 days
- UAE PLG609 — 0 stock days
- Kuwait PLG597 — 0 stock
- Kuwait PLG617 ~1.8 days

Therefore the smoke-test inventory warning was not hallucinated.

---

## 12. Current Founder Snapshot

Current workbook founder snapshot around `FOUNDER_REPORT!A65:C91`:

- Orders: 658
- Finalized delivery success: ~81.7%
- Delivered revenue: AED 20,650.25
- Gross contribution: AED 12,709.00
- Meta spend: AED 6,701.85
- Contribution after Meta: AED 6,007.15
- MTD accrued payroll + OPEX + core SaaS: AED 6,799.41
- Operating profit before TikTok: approx -AED 792.26
- Real Operating Profit: `PENDING TIKTOK API`

Main ACT NOW:

- TikTok spend missing
- Last Mile finalized success 64.1%
- Last Mile cash outstanding AED 1,240.22
- critical stock

Main opportunity:

- PLG632 strong after-Meta provisional contribution
- C3X finalized success ~88.9%

---

## 13. Important Business Rules

### Profit

Gross Contribution:

Delivered COD revenue  
− delivered product cost  
− delivery/fulfillment  
− RTO

Real Contribution:

Gross Contribution  
− Meta  
− TikTok  
− Google when active  
− direct variable payouts/costs

Operating Profit:

Real Contribution  
− salaries  
− warehouse/rent  
− software  
− fixed OPEX

Cash and profit remain separate.

### Courier

Finalized delivery success:

`(Delivered + Paid) / (Delivered + Paid + RRTO)`

Only terminal outcomes count.

Pending / transit / OFD / failed attempt / on hold are excluded.

`Paid` is remittance/cash concept; never infer Delivered → Paid.

### Scale

Never scale from ROAS alone.

Scale gates include:

- delivery-adjusted economics
- all active ad channels included
- delivery success
- stock days
- cash control
- data freshness

Last Mile gate:

`>=70% finalized success`

### Inventory

Velocity:

`max(7-day avg pickup, 14-day avg pickup)`

RRTO stock is not available until physically received.

---

## 14. Telegram Architecture — Approved, Not Yet Built

Telegram will be a **mobile companion**, not source of truth.

Main source of truth remains Founder Control Tower Web App.

Telegram future use:

- urgent alerts
- `/brief`
- `/alerts`
- `/finance`
- `/logistics`
- ask ATLAS
- ask specialist agents
- approvals

Security:

- private bot
- Abid-only allowlisted Telegram user/chat ID
- reject all other senders
- bot token stored server-side
- no secrets
- no full banking details
- minimize customer PII
- high-risk actions require second confirmation, preferably via web app

Telegram is intentionally postponed until core runtime is stable.

---

## 15. INBOX Agent

Codename:

**INBOX**

Scope:

- Gmail / Outlook read
- classify urgency/domain
- extract deadlines/amounts/issues
- flag follow-ups
- draft recommended replies

Default:

**READ / ANALYZE / DRAFT ONLY**

No send/forward/archive/delete/business-impacting changes without Abid approval.

---

## 16. NOVA — Personal Assistant

Codename:

**NOVA**

Scope:

- calendar planning
- conflicts
- ideas capture/retrieval
- personal preferences/context
- travel research
- visa planning
- research/comparisons
- reminders/follow-ups
- daily planning

Business matters route to domain agents.

No booking/payment/calendar changes/messages without approval.

---

## 17. Website Reliability Agent

Codename:

**UPTIME**

Future monitoring:

- website availability
- latency
- login
- signup
- checkout
- COD form
- order creation
- API/webhooks
- DB health
- SSL/domain
- critical journeys

Before activation, create `WEBSITE_REGISTRY`.

Do not assume full website list.

---

## 18. Remaining Work — Correct Order

### Immediate Next: Step 6 — Full Phase-1 Runtime

Build:

**LEDGER + SCALE + ROUTE + STOCK → SENTINEL → ORBIT → ATLAS**

This is the next task.

Goal:

Specialists independently inspect their own domain instead of ATLAS merely interpreting the current Founder Snapshot.

### After Step 6

1. Productionize Founder Brief
   - reduce unnecessary approvals
   - filter duplicate/noisy alerts
   - enforce source precedence
   - concise founder output

2. TikTok API
   - wait for app approval
   - complete OAuth/token exchange
   - pull live spend
   - write RAW_AD_SPEND
   - unlock final Real Contribution / Operating Profit

3. Supabase → Sheet scheduled sync
   - read-only
   - PII-free
   - courier status refresh

4. Resolve open data/business issues
   - C3X 503 vs ~501 mismatch
   - Last Mile 64.1%
   - AED 1,240.22 Last Mile cash
   - PLG632 UAE/Kuwait spend split
   - OTO courier cost
   - TFM settlement
   - corrupted VAT config
   - P&L cutoff/accrual alignment

5. UPTIME / website registry

6. INBOX

7. NOVA

8. Telegram

9. Founder Control Tower Web App

10. Phase-2 agent playbooks/runtime

---

## 19. Important Open Items

- TikTok app approval pending
- Google Ads currently inactive
- Last Mile scale gate currently failed
- Last Mile cash outstanding
- critical stock/reconciliation issues
- C3X count mismatch
- PLG632 country allocation unresolved
- P&L cutoff synchronization needed
- Supabase scheduled sync not built
- Website registry not built
- Telegram not built
- Web App not built
- Phase-2 agents not activated

---

## 20. Immediate Next Chat Prompt

Paste this in the next chat:

> Continue Founder Control Tower from the attached Master Handoff. Do not restart architecture discovery or redesign approved decisions. The Step 5 Apps Script AI Runtime is installed, OpenAI and Claude connection tests passed, and the first SENTINEL → ORBIT → ATLAS smoke test passed. Continue directly with **Step 6: Full Phase-1 runtime — LEDGER + SCALE + ROUTE + STOCK → SENTINEL → ORBIT → ATLAS**. Work one logical step at a time, preserve all existing Code.gs/TikTokOAuth/runtime files, never ask me to paste API secrets, and keep all agents recommendation-only unless I explicitly approve execution.

---

## 21. Standing Working Rule

If the chat becomes too long or context quality may degrade:

1. Stop before continuing major implementation.
2. Create/update a clean Markdown handoff.
3. Preserve exact completed work, code/runtime changes, live state, locked decisions, open issues, and immediate next step.
4. Start the next chat from that handoff rather than re-discovering architecture.

