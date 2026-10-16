# Claim Smarter — Prompts History & Project Changelog

This document collates all the master prompts and iterative engineering prompts used to build **Claim Smarter**, an expense claim processing platform that converts receipt images into approval-ready finance claim PDFs with multi-currency conversions and OCR.

---

## Table of Contents
1. [Prompt 1: Front End Only (Step 1 Master Prompt)](#prompt-1-front-end-only-step-1-master-prompt)
2. [Prompt 2: GitHub Repository Setup & Push](#prompt-2-github-repository-setup--push)
3. [Prompt 3: Serverless Currency Conversion API (`/api/conversion.ts`)](#prompt-3-serverless-currency-conversion-api-apiconversionts)
4. [Prompt 4: Push Currency API to GitHub](#prompt-4-push-currency-api-to-github)
5. [Prompt 5: Serverless Claude Vision OCR API (`/api/OCR.ts`)](#prompt-5-serverless-claude-vision-ocr-api-apiocrts)
6. [Summary of Architecture & Endpoints](#summary-of-architecture--endpoints)

---

## Prompt 1: Front End Only (Step 1 Master Prompt)

### Prompt Text
```text
MASTER PROMPT — Claim Smarter · STEP 1: FRONT END ONLY

ROLE
You are a senior React developer building the front end of Claim Smarter, a Vite + React app that will be deployed on Vercel. The person you are working with does not code: explain each step in plain English and ask before installing anything.

GOAL
Build the Claim Processing front end: staff upload receipt images, check a review table, and download an approval-ready claim PDF for finance.
This step is FRONT END ONLY. Do not create anything under api/. The backend comes in step 2.

SUB-GOALS
Before writing code, list these sub-goals back to me and explain how each one will be implemented.

1. Home Screen
   - Mobile-first Claim Smarter dashboard.
   - Upload multiple receipt images (JPG, PNG, HEIC, PDF), by tap or drag-and-drop.
   - Show each receipt as a card with thumbnail and status: Reading / Ready / Needs a look / Failed.
   - Fully responsive on phones.

2. Review Screen
   - One editable row per receipt: Date | Receipt no. | Expense item | Currency | Amount | Amount (SGD) | Rate used.
   - Show the receipt image beside its row.
   - Highlight rows with empty fields or low confidence.
   - If currency is SGD, Amount (SGD) = Amount. Otherwise Amount (SGD) stays empty until a rate arrives or the user types it.
   - The "Create claim PDF" button stays off until every row is complete.

5. Claim Details
   - Short form: staff name, department, claim period. Kept in the browser only.

6. Claim PDF
   - Generate in the browser (e.g. jsPDF). No server storage.
   - Page 1: staff name, department, claim period, date of submission, claim lines table, total in SGD, blank lines for claimant signature, approver name and approver signature.
   - Following pages: each receipt image, labelled with its line number.
   - File name: YYYY-MM-DD-claim-<staffname>.pdf

7. Footer
   - Display: "Data: Frankfurter · Receipt reading: Google Gemini"

OUTPUT
Create:
- Vite + React project
- src/App.jsx
- src/components/: UploadArea, ReceiptList, ReceiptCard, ClaimDetailsForm, ReviewTable, ClaimPdfButton, Footer
- src/lib/api.js (all network calls)
- src/lib/pdf.js (PDF generation)
- .gitignore containing:
    node_modules
    dist
    .env*
    !.env.example
Include loading, error and empty states on every screen.
At the end, list every file created or modified, and tell me how to run it on my Mac (npm run dev).

GUARDRAILS
- No api/ folder, no API keys, no .env values in this step.
- Never write keys into any file.

CONTEXT
Customers: SMEs, startups, NGOs, staff who travel and claim often, finance teams who receive claims.
Why they pay: less manual receipt handling; approval-ready claims in fewer steps.
Success metric: % of receipts turned into approval-ready claim lines without manual re-entry.
Claim table columns match the company's existing claim form: Date | Receipt/Invoice no. | Expense Items | Currency | Amount | Amount (SGD).
```

### Deliverables & Output
- **`src/App.jsx`**: Main dashboard with step tabs, status pills, and local session management.
- **`src/components/UploadArea.jsx`**: Drag-and-drop file uploader supporting multi-file uploads (JPG, PNG, HEIC, PDF) and 1-click sample demo receipts.
- **`src/components/ReceiptCard.jsx`**: Visual status cards (*Reading*, *Ready*, *Needs a look*, *Failed*) with clickable thumbnail zooms.
- **`src/components/ReceiptList.jsx`**: Responsive receipt grid with status filter tabs.
- **`src/components/ClaimDetailsForm.jsx`**: Local-storage form for staff name, department, claim period, and submission date.
- **`src/components/ReviewTable.jsx`**: Inline-editable claim line items with side-by-side receipt image inspection and automatic SGD currency conversion.
- **`src/components/ClaimPdfButton.jsx`**: Form validation gate locking PDF export until every row is complete.
- **`src/components/ReceiptModal.jsx`**: High-resolution image zoom modal for verifying details.
- **`src/components/Footer.jsx`**: Attribution footer for Frankfurter and Gemini.
- **`src/lib/pdf.js`**: Client-side jsPDF generator creating Page 1 summary report + subsequent individual voucher attachment pages.
- **`.gitignore`**: Configured to ignore `node_modules`, `dist`, and `.env*` while preserving `!.env.example`.

---

## Prompt 2: GitHub Repository Setup & Push

### Prompt Text
```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@https://github.com/flourrey/Claim-Master.git
```

### Deliverables & Output
- Initialized local Git repository on branch `main`.
- Staged all source files while respecting `.gitignore`.
- Created initial commit: `feat: initial frontend build for Claim Smarter`.
- Configured remote origin and pushed to GitHub repository `flourrey/Claim-Master`.
- Sanitized Git configuration to ensure access tokens are not saved in plaintext.

---

## Prompt 3: Serverless Currency Conversion API (`/api/conversion.ts`)

### Prompt Text
```text
Add a serveless connection that converts the currency of the values on the invoice data using the following endpoints:
store this in the /api folder(project root level) not the src folder
include the /health.ts and /conversion.ts within that subfolder
Do not hardcode any key, i will include them later

GET https://api.frankfurter.dev/v2/rates?base=SGD&quotes=USD,EUR,MYR,IDR,VND
```

### Deliverables & Output
- **`/api/conversion.ts`**:
  - Connects to Frankfurter v2 rates endpoint: `https://api.frankfurter.dev/v2/rates?base=SGD&quotes=USD,EUR,MYR,IDR,VND`.
  - Supports **batch invoice item conversion** (POST) and **single amount conversion** (GET/POST).
  - Handles rate reciprocals: accurately converts foreign currencies (USD, EUR, MYR, IDR, VND) to SGD.
  - Zero hardcoded keys: reads optional API keys from `process.env.FRANKFURTER_API_KEY` or `process.env.CURRENCY_API_KEY`.
- **`/api/health.ts`**:
  - Health check endpoint returning service status, uptime, environment, and registered endpoints.
- **`server.ts`**:
  - Mounted `/api/conversion` and `/api/health` with Vite development middleware for local testing and Vercel serverless deployment.
- **`src/lib/api.js`**:
  - Connected frontend exchange rate fetcher to `/api/conversion` with automatic offline/direct fallback.

---

## Prompt 4: Push Currency API to GitHub

### Prompt Text
```text
git push
```

### Deliverables & Output
- Staged `api/conversion.ts`, `api/health.ts`, `server.ts`, and updated `package.json` / `src/lib/api.js`.
- Committed: `feat: add serverless /api/health and /api/conversion endpoints with Frankfurter v2 rates`.
- Pushed branch `main` to `https://github.com/flourrey/Claim-Master.git`.

---

## Prompt 5: Serverless Claude Vision OCR API (`/api/OCR.ts`)

### Prompt Text
```text
Add a serverless connection that reads the receipt through OCR using the following endpoints:
store this in the /api folder(project root level) not the src folder
include the /health.ts and /OCR.ts within that subfolder
Do not hardcode any key, i will include them later


Accepted image types: JPEG, PNG, GIF and WebP. HEIC photos from iPhones need converting to JPEG first.
Model: claude-haiku-5-5

POST https://api.anthropic.com/v1/messages # x-api-key: <ANTHROPIC_API_KEY> # anthropic-version: 2023-06-01 # content-type: application/json {"model":"claude-haiku-5-5","max_tokens":1024,"system":"You read expense receipts for a claims app. Return ONLY valid JSON, no other text. Never guess: if a field is unclear or missing, use null. currency must be a 3-letter ISO code (e.g. SGD, JPY, THB). date must be YYYY-MM-DD. total is the final amount paid, as a number without symbols. confidence is high, medium or low.","messages":[{"role":"user","content":[{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":"<BASE64_OF_RECEIPT_IMAGE>"}},{"type":"text","text":"Read this receipt and return exactly this JSON shape: {\"date\":\"YYYY-MM-DD\",\"receipt_no\":\"string or null\",\"merchant\":\"string or null\",\"description\":\"short item summary or null\",\"currency\":\"ISO code or null\",\"total\":0,\"confidence\":\"high|medium|low\"}"}]}]}
```

### Deliverables & Output
- **`/api/OCR.ts`**:
  - Serverless function integrating with `POST https://api.anthropic.com/v1/messages`.
  - Configured for `model: claude-haiku-5-5` and `max_tokens: 1024`.
  - Supports image media types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
  - Enforces the strict JSON return shape:
    ```json
    {
      "date": "YYYY-MM-DD",
      "receipt_no": "string or null",
      "merchant": "string or null",
      "description": "short item summary or null",
      "currency": "ISO code or null",
      "total": 0,
      "confidence": "high|medium|low"
    }
    ```
  - Zero hardcoded keys: reads dynamically from `process.env.ANTHROPIC_API_KEY` or `x-api-key` header.
- **`/api/health.ts`**: Updated to include OCR service discovery.
- **`server.ts`**: Configured with a 25MB request payload limit to comfortably handle high-resolution mobile camera uploads.
- **`src/lib/api.js`**: Frontend `parseReceiptImage` upgraded to invoke `/api/OCR`, automatically translating Claude's structured output into claim line items with graceful fallback.
- **Git Push**: Committed and pushed to `main` on GitHub.

---

## Prompt 6: Dummy User Login & Department Claim Guidelines

### Prompt Text
```text
create a simple sleek dummy user log in page

1. the company will have a personnel list to know which department the staff is from
2. the company will have guideline on what kind of receipt can be claimed by which department. just for testing, R&D can only claims materials. Sales can only claim meals. Joern is from sales, Jiatong is from R&D

Make the app mobile based friendly without the interface too cluttered
```

### Deliverables & Output
- **`src/lib/personnel.js`**:
  - Company Personnel Roster:
    - **Joern** (Senior Sales Director, Department: **Sales**, Policy: **Meals Only**)
    - **Jiatong** (Principal Research Engineer, Department: **R&D**, Policy: **Materials Only**)
  - `checkExpensePolicy(department, expenseItem)`: Validates claim line items against department rules.
- **`src/components/LoginPage.jsx`**:
  - Mobile-first, sleek dummy login page with 1-tap persona sign-in and department policy badges.
- **Dashboard Integration**:
  - Sticky header displays active staff profile, department, and 1-tap persona switcher (`Joern (Sales)` <-> `Jiatong (R&D)`).
  - Pre-populates staff name and department in claim form.
  - Receipt Cards and Review Table dynamically flag policy compliance:
    - *Joern (Sales)*: Meals (e.g. Tokyo Bistro Dinner) are approved `✓ Policy OK: Meals`; Materials trigger `⚠️ Guideline Alert: Sales can only claim Meals`.
    - *Jiatong (R&D)*: Materials (e.g. Arduino Sensors) are approved `✓ Policy OK: Materials`; Meals trigger `⚠️ Guideline Alert: R&D can only claim Materials`.
- **Git Push**: Committed and pushed to `main` on GitHub.

---

## Prompt 7: Receipt Modal Close & Title Wrapping Fix

### Prompt Text
```text
when i press click to view, sometimes the X to exit is not there because the title is too long and not wrapped. help me solve that
```

### Deliverables & Output
- **`src/components/ReceiptModal.jsx`**:
  - Added `flex-1 min-w-0 break-words line-clamp-2` to the title container so long merchant names/filenames wrap cleanly.
  - Added `shrink-0` to the `X` button with background pill to guarantee it is never compressed or pushed off screen.
  - Added click-outside-to-close on backdrop and `Escape` key listener.

---

## Prompt 8: "Talk to Us" Tab with Disqus Forum & SSO

### Prompt Text
```text
createa tab "talk to us" and embed a disqus forum using the following:

1. discussion:
import { DiscussionEmbed } from 'disqus-react';

<DiscussionEmbed
    shortname='claim-master'
    config={
        {
            url: this.props.article.url,
            identifier: this.props.article.id,
            title: this.props.article.title,
            language: 'en' 
        }
    }
/>
import { CommentCount } from 'disqus-react';

2. Comment count
<CommentCount
    shortname='claim-master'
    config={
        {
            url: this.props.article.url,
            identifier: this.props.article.id,
            title: this.props.article.title,
        }
    }
>
    {/* Placeholder Text */}
    Comments
</CommentCount>

3. SSO
import { DiscussionEmbed } from 'disqus-react';

<DiscussionEmbed
    shortname='claim-master'
    config={
        {
            url: this.props.article.url,
            identifier: this.props.article.id,
            title: this.props.article.title,
            language: 'en',
            remoteAuthS3: '', // Generated by your server (see https://help.disqus.com/customer/en/articles/1717160-integrating-single-sign-on for more details)
            apiKey: '', // Your API key that can be generated or referenced at https://disqus.com/api/applications/ 
            sso: {
                name: 'SampleNews',
                button: 'http://example.com/images/samplenews.gif',
                icon: 'http://example.com/favicon.png',
                url: 'http://example.com/login/',
                logout: 'http://example.com/logout/',
                profile_url: 'http://example.com/profileUrlTemplate/{username}',
                width: '800',
                height: '400',
            }
        }
    }
/>
```

### Deliverables & Output
- **`src/components/TalkToUs.jsx`**:
  - Implemented `DiscussionEmbed` and `CommentCount` from `disqus-react`.
  - Configured with `shortname: 'claim-master'`.
  - Configured article URL, identifier, title, and language (`'en'`).
  - Added Single Sign-On (SSO) configuration structure dynamically passing active user details (`Joern (Sales)` / `Jiatong (R&D)`).
- **Navigation Integration**:
  - Added **"3. Talk to Us"** tab to the top navigation in `src/App.jsx`.
- **Git Push**: Committed and pushed to `main` on GitHub.

---

## Prompt 9: Fix Disqus Comment Section Loading & Fallback

### Prompt Text
```text
the comment section is not appearing
```

### Deliverables & Output
- **Disqus Config Correction**:
  - Removed empty `remoteAuthS3: ''` and `apiKey: ''` strings which cause Disqus to fail HMAC signature checks and abort iframe rendering.
  - Added `developer: 1` parameter for localhost and preview domains so Disqus allows development environments.
- **Ad-Blocker & Tracking Protection Handling**:
  - Added automatic detection: if third-party privacy shields (e.g. Brave Shields, uBlock Origin, or Safari tracking prevention) block `disqus.com` third-party cookies, an informative guidance card appears with a direct link to the discussion forum.
- **Direct Staff Feedback Box**:
  - Added an in-app direct messaging box so team members can submit inquiries directly to the finance team without relying on external scripts.
- **Git Push**: Committed and pushed to `main` on GitHub.

---

## Prompt 10: Fix "Script error." Trapping Cross-Origin Embed Errors

### Prompt Text
```text
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: Script error.
[AIS_METADATA_SECTION_END]
```

### Deliverables & Output
- **Global Cross-Origin Error Interceptor (`src/main.tsx`)**:
  - In browsers, `window.onerror` receives a generic `"Script error."` whenever third-party scripts (like external trackers, analytics, or Disqus CDN scripts) are blocked by ad-blockers or fail cross-origin CORS checks.
  - Added a global window error listener in `src/main.tsx` to safely intercept and stop the propagation of cross-origin script errors so they cannot crash the application runtime.
- **Component Error Boundary (`src/components/TalkToUs.jsx`)**:
  - Created `DisqusErrorBoundary` class component wrapping `<DiscussionEmbed>` and `<CommentCount>`.
  - Ensures any runtime failures or script interruptions inside external widgets fail gracefully without breaking the React tree.
- **Git Push**: Committed and pushed to `main` on GitHub.

---

## Summary of Architecture & Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service status, uptime, and endpoint registry |
| `/api/conversion` | `GET` | Fetches live Frankfurter v2 rates for `SGD` -> `USD, EUR, MYR, IDR, VND` |
| `/api/conversion` | `GET / POST` | Converts individual amount or batch array of invoice lines to target currency |
| `/api/OCR` | `GET` | Endpoint metadata, supported image formats, and configuration check |
| `/api/OCR` | `POST` | Anthropic Claude Haiku Vision receipt reader extracting structured expense data |

---

*Document updated on: 2026-10-16*
