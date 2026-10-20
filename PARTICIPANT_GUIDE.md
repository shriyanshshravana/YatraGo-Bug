# YatraGo Bug Hunting Competition — Participant Guide & Rulebook

Welcome to the **YatraGo Bug Hunting Competition**! 

This competition tests your ability to identify, analyze, reproduce, and report functional and logical software defects across a modern full-stack web application.

---

## 1. Competition Overview

- **Target Application:** YatraGo — Travel Planning and Destination Discovery Platform
- **Scope:** Full-stack web application features including:
  - Destination browsing, searching, and filtering
  - Trip creation and planning workflows
  - Trip workspace management (checklists, budget tracker, itinerary, notes)
  - User reviews and destination rating systems
  - Notification management and status updates
  - Account and profile actions
- **Objective:** Locate and document as many intentional functional bugs as possible within the allocated competition timeframe.

---

## 2. Competition Rules & Code of Conduct

To ensure fair play and system stability, all participants must strictly adhere to the following rules:

### Allowed Activities
- Functional, manual, and exploratory testing through the user interface.
- Inspecting HTTP network requests, payloads, status codes, and JSON responses using browser DevTools.
- Testing form validations, query parameters, sorting filters, pagination, and calculations.
- Using your own registered account for testing.

### Strictly Prohibited Activities (Automatic Disqualification)
1. **No Infrastructure Attacks:** Do NOT launch Denial of Service (DoS), Distributed Denial of Service (DDoS), or automated flood attacks against the frontend or backend servers.
2. **No Brute-Forcing:** Do NOT run automated brute-force tools (e.g. Burp Intruder, Gobuster, SQLmap, Hydra) against authentication, OTP, or API endpoints.
3. **No Accessing Other Users' Data:** Do NOT attempt to read, modify, or delete data belonging to other participants or organizers.
4. **No Exploiting or Attacking Third-Party Services:** Do NOT target Brevo SMTP, Cloudinary, MongoDB Atlas, Vercel, or Render infrastructure.
5. **No Credential Publication:** Do NOT share or publicly publish any API keys, tokens, session cookies, or system credentials.
6. **No Automated Crawling at High Concurrency:** Respect rate limits; excessive automated traffic will trigger IP bans.

---

## 3. How to Test YatraGo

1. **Sign Up:** Create a personal test account using your own valid email address to verify your account via OTP.
2. **Explore Destinations:** Test search queries, region filters, travel style tags, sorting by budget and duration, and pagination behavior.
3. **Plan Trips:** Create trips with various traveller counts, departure and return dates, and budgets.
4. **Manage Workspace:** Open created trips, test adding and toggling checklist tasks, add expenses in the budget tracker, duplicate trips, and filter trips on your dashboard.
5. **Review Destinations:** Test submitting ratings and reviews, and observe how average scores calculate.
6. **Check Notifications:** Observe notification badges, mark notifications as read, and delete notifications.

---

## 4. How to Report a Bug

All bug submissions must be formatted using the standard bug report template below. Incomplete or vague submissions may receive reduced points.

### Bug Report Template

```markdown
### Bug Report Submission

**Participant Name / Team Name:** [Your Name / Team]
**Date of Discovery:** [YYYY-MM-DD]
**Feature Area:** [e.g. Budget Tracker, Explore Search, My Trips, etc.]

#### 1. Bug Summary
A concise one-line summary describing the defect.

#### 2. Severity / Difficulty Assessment
- [ ] Easy (Surface-level visual or arithmetic defect)
- [ ] Medium (Filter or data presentation defect)
- [ ] Hard (Complex interaction, edge-case, or rating defect)
- [ ] Very Hard (Subtle state management or multi-condition logic flaw)

#### 3. Steps to Reproduce
1. Navigate to '...'
2. Click on '...'
3. Input value '...'
4. Observe '...'

#### 4. Expected Behavior
What the application should have done according to standard user expectations or UI labels.

#### 5. Actual Buggy Behavior
What the application actually did instead.

#### 6. Evidence & Proof
- Screenshot / Screen recording showing the issue.
- Browser console error log (if applicable).
- DevTools Network request/response payload (URL, method, status, JSON response).

#### 7. Impact Analysis
How does this bug impact the end user's experience or the reliability of the application?

#### 8. Suspected Root Cause (Optional Bonus)
If you have technical insight into why this bug happens (frontend state, backend query, arithmetic inversion, etc.), describe it here.
```

---

## 5. Scoring & Evaluation Criteria

Submissions will be scored by the organizing panel based on:
1. **Accuracy:** Does the report describe a real, reproducible intentional bug?
2. **Clarity of Reproduction Steps:** Can the judges replicate the issue in under 60 seconds following your steps?
3. **Quality of Evidence:** Are screenshots, network logs, and inputs clearly documented?
4. **Root Cause Analysis:** Bonus points are awarded for correctly identifying whether the defect is client-side or server-side, and explaining the likely code-level cause.
5. **Difficulty Tier:**
   - **Easy:** 10 Points
   - **Medium:** 20 Points
   - **Hard:** 35 Points
   - **Very Hard:** 50 Points

Good luck, and happy hunting!
