# NovaTask 
Smart Team Task Manager Plan, track, and automate your team’s work with AI-assisted workflows, real-time updates, and beautiful dashboards. 
> “Focus on outcomes, not busywork.” 

## Highlights - Adaptive boards (Kanban/Sprint) with swimlanes and WIP limits - Real-time collaboration with presence and comments 
- AI summaries, standup notes, and backlog grooming - Powerful filters, saved views, and custom fields 
- ## AI Features 
- `LLM` – draft tickets, acceptance criteria, and test cases 
- `TTS` – speak meeting recaps for async teams 
- `Text-to-Image` – generate cover art for releases 
- `NER` – auto-tag intents like `bug`, `feature`, `chore` 
- ## Quick Start 
1. Create a workspace and invite your team 
2. Import issues from GitHub/Jira
3. Choose a template: Kanban or Scrum 
4. Start your first sprint 

## Example Workflow 
- `Backlog` → `In Progress` → `Review` → `Done` 
- Required fields: `priority`, `story points`, `owner` 

## Tech Stack
- Frontend: `React` `Vite` `TypeScript` 
- Backend: `Node.js` `Postgres` `Prisma` 
- Infra: `Docker` `Fly.io` `Cloudflare` 
- AI: `OpenAI` `Whisper` `Stable Diffusion` 

## Shortcuts 
- `g` `b` – Go to board 
- `n` – New issue 
- `f` – Quick filter 

## Demo Links 
- Live: https://example.com 
- API Docs: https://api.example.com/docs 
 
## Roadmap 
- [x] Kanban boards 
- [x] Realtime comments 
- [ ]  Gantt + dependencies 
- [ ]  SLA policies and alerts 
- [ ] Advanced automations 

## Release Metrics 
| Metric | Current | Target |
 |:-----:|:------:|:-----:| 
| Lead Time | 1.8d | 1.0d | | Cycle Time | 7.2h | 5.0h | | On-Time | 86% | 95% | 
## Install (CLI) 
```bash npm i -g novatask-cli novatask login novatask init ``` 
## Example Issue (JSON)
```json { "title": "Improve sprint burndown", "type": "feature", "storyPoints": 5, "tags": ["analytics", "burndown"], "acceptanceCriteria": [ "Show ideal vs actual scope", "Highlight scope creep", "Export as CSV/PNG" ] } ``` 
## Notes 
- Use backticks for tags like `bug`, `feature`, `LLM`. 
- Add a blank line before lists to ensure bullet rendering.