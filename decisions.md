# decisions.md
_Append-only. Date every entry. Never edit or delete._

### 2026-03-18 — Healthcare-Appropriate Color Palette for Slides
Problem: Slide deck used purple/pink gradients decoratively (progress bar, persona card accents) which feels flashy/tech-startup rather than healthcare/government
Choice: Replace decorative purple gradients with cyan-to-emerald (health green), keep purple only for semantic meanings (IMDA models, test coverage, ethics framework)
Rejected: Removing purple entirely (it serves a useful 4th semantic color for MERaLiON, counterfactuals, etc.)
Real reason: Judges are MOH, IMDA, Tencent, NUS -- healthcare and government audience expects calm, professional, trustworthy design. Purple/pink gradients signal consumer tech.
Tradeoff: Slightly less visual variety, but more professional and cohesive
Revisit when: Brand guidelines are established

### 2026-03-18 — Text Contrast Brightened for Projection
Problem: text-secondary (#8b8fa3) had 6.1:1 contrast ratio, text-muted (#5a5e72) had 3.0:1 -- both too dim for projected slides at 10m+ distance
Choice: Brightened text-secondary to #9a9eb2 (7.4:1) and text-muted to #6f7387 (4.2:1)
Rejected: Keeping original values (fine on monitors, invisible on projectors)
Real reason: Competition is judged in a physical venue with projection. Contrast that works on retina displays fails completely on projectors, especially in partially-lit rooms.
Tradeoff: Slightly less dramatic dark-mode contrast, but guaranteed readability on projection
Revisit when: If slides will only be shown on high-quality displays

### 2026-03-18 — Typography Sizes Bumped for Projection
Problem: t-title at 2rem, t-body at 0.95rem, t-section at 0.75rem were designed for monitor viewing, not 10m+ projection
Choice: Increased t-title to 2.4rem, t-body to 1.05rem, t-section to 0.85rem, and all component text sizes proportionally
Rejected: Keeping original sizes (readable on laptop, not on projected screen)
Real reason: WCAG and projection design guidelines recommend minimum 24pt for titles projected at distance. 2rem at 16px base = 32px which is borderline. 2.4rem = 38.4px is safe.
Tradeoff: Slightly tighter content fit on information-dense slides, but every line is readable
Revisit when: If content is cut and slides have more breathing room

### 2026-03-19 — Diamond Architecture Expanded from 4 Layers to 5 Layers
Problem: Safety Classifier (6-dimension response filter) was not explicitly called out as its own architectural layer, making it seem like safety only existed at the foundation level (L1)
Choice: Split into 5 layers — L1 Safety Foundation (pre-inference), L2 Statistical Engine, L3 Agentic Reasoning, L4 Safety Classifier (post-inference), L5 Cultural Intelligence
Rejected: Keeping 4 layers with Safety Classifier embedded in other layers (obscured the safety-bookends-the-pipeline design)
Real reason: Safety happens twice — deterministic rules BEFORE inference (L1) and response screening AFTER generation (L4). Making this explicit shows judges the pipeline is fail-safe at both ends.
Tradeoff: Slides have one more layer to display (slightly denser), but the safety narrative is stronger
Revisit when: Never — this accurately reflects the actual pipeline

---
## Anti-Decisions
| Approach | Why rejected | Date |
| Full file rewrite | Existing structure is solid, just needs polishing not restructuring | 2026-03-18 |
| Adding slide animations | Existing entrance animations are subtle and appropriate for healthcare -- more would be excessive | 2026-03-18 |
