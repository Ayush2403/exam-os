# Apex **a study system for competitive exams ・ in the browser, in your pocket, offline ♡**

Apex reads your syllabus, reviews, mistakes, and mocks — and answers **one question** every morning: what matters most, right now. You do that one thing. Log it. Move on. The system recomputes overnight.

It's not a tracker. It's not a coach. It's an instrument.

## Features

* **Spaced repetition.** Every topic comes back on its own adaptive schedule. Rate it *Again / Hard / Good / Easy*. The interval learns your forgetting curve.
* **Error log.** Every mistake becomes a scheduled review. Comes back at 1d → 3d → 7d → 14d → 30d → 90d.
* **Weak Radar.** Topics ranked by `friction × importance × status × section bias`. Auditable math — click any topic and see the work.
* **Exam-aware intervals.** When your exam is close, long intervals compress. A topic scheduled +90d out is useless if the exam is in 30.
* **Mock tracker.** Section-wise scoring per exam structure. Weakest section highlighted. Weak tags feed the Radar.
* **Focus timer.** Pomodoro + Stopwatch + Zen mode. Blocks auto-log to the linked topic.
* **Habits.** Study hours, workout, introspection. Year heatmap. Milestones at 4/8/12h.

## Privacy

Everything lives in your browser's `localStorage`. No server. No account. No telemetry.

Optional encrypted sync between your own devices uses **AES-GCM with 250k PBKDF2 iterations**. The passphrase never leaves the browser. If you lose it, the cloud copy is unrecoverable — by design.

## Tech

* **Vanilla JS**, no framework, no build step
* Single HTML file — open it, it runs
* **PWA** — installable, works fully offline
* 551 syllabus topics preloaded for SSC, Banking, RBI
* 15 themes

## Running it locally

```bash
git clone https://github.com/Ayush2403/exam-os.git
cd exam-os
open index.html
