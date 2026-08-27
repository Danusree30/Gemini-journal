# Gemini Journal

> A production-grade, secure AI journal with offline synchronization, multi-turn Gemini reflections, custom color studios, and client-side salted PIN codelock.

---

## 🌟 Overview & Architecture

Gemini Journal is built with a **security-engineering first mindset**. Journal entries are sacred and private; no client-side AI secrets are ever exposed, and strict data isolation is enforced across both backend proxy layers and Firestore security rules.

### Key Capabilities
- **Strict Data Isolation**: Every journal entry, chat message, and summary is stored under `/users/{userId}/...` with path-based owner verification.
- **Server-Side AI Proxy**: The Gemini API key is isolated strictly in backend endpoints (`/api/ai/*`) using `@google/genai` with a resilient multi-model fallback ladder (`gemini-3.6-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.7-flash`).
- **Offline Synchronization**: Instant local state changes synced seamlessly via Firebase Firestore offline cache and real-time listeners.
- **Client-Side Codelock**: Cryptographically salted SHA-256 PIN locking with configurable auto-lock inactivity timers.
- **Theme & Sticker Studio**: 12 curated palettes, 4 dynamic seasonal themes, custom RGB color creator, typography controls, and interactive mood stickers.
- **Portability & Privacy**: 1-click JSON backup export/restore and complete GDPR/CCPA data purge.

---

## 🔒 Threat Modeling & Security Controls

| Threat Zone | Risk Identified | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection / Malicious payload injection | Schema validation, type-safe payload ingestion, sanitized JSON inputs. |
| **Planning & Reasoning** | System instruction tampering & hallucinated tools | Isolated prompt wrappers, strict instructions treating journal context as plain data. |
| **Tool Execution** | API credential theft & SSRF | Zero client-side API keys; server-side proxy handles all Gemini API interactions. |
| **Memory & State** | Cross-user data leakage / IDOR | Firestore security rules enforcing `request.auth.uid == userId` for all read/write paths. |
| **Inter-System Comms** | Unavailability / API throttling | Multi-tiered model fallback ladder catching 429/503/500 errors gracefully. |

---

## 🛡️ Firestore Security Rules

Deploy these rules to your Firebase Firestore instance:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated User namespace: users can only read/write their own document tree
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      match /summaries/{summaryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /settings/{settingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /backups/{backupId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🚀 Google Cloud Run Deployment Guide

### 1. Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated
- Google Cloud Project with billing enabled
- Firebase project linked or provisioned

Enable required APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Secret Management Setup
Create and populate the `GEMINI_API_KEY` in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run default service account Secret Accessor permissions
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run
Build and deploy the application container to Cloud Run with Secret Manager environment variables:

```bash
# Deploy to Cloud Run
gcloud run deploy gemini-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 4. Challenge Verification & Campaign Labeling
Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Verification Guide

| Test ID | Interaction / Flow | Expected Outcome |
| :--- | :--- | :--- |
| **TC-01** | **Google Authentication** | Click "Sign In with Google". User session initializes; personal entries stream in real-time. |
| **TC-02** | **Journal Creation & Auto-Save** | Type title & entry text. Status indicator displays "Saving..." then "Saved" with zero UI lockup. |
| **TC-03** | **AI Reflection** | Click "Reflect with Gemini" in the assistant panel. Structured reflection card is rendered. |
| **TC-04** | **Multi-Turn AI Chat** | Ask follow-up question in the AI Chat tab. Real-time response appears and persists in Firestore. |
| **TC-05** | **AI Summary & Action Items** | Click "Generate Summary". Title, short summary, key takeaways, and action items generate. |
| **TC-06** | **Theme Customization** | Switch theme to "Lavender Mist" or create a custom palette. Instant visual theme change across all UI. |
| **TC-07** | **Sticker Placement** | Select a sticker from the picker. Sticker attaches to the entry with customizable scale & rotation. |
| **TC-08** | **Codelock PIN Setup & Lock** | Set a 4-digit PIN in Security Center. Inactivity timer or clicking "Lock Now" invokes PIN overlay. |
| **TC-09** | **Data Backup & Restore** | Click "Export All Entries as JSON". Valid JSON file downloads; restoring loads entries correctly. |
| **TC-10** | **Data Purge (Zero-Trust)** | Trigger "Purge All My Data". All user records in Firestore are permanently deleted. |
