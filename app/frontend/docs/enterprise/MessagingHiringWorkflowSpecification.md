# MATCHME ENTERPRISE PLATFORM
# Prompt 9 – Messaging, Interviews & Hiring Workflow Engine
## End-to-End Hiring Journey
### Version 1.0

---

## 1. System Objective

Build a system that:

- Converts matches → conversations → interviews → hires
- Provides a smooth, fast, mobile-first hiring experience
- Replaces fragmented tools (email, WhatsApp, spreadsheets)

---

## 2. Core Modules

### 2.1 Messaging Engine (Real-Time Chat)

**Features:**

- 1:1 chat (Candidate ↔ Employer)
- Group chat (Hiring team)
- System messages (automated updates)
- File sharing:
  - CV
  - Portfolio
  - Documents
- Voice notes (optional)
- Read receipts
- Typing indicators

**Chat Triggers:**

- Match created → auto chat opens
- Employer shortlists → message prompt
- Interview scheduled → system message

**Suggested Tech:**

- WebSockets (real-time)
- Firebase / Socket.io
- Message queue (Kafka / RabbitMQ)

---

### 2.2 Notification System

**Channels:**

- In-app notifications
- Email
- Push notifications

**Triggers:**

- New match
- New message
- Interview scheduled
- Status change
- Offer sent

**Requirements:**

- Real-time delivery
- User preference settings
- Quiet hours support

---

### 2.3 Interview Scheduling Engine

**Features:**

- Calendar integration:
  - Google Calendar
  - Outlook
- Time slot selection
- Time zone detection
- Rescheduling
- Cancellation
- Interview reminders

**Interview Types:**

- In-person
- Video (Zoom, Google Meet)
- Phone call

**Automation:**

- Send calendar invites
- Generate meeting links
- Reminder notifications (24h / 1h)

---

### 2.4 Hiring Pipeline (ATS-Lite)

Each job must have a customizable pipeline.

**Default Stages:**

1. Applied
2. Screening
3. Interview
4. Final Interview
5. Offer
6. Hired
7. Rejected

**Features:**

- Drag & drop candidates between stages
- Bulk actions
- Notes & feedback per candidate
- Tags (e.g., "Strong", "Urgent")

---

### 2.5 Candidate Profile View (Employer Side)

Display:

- Full profile
- CV
- Match score
- AI insights:
  - Strengths
  - Weaknesses
  - Skill gaps
- Activity history
- Notes from team

---

### 2.6 Employer Collaboration Tools

- Multiple team members per job
- Role-based access:
  - Recruiter
  - Hiring Manager
  - Admin
- Internal comments (not visible to candidate)
- Candidate rating system (1–5)

---

### 2.7 Offer Management

**Features:**

- Create offer:
  - Salary
  - Benefits
  - Start date
- Send digital offer
- Candidate can:
  - Accept
  - Reject
  - Request changes
- Optional:
  - E-signature integration

---

## 3. Workflow Logic (End-to-End)

### Step 1: Match

- Candidate ↔ Job matched
- Chat enabled

### Step 2: Conversation

- Employer initiates chat
- Candidate responds

### Step 3: Shortlisting

- Employer moves candidate to "Screening"

### Step 4: Interview

- Schedule interview
- Send invites
- Conduct interview
- Add feedback

### Step 5: Decision

- Move to:
  - Final Interview
  - Offer
  - Rejected

### Step 6: Offer & Hire

- Send offer
- Candidate accepts
- Status = Hired

---

## 4. Automation Rules

Examples:

- If no reply in 48h → send reminder
- If candidate stuck in stage > X days → alert recruiter
- Auto-reject after inactivity (optional)

---

## 5. Data Model

### Tables

```sql
-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL, -- '1:1', 'group', 'system'
    job_id UUID REFERENCES jobs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES users(id),
    role TEXT, -- 'candidate', 'employer', 'system'
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES users(id),
    content TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'file', 'system', 'voice'
    metadata JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    data JSONB,
    channel TEXT, -- 'in_app', 'email', 'push'
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE interviews (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id),
    candidate_id UUID REFERENCES users(id),
    interviewer_id UUID REFERENCES users(id),
    type TEXT, -- 'in_person', 'video', 'phone'
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipelines
CREATE TABLE pipelines (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id),
    company_id UUID REFERENCES companies(id),
    stages JSONB NOT NULL, -- ordered array of stage objects
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate stage history
CREATE TABLE candidate_stage_history (
    id UUID PRIMARY KEY,
    pipeline_id UUID REFERENCES pipelines(id),
    candidate_id UUID REFERENCES users(id),
    stage TEXT NOT NULL,
    moved_by UUID REFERENCES users(id),
    notes TEXT,
    moved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers
CREATE TABLE offers (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id),
    candidate_id UUID REFERENCES users(id),
    salary JSONB,
    benefits TEXT[],
    start_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'negotiating'
    sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    reviewer_id UUID REFERENCES users(id),
    candidate_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT,
    weaknesses TEXT,
    recommendation TEXT, -- 'hire', 'reject', 'next_round'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Permissions & Security

- Only matched users can chat
- Employers cannot see candidate contact info until match (optional)
- Role-based access control (RBAC)
- Data privacy compliance (GDPR-ready)
- Message encryption in transit
- Secure file storage for shared documents

---

## 7. Analytics & Tracking

Track:

- Response time (average time to first message)
- Interview-to-offer ratio
- Offer acceptance rate
- Time per stage
- Drop-off points
- Recruiter activity metrics
- Candidate engagement scores

---

## 8. Mobile-First UX Requirements

- Fast chat experience (like WhatsApp)
- Swipe actions:
  - Move stage
  - Quick reply
- Push-first engagement
- Offline message queuing
- Optimistic UI updates

---

## 9. Integrations

- Calendar (Google, Outlook)
- Video tools (Zoom, Meet)
- Email service

**Future:**

- HR systems
- Payroll systems
- Background check services

---

## 10. Performance Requirements

- Real-time messaging latency < 1s
- High availability (99.9%)
- Scalable to thousands of concurrent chats
- Push notification delivery < 5s
- Interview scheduling response < 500ms

---

## 11. API Endpoints

### Messaging

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/conversations` | GET | List user conversations |
| `/conversations` | POST | Create conversation |
| `/conversations/:id/messages` | GET | Get messages |
| `/conversations/:id/messages` | POST | Send message |
| `/conversations/:id/read` | POST | Mark as read |

### Interviews

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/interviews` | GET | List interviews |
| `/interviews` | POST | Schedule interview |
| `/interviews/:id` | PATCH | Reschedule/cancel |
| `/interviews/:id/feedback` | POST | Submit feedback |

### Pipeline

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/jobs/:id/pipeline` | GET | Get pipeline |
| `/jobs/:id/pipeline/move` | POST | Move candidate |
| `/jobs/:id/pipeline/bulk` | POST | Bulk actions |

### Offers

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/offers` | POST | Create offer |
| `/offers/:id` | PATCH | Update offer |
| `/offers/:id/respond` | POST | Accept/reject |

### Notifications

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notifications` | GET | List notifications |
| `/notifications/:id/read` | POST | Mark read |
| `/notifications/preferences` | PUT | Update preferences |

---

## 12. Events Published

- MatchCreated
- ConversationStarted
- MessageSent
- MessageRead
- InterviewScheduled
- InterviewCompleted
- InterviewCancelled
- CandidateStageMoved
- FeedbackSubmitted
- OfferSent
- OfferAccepted
- OfferRejected
- CandidateHired
- CandidateRejected
- ReminderSent

Events integrate with the Event Platform and Analytics Engine.

---

## 13. Future Enhancements

- AI interview assistant
- Automated screening questions
- Voice/video interviews inside app
- Interview transcription & scoring
- AI-generated candidate summaries
- Smart scheduling (AI-optimized time slots)
- Sentiment analysis on conversations

---

## 14. Output Requirements

**For Candidates:**

- Chat interface
- Interview schedule
- Application status tracker
- Offer details & response

**For Employers:**

- Candidate pipeline (Kanban board)
- Messaging dashboard
- Interview calendar
- Hiring insights & analytics
- Team collaboration tools

---

## 15. Success Criteria

- Faster hiring cycles (reduce time-to-hire by 40%)
- Higher response rates (target: 80%+ within 24h)
- Better candidate experience (NPS > 60)
- Reduced recruiter workload (automate 60% of scheduling)

---

## 16. Integration with Platform Engines

The Messaging & Hiring Workflow Engine integrates with:

- **AI Matching Engine** — triggers conversations on match
- **Notification Engine** — delivers alerts across channels
- **Event Platform** — publishes hiring lifecycle events
- **Analytics Engine** — tracks hiring funnel metrics
- **Workflow Engine** — automates stage transitions
- **Security Engine** — enforces RBAC and data privacy
- **Calendar Engine** — manages scheduling
- **Search Engine** — enables candidate/conversation search

---

## 17. Final Platform Rule

Every hiring interaction within MatchMe flows through the Messaging & Hiring Workflow Engine.

No communication happens outside the platform. No interview is untracked. No candidate moves through the pipeline without audit trail.

The hiring workflow is the revenue engine of MatchMe — converting matches into hires.