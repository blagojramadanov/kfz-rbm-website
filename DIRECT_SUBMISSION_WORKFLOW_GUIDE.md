# Direct Submission Workflow Implementation Guide

## ✅ Completed: Database Migration

**File:** `supabase/migrations/019_direct_submission_workflow.sql`

### What Changed in Database

#### 1. **New Status Values**
```
eingereicht        → Customer submitted, waiting for admin review
in_bearbeitung     → Admin is reviewing
angebot_gesendet   → Admin sent an offer/quote
abgelehnt          → Rejected (with optional reason)
```

#### 2. **New Columns in submitted_vehicles**
- `rejection_reason` - Why admin rejected (shown to customer)
- `status_updated_at` - When status last changed
- `status_updated_by` - Which admin changed it
- `admin_notes` - Internal notes (not shown to customer)
- `rejection_notified_at` - When customer was notified

#### 3. **Admin Settings Table**
```sql
admin_settings(
  admin_id,
  email_on_new_submission (boolean),
  email_address (varchar)
)
```

#### 4. **RLS Policies - PRIVATE SUBMISSIONS**
- Users see ONLY their own submissions
- Admins see ALL submissions
- Users CANNOT change status (admin-only)
- Public vehicle listings are separate (not from submissions)

#### 5. **Auto-Tracking Trigger**
Automatically records when status changed and by whom

---

## 🔄 Server-Side Implementation (TODO - Next Steps)

### Required Server Actions

**Location:** `app/actions/vehicles.ts` or new `app/actions/submissions.ts`

#### 1. submitVehicle()
```typescript
export async function submitVehicle(
  vehicleData: {...},
  imageUrls: string[]
)
```
**What it should do:**
- Validate all required fields
- Check image count and size
- Rate limit: max 5 submissions per day per user
- Create submission with status='eingereicht'
- Upload images
- Notify admins (email + admin panel badge)

**Validation:**
- Required: brand, model, year, mileage, price, transmission, fuel_type, body_type, color
- Year: 1950-nextYear
- Mileage: 0-1,000,000
- Price: €100-€10,000,000
- Images: 1-20, max 10MB each, jpeg/png/webp

**Rate Limit:**
- 5 submissions per day per user
- Error message: "You can only submit 5 vehicles per day"

---

#### 2. updateSubmissionStatus() - ADMIN ONLY
```typescript
export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: 'eingereicht' | 'in_bearbeitung' | 'angebot_gesendet' | 'abgelehnt',
  rejectionReason?: string,
  adminNotes?: string
)
```
**What it should do:**
- Verify admin role (server-side, database check)
- Update status, timestamp, admin ID
- If rejecting: save reason, send email to customer
- Track who changed it and when

**Server-Side Admin Check:**
```typescript
const { data: profile } = await supabase
  .from("user_profiles")
  .select("role")
  .eq("id", session.user.id)
  .single();

if (profile.role !== "ADMIN") {
  throw new Error("Admin role required");
}
```

---

#### 3. Rejection Email Notification
**Template (German):**
```
Subject: Status Ihrer Fahrzeug-Ankaufanfrage

Lieber [Kunde],

leider können wir Ihren Wagen (Jahr Marke Modell) aktuell nicht ankaufen.

Grund: [rejection_reason]

Vielen Dank für Ihre Anfrage!

Freundliche Grüße,
KFZ RBM Team
```

---

#### 4. Admin Notification (New Submission)
**When:** New submission created
**Where:** 
- Email (if admin enabled notifications in admin_settings)
- Admin panel badge showing count of new submissions

**Template (German):**
```
Subject: Neue Fahrzeug-Ankaufanfrage: [Jahr] [Marke] [Modell]

Neue Ankaufsanfrage erhalten:
- Fahrzeug: [Jahr] [Marke] [Modell]
- Preis: €[preis]
- Kunde: [email]

Zum Überprüfen: [admin_url]/admin/anfragen
```

---

### Submission Listing Pages

#### Customer Dashboard
**Path:** `/dashboard/fahrzeuge` (rename from "Fahrzeuge" to "Ankaufsanfragen")

**Show:**
- List of customer's submissions
- Status: eingereicht, in_bearbeitung, angebot_gesendet, abgelehnt
- If rejected: show rejection_reason
- Edit allowed only if status='eingereicht'
- Delete allowed only if status='eingereicht'

#### Admin Panel
**Path:** `/admin/anfragen` (new section)

**Show:**
- All submissions
- Status filters
- Customer info
- Images
- Status history (who changed it, when)

**Actions:**
- Update status
- Add admin notes
- Send rejection with reason
- View customer details

---

### RLS Policy Details

**Submissions are PRIVATE:**
```sql
-- Users can SELECT/UPDATE only own submissions
SELECT WHERE auth.uid() = user_id
UPDATE WHERE auth.uid() = user_id AND status = 'eingereicht'

-- Admins can SELECT/UPDATE all
SELECT WHERE auth.uid() IN (SELECT id FROM user_profiles WHERE role='ADMIN')
UPDATE WHERE auth.uid() IN (SELECT id FROM user_profiles WHERE role='ADMIN')

-- Status changes tracked automatically
```

---

## 📋 Implementation Checklist

### Database
- [x] Migration created (019_direct_submission_workflow.sql)
- [ ] Migration applied to Supabase (run: `supabase db push`)

### Server Actions (TODO)
- [ ] Create submitVehicle() function
- [ ] Add validation + rate limiting
- [ ] Create updateSubmissionStatus() function
- [ ] Add admin role verification (server-side)
- [ ] Create sendRejectionEmail() function
- [ ] Create notifyAdminOfNewSubmission() function

### Email Sending (TODO)
- [ ] Set up email service (SendGrid, Resend, etc.)
- [ ] Rejection email template (German)
- [ ] New submission admin email template (German)
- [ ] Implement email function calls

### Frontend UI (TODO)
- [ ] Update `/dashboard/fahrzeuge` page
  - Show submissions (not vehicles)
  - Filter by status
  - Edit allowed if status='eingereicht'
- [ ] Create admin `/admin/anfragen` page
  - List all submissions
  - Status filter dropdown
  - Customer info
  - Status update button/dropdown
  - Rejection reason modal
  - Admin notes field
- [ ] Update admin dashboard
  - Show "new submissions" badge
  - Count of eingereicht submissions

### Notifications (TODO)
- [ ] Customer rejection email
- [ ] Admin new submission email
- [ ] Admin panel badge for new submissions

---

## 🔐 Security Checks (Already in Migration)

✅ **RLS Policies:**
- Users cannot read other submissions
- Users cannot update status
- Admins can read/update all
- Only authenticated admins can change status

✅ **Server-Side Verification:**
- Admin role checked server-side (not just frontend)
- Cannot bypass RLS from client

✅ **Spam Protection (to implement):**
- Rate limit: 5/day per user
- Required fields validation
- Image size limits
- Image count limits

---

## 🚀 To Apply the Migration

In Supabase SQL Editor, run:
```sql
-- Run all SQL from supabase/migrations/019_direct_submission_workflow.sql
-- OR use Supabase CLI:
-- supabase db push
```

**Verify it worked:**
```sql
-- Check table structure
SELECT column_name FROM information_schema.columns 
WHERE table_name='submitted_vehicles' 
ORDER BY ordinal_position;

-- Should include: rejection_reason, status_updated_at, status_updated_by, admin_notes, rejection_notified_at

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename='submitted_vehicles';

-- Should show new policies
```

---

## 📧 Email Implementation Notes

**Recommended services:**
- SendGrid (paid, reliable)
- Resend (simple API)
- AWS SES (cheap)
- Mailgun

**Create email service wrapper:**
```typescript
// lib/email.ts
export async function sendEmail({
  to: string,
  subject: string,
  template: string, // 'rejection' | 'new_submission_admin'
  data: object
})
```

**Use in server actions:**
```typescript
await sendEmail({
  to: customerEmail,
  subject: "Status Ihrer Fahrzeug-Ankaufanfrage",
  template: "rejection",
  data: {
    vehicle: `${year} ${brand} ${model}`,
    reason: rejection_reason
  }
});
```

---

## 🎯 Data Flow Summary

```
CUSTOMER SUBMIT
├─ Form validation ✓
├─ Rate limit check ✓
├─ Create submission (status='eingereicht') ✓
├─ Save images ✓
└─ Notify admin (email + badge) → TODO

ADMIN REVIEW
├─ List submissions ✓ (RLS filters to admin)
├─ View details ✓
├─ Change status → TODO
│  ├─ Verify admin role ✓ (in migration, needs code)
│  ├─ If rejected:
│  │  ├─ Save rejection_reason ✓
│  │  └─ Send email to customer → TODO
│  └─ Update status_updated_at, status_updated_by ✓
└─ Add admin notes → TODO

CUSTOMER VIEW SUBMISSION
├─ See own submissions only ✓ (RLS)
├─ See status (eingereicht, in_bearbeitung, etc.) ✓
├─ See rejection reason if rejected → TODO (UI)
├─ Edit if status='eingereicht' → TODO
└─ Delete if status='eingereicht' → TODO
```

---

## 🔄 Status Workflow

```
Customer submits
    ↓
Status: eingereicht (awaiting review)
    ↓
Admin reviews → changes to in_bearbeitung
    ↓
    ├─→ Approved → angebot_gesendet
    │            (customer can see they got an offer)
    │
    └─→ Rejected → abgelehnt + rejection_reason
                   (email sent to customer with reason)
```

---

## ✨ Summary

The **database migration is complete** and provides:
- ✅ Direct submission (no approval gate)
- ✅ Private submissions (RLS enforced)
- ✅ Admin-only status management (RLS + server-side checks)
- ✅ Audit trail (who changed status, when)
- ✅ Rejection tracking (reason + notification flag)

**Next:** Implement server actions, email service, and UI components to complete the workflow.

