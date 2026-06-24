---
type: project
status: active
tags: [project, one-portal]
---

# 🚪 One Portal

> A purpose-built **operations platform for hotel Reservations teams** — AI email
> drafting, the full SOP library, structured training, and performance appraisals,
> all behind a single staff login.
>
> Built first for **Media One Hotel** (Dubai), now being made **scalable to all hotels
> in Roya International**. _Live and in use, but still in active development._

[[Home|← Back to Home]] · [[One Portal - Tasks|Tasks]] · [[One Portal - Decisions|Decisions]]

---

## 🎯 Objective
Turn the single-hotel Media One portal into a **multi-property platform** that any Roya
International hotel can run on — each with its own staff, content, and admins — without
rebuilding it each time.

- ✅ Working platform for Media One Reservations
- 🚧 Make it **multi-hotel / scalable** (the current focus)
- ⬜ Roll out to additional Roya International properties

## 📌 Status at a glance
- **Stage:** 🟢 Active — live for Media One, scalability in progress
- **Owner:**
- **Customer:** Roya International (starting with Media One Hotel, Dubai)
- **Next milestone:** _e.g. "Clone Media One to first second hotel"_

## 🧩 What it does (four staff modules)
| Module | Purpose |
|--------|---------|
| ✉️ **Email Drafting** | AI-powered draft replies for every reservation scenario — quotes, amendments, VIP, no-show. Paste/upload an incoming email, get a draft. |
| 📋 **Playbook** | The complete Reservations SOP library — **36 SOPs across 10 categories** (processes, work instructions, checklists). |
| 🎓 **Training Academy** | A structured **16-session** programme — theory + quiz + scenario per module — linking SOP policy to real execution. |
| ⭐ **Appraisal** | Performance appraisal using **P.E.R.F.E.C.T.** values scoring, competency reviews, and AI-written performance stories. (Admin) |

## 🛠️ Admin tools
- **Content Admin** — edit the shared library (Playbook docs + Academy modules) in one place; changes flow to both.
- **User Management** — create/manage staff logins, reset passwords, control who can sign in.
- **Hotels & Admins** _(super-admin)_ — switch between properties, **clone a hotel to launch a new one**, and assign property admins. → _This is the heart of the scalability work._

## 🏗️ How scalability works (the model)
- **Super-admin** sees all properties and can spin up a new hotel by cloning an existing one.
- Each hotel gets its own **property admins**, staff logins, and content.
- New properties inherit a working setup (SOPs, academy, templates) instead of starting blank.

## ⚙️ Tech stack
- **Front end:** static HTML pages (one per module).
- **Hosting:** Netlify.
- **Backend / data & auth:** Supabase.
- **Login gate:** Netlify edge function (`gate.js`) — locks pages, keeps `/login` public.
- **AI drafting:** Anthropic **Claude** via a Netlify serverless function.
- **Region:** Dubai (GST).

## 🗒️ Notes & meetings
_New meeting notes link in here automatically once you tag them `[[One Portal]]`._

-

## 🔗 Related
- [[One Portal - Tasks]]
- [[One Portal - Decisions]]
