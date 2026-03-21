# memory.md
_Updated: 2026-03-19 | Session #3_

## Project
Name: Bewo Health - NUS-Synapxe-IMDA AI Innovation Challenge 2026
Stack: Python backend, HTML/CSS/JS presentation slides, HMM-based clinical engine
Runtime: Docker + Python
Deploy: Singapore-only infrastructure

## Right Now
Working on: Test file cleanup complete
Status: working
Branch: N/A (not a git repo)
Next action: Verify slide deck renders correctly with 5 layers in browser

## Last Session
Built: Cleaned test files (removed debug prints from test_counterfactual_engine.py)
Broke: N/A
Fixed: 6 debug print blocks in test_counterfactual_engine.py
Discovered: Test suite is very clean -- no TODO/FIXME/HACK/XXX/stub/placeholder comments, no commented-out tests

## Open Bugs
| # | Description | File:Line | Severity | Workaround |
|---|-------------|-----------|----------|------------|

## Gotcha Log
- t-section CSS class had duplicate font-size declarations (1rem then 0.75rem) -- second value overwrites first silently
- text-secondary (#8b8fa3) only had 6.1:1 contrast on dark bg -- below 7:1 target for projection readability
- text-muted (#5a5e72) only had 3.0:1 contrast -- barely visible on projectors
- Purple/pink gradients were used decoratively (progress bar, persona card) -- not appropriate for healthcare audience

## Hot Files
slides/nusslides.html [HOT]

## External Services
| Service | Purpose | Auth | Limits |

## Session Log
### 2026-03-18 — Session #1
Built: Polished slide deck typography, contrast, color palette for projection | Broke: nothing | Fixed: contrast ratios, purple gradients, font sizing for 10m+ readability | Next: Review slides with projector test if possible

### 2026-03-19 — Session #2
Built: Updated Diamond Architecture from 4-layer to 5-layer across all files (README, EXECUTIVE_SUMMARY, Slide04Architecture.tsx, nusslides.html, agent_runtime.py, gemini_integration.py, sealion_interface.py) | Broke: nothing | Fixed: inconsistent layer counts (README said "three-layer", slides showed L1-L4) | Next: Verify slide deck renders with 5 layers

### 2026-03-19 — Session #3
Built: Audited all 11 test files for TODO/FIXME/HACK/XXX/stub/placeholder comments, debug prints, commented-out tests | Broke: nothing | Fixed: Removed 6 debug print blocks (18 print lines) from test_counterfactual_engine.py | Next: Verify slide deck renders with 5 layers
