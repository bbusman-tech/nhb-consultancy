---
type: project
status: active
tags: [project, one-portal]
---

# 🚪 One Portal

> **"Everything your team needs, in ONE place."**
> A purpose-built **operations platform for hotel teams** — AI email drafting, the full
> SOP libraries, structured training, performance appraisals and team analytics, all
> behind a single staff login.
>
> Built first for **Media One Hotel** (Dubai), now growing in **two directions**:
> **across hotels** (scalable to all of Roya International) and **across departments**
> (Reservations → Sales → F&B). _Live and in active development._

[[Home|← Back to Home]] · [[One Portal - Tasks|Tasks]] · [[One Portal - Decisions|Decisions]]

---

## 🎯 Objective
Grow the single-hotel, single-team Media One portal into a **multi-property, multi-department
platform** that any Roya International hotel — and any team within it — can run on, each with
its own staff, content and admins, without rebuilding it each time.

- ✅ Working platform for Media One Reservations
- 🚧 **Scale across hotels** (clone a hotel) — current focus
- 🚧 **Expand across departments** (Sales & F&B playbooks/academies added)
- ⬜ Roll out to additional Roya International properties

## 📌 Status at a glance
- **Stage:** 🟢 Active — live for Media One, scaling in progress
- **Owner:**
- **Customer:** Roya International (starting with Media One Hotel, Dubai)
- **Next milestone:** _e.g. "Clone Media One to first second hotel"_
- **Last notes refresh:** 30 Jun 2026

## 🧩 What it does — staff modules
| Module | Purpose |
|--------|---------|
| ✉️ **Email Drafting** | AI-powered draft replies for every reservation scenario — quotes, amendments, VIP, no-show. Paste/upload an incoming email, get a draft. Now with a **shared team log + CSV export**. |
| 📋 **Playbooks** | Complete SOP libraries — **Reservations** (36 SOPs / 10 categories), plus **Sales** and **F&B** libraries (processes, work instructions, checklists). |
| 🎓 **Training Academy** | A structured **16-session** programme — theory + quiz + scenario per module — from kick-off to certification, linking SOP policy to real execution. |

## 👔 Leadership & admin tools
| Tool | Purpose |
|------|---------|
| ⭐ **Appraisal** | Performance appraisal using **P.E.R.F.E.C.T.** values scoring, competency reviews, and AI-written, print-ready performance stories. |
| 📊 **Performance Hub** _(new)_ | A leader sees the people **under them** — training progress, appraisal status, and (Reservations) SLA adherence — scoped to exactly their span of control. Agent performance scoring. |
| 🛠️ **Content Admin** | Edit the shared library (Playbook docs + Academy modules) in one place; changes flow to both. |
| 👥 **User Management** | Create/manage staff logins, reset passwords, control who can sign in. |
| 🏨 **Hotels & Admins** _(super-admin)_ | Switch between properties, **clone a hotel to launch a new one**, and assign property admins. → _The heart of the multi-hotel scalability work._ |

## 🏗️ How it scales (the model)
- **Across hotels:** a super-admin can spin up a new property by **cloning** an existing one; each hotel gets its own admins, logins and content.
- **Across departments:** the Playbook + Academy pattern is repeated per department — **Reservations, Sales, F&B** — so new teams get a ready-made structure.
- **Scoped & secure:** team data (profiles, academy progress, appraisals, SLA log) is locked per-user (row-level security), so leaders only ever see their own people.

## ⚙️ Tech stack
- **Front end:** static HTML pages (one per module/department).
- **Hosting:** Netlify.
- **Backend / data & auth:** Supabase (with row-level security on team data).
- **Serverless functions:** content, academy, appraisal, **team** (Performance Hub), user creation, and the Claude email/AI function.
- **Login gate:** Netlify edge function (`gate.js`) — locks pages, keeps `/login` public.
- **AI:** Anthropic **Claude** (email drafting + performance stories).
- **Region:** Dubai (GST).

## 🗒️ Notes & meetings
_New meeting notes link in here automatically once you tag them `[[One Portal]]`._

-

## 🔗 Related
- [[One Portal - Tasks]]
- [[One Portal - Decisions]]
