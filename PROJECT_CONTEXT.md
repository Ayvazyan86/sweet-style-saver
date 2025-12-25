# PROJECT CONTEXT
## Critical Architectural Decisions & Design Principles

> **Purpose:** This document preserves critical architectural context to prevent degradation during development cycles, AI-assisted coding, and team transitions. Every decision here exists for a reason and should not be changed without explicit architectural review.

---

## 🎯 Core Architectural Principles

### 1. Dual Interface Architecture
**Decision:** Application serves two completely different interfaces from the same codebase.

**Why:**
- **Telegram Mini App:** For end-users accessing via Telegram Bot
- **Web Admin Panel:** For moderators managing content
- **Shared Landing Page:** For web visitors (marketing)

**Implementation Pattern:**
```typescript
// src/pages/Index.tsx
if (webApp) {
  return <MainMenu />;  // Telegram Mini App
}
return <LandingPage />;  // Web Landing
```

**Critical Rule:**
- **NEVER** merge these interfaces into a single UI
- **ALWAYS** maintain separate routing for admin (`/admin/*`) vs user (`/*`)
- **NEVER** expose admin functionality in Telegram Mini App

---

### 2. Serverless-First Backend
**Decision:** All backend logic runs on Supabase Edge Functions (Deno runtime).

**Why:**
- Zero server maintenance
- Auto-scaling
- Geographic distribution
- Cost efficiency

**Critical Rules:**
- **NO** traditional backend server (Express, Fastify, etc.)
- **ALL** business logic that requires secrets → Edge Functions
- **CLIENT** operations use direct Supabase client (RLS protected)
- **NEVER** expose service role key to frontend

**Pattern:**
```typescript
// Frontend: Use anon key with RLS
import { supabase } from '@/integrations/supabase/client'

// Backend: Use service role in Edge Functions
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)
```

---

### 3. Telegram-Centric Authentication
**Decision:** Users authenticate ONLY through Telegram. No separate registration system.

**Why:**
- Trust through Telegram's verification
- No password management
- Seamless UX for Telegram users
- Built-in user identity

**Critical Rules:**
- **NEVER** create custom user registration
- **ALWAYS** use `telegram_id` as primary user identifier
- **ADMIN** panel uses separate Supabase Auth (email/password)
- **NEVER** mix Telegram auth with admin auth

**Profile Creation Pattern:**
```typescript
// User profile created automatically from Telegram data
const { data: profile } = await supabase
  .from('profiles')
  .insert({
    telegram_id: user.id,  // Primary identifier
    username: user.username,
    first_name: user.first_name,
    // ...
  })
```

---

### 4. Database-Driven Configuration
**Decision:** Form fields, notifications, and settings are configurable via database, not code.

**Why:**
- Non-technical admins can modify configuration
- No deployments for simple changes
- Runtime flexibility
- A/B testing capability

**Tables Driving Configuration:**
- `form_field_settings` → Form visibility, labels, requirements
- `notification_templates` → Message templates with variables
- `settings` → System-wide key-value configuration
- `card_templates` → Partner card visual templates

**Critical Rule:**
- **NEVER** hardcode what can be configured
- **ALWAYS** fetch configuration from database
- **CACHE** configuration in React Query

**Example:**
```typescript
// ❌ WRONG: Hardcoded
const fields = ['name', 'age', 'city']

// ✅ CORRECT: Database-driven
const { data: fieldSettings } = useQuery({
  queryKey: ['form-field-settings', 'partner'],
  queryFn: async () => {
    const { data } = await supabase
      .from('form_field_settings')
      .select('*')
      .eq('form_type', 'partner')
    return data
  }
})
```

---

### 5. Multi-Step Form Pattern
**Decision:** Complex forms (Partner Application) use multi-step wizard pattern.

**Why:**
- Reduces cognitive load
- Enables progressive disclosure
- Better mobile UX
- Saves progress per step

**Implementation Pattern:**
```typescript
const STEPS = [
  { id: 1, title: 'Photo', icon: Camera },
  { id: 2, title: 'Personal', icon: User },
  // ...
]

const [currentStep, setCurrentStep] = useState(1)

// Progress bar shows completion
<ProgressCard current={currentStep} total={STEPS.length} />

// Framer Motion for smooth transitions
<AnimatePresence custom={direction}>
  <motion.div variants={stepVariants}>
    {renderStep()}
  </motion.div>
</AnimatePresence>
```

**Critical Rules:**
- **ALWAYS** save form state to localStorage per step
- **ALWAYS** validate before allowing next step
- **ALWAYS** show progress indicator
- **NEVER** lose user data on page refresh

---

### 6. Status Workflow Pattern
**Decision:** All moderated content follows strict status workflows.

**Status Enums:**
- `application_status`: `pending` → `approved` | `rejected`
- `request_status`: `pending` → `approved` → `awaiting_partners` → `active` | `expired`
- `partner_status`: `active` | `inactive` | `archived`

**Why:**
- Clear state machine
- Audit trail via timestamps
- Prevents invalid transitions
- Enables notification triggers

**Critical Rules:**
- **NEVER** skip status transitions
- **ALWAYS** record `moderated_at`, `moderated_by`
- **ALWAYS** require `rejection_reason` on rejection
- **NEVER** allow direct status jumps

**Example Workflow:**
```sql
-- Application lifecycle
INSERT INTO partner_applications (status) VALUES ('pending');
-- Admin reviews
UPDATE partner_applications 
  SET status = 'approved', 
      moderated_at = NOW(), 
      moderated_by = admin_id
-- OR
UPDATE partner_applications 
  SET status = 'rejected',
      rejection_reason = '...',
      moderated_at = NOW()
```

---

### 7. Notification Architecture
**Decision:** All notifications go through dedicated Edge Functions.

**Functions:**
- `notify-application-result` → Partner approval/rejection
- `notify-new-application` → Admin notification
- `notify-partners-new-order` → Order to relevant partners
- `notify-partners-new-question` → Question to experts

**Why:**
- Centralized notification logic
- Template-based messages
- Error tracking (`notification_errors` table)
- Retry capability

**Critical Rules:**
- **NEVER** send Telegram messages from frontend
- **ALWAYS** use notification functions
- **ALWAYS** log notification errors to database
- **NEVER** block user flow on notification failure

**Pattern:**
```typescript
// ❌ WRONG: Direct Telegram API call from frontend
await fetch(`https://api.telegram.org/bot${token}/sendMessage`, ...)

// ✅ CORRECT: Call notification Edge Function
const { data, error } = await supabase.functions.invoke(
  'notify-application-result',
  { body: { application_id, status } }
)
```

---

### 8. Card Generation Pattern
**Decision:** Partner cards are dynamically generated server-side, not pre-designed.

**Why:**
- Consistent branding
- Template flexibility
- No design skills required
- Scalable to thousands of partners

**Process:**
1. Admin approves partner
2. `generate-partner-card` function called
3. SVG generated with template + partner data
4. SVG → PNG conversion (resvg-wasm)
5. Upload to Supabase Storage
6. URL saved to partner profile

**Critical Rules:**
- **ALWAYS** use template system
- **NEVER** store cards in database (use Storage)
- **ALWAYS** escape XML in text overlays
- **NEVER** generate cards on frontend

**Template Structure:**
```typescript
interface CardTemplate {
  image_url: string     // Background template
  text_x: number        // Text X position
  text_y: number        // Text Y position
  text_color: string    // Text color (hex)
  font_size: number     // Base font size
}
```

---

### 9. Channel Publication Pattern
**Decision:** Approved partners are automatically posted to Telegram channel.

**Why:**
- Centralized partner directory
- SEO for Telegram
- Push notification to subscribers
- Discoverability

**Process:**
1. Admin approves and publishes partner
2. `publish-partner-to-channel` function called
3. Caption formatted from partner data
4. Photo/card sent to channel
5. `channel_post_id` saved for updates/deletion

**Critical Rules:**
- **ALWAYS** check if already published
- **ALWAYS** save `channel_post_id` for future edits
- **ALWAYS** use HTML parse mode
- **NEVER** publish without moderation

**Caption Format:**
```typescript
function formatPartnerCaption(partner) {
  return `
    <b>${partner.name}</b>
    ${partner.profession} • 📍 ${partner.city}
    
    ❝ О себе: ${partner.self_description} ❞
    
    <b>Контакты:</b>
    📞 ${partner.phone}
    💬 Telegram | 🌐 Сайт
  `
}
```

---

### 10. Multilingual Support Pattern
**Decision:** Application supports RU/EN with custom i18n system.

**Why:**
- No external dependencies
- Lightweight
- Compile-time type safety
- Auto-detection from Telegram

**Implementation:**
```typescript
// lib/i18n.ts
export const translations = {
  ru: { becomePartner: 'Стать партнёром' },
  en: { becomePartner: 'Become a Partner' }
}

export type TranslationKey = keyof typeof translations.ru

// Type-safe translation function
export const t = (key: TranslationKey, lang: Language) => 
  translations[lang][key]
```

**Critical Rules:**
- **ALWAYS** add both RU and EN translations
- **NEVER** hardcode user-facing strings
- **ALWAYS** use `TranslationKey` type
- **DETECT** language from `Telegram.WebApp.initDataUnsafe.user.language_code`

---

## 🚫 What NOT to Change

### 1. Database Schema Modifications
**CRITICAL:** Database schema changes require migrations.

**Process:**
1. Create new migration file in `supabase/migrations/`
2. Test migration locally
3. Apply to production via Supabase CLI
4. Regenerate TypeScript types

**❌ NEVER:**
- Modify schema via Supabase dashboard in production
- Delete migration files
- Reorder existing migrations
- Change column types without migration

---

### 2. Edge Function JWT Verification
**CURRENT CONFIG:** Most Edge Functions have `verify_jwt = false`

**Why:**
- Called from backend (no user JWT)
- Called from webhooks (no authentication)
- Use service role key instead

**❌ NEVER:**
- Enable JWT verification without authentication strategy
- Mix authenticated and unauthenticated calls
- Expose service role key

**✅ WHEN TO ENABLE:**
- User-initiated operations
- Requires RLS context
- Frontend-to-function calls

---

### 3. Supabase Client Configuration
**CURRENT CONFIG:**
```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

**❌ NEVER:**
- Change storage to sessionStorage (breaks persistence)
- Disable autoRefreshToken (causes auth errors)
- Use service role key on frontend

---

### 4. TypeScript Configuration
**CURRENT CONFIG:**
```json
{
  "noImplicitAny": false,
  "strictNullChecks": false,
  "noUnusedLocals": false
}
```

**Why:** Flexibility during rapid development

**⚠️ WARNING:**
- Enabling strict mode will break existing code
- Requires comprehensive refactoring
- Test thoroughly before enabling

---

### 5. Component Library (shadcn/ui)
**Decision:** Use shadcn/ui as component foundation.

**❌ NEVER:**
- Replace with different UI library
- Mix with other component libraries
- Modify core component files directly

**✅ ALWAYS:**
- Customize via Tailwind classes
- Extend components in separate files
- Follow shadcn conventions

---

## 📝 Adding New Features

### Adding a New Form
1. Create form component in `/components/mini-app/`
2. Add form field settings to `form_field_settings` table
3. Use `useFormFieldSettings()` hook
4. Implement multi-step if complex
5. Add form persistence via `useFormPersistence()`
6. Create corresponding database table
7. Add admin management page in `/pages/admin/`

### Adding a New Edge Function
1. Create directory in `supabase/functions/`
2. Create `index.ts` with Deno.serve()
3. Add CORS headers
4. Add JWT verification config in `config.toml` if needed
5. Use service role key for database operations
6. Add error logging
7. Test locally with Supabase CLI
8. Deploy via Supabase

### Adding a New Admin Page
1. Create page component in `/pages/admin/`
2. Add route in `App.tsx` under `/admin` route group
3. Add navigation item in `AdminLayout.tsx` navItems
4. Use React Query for data fetching
5. Implement moderation actions
6. Add confirmation dialogs for destructive actions
7. Log moderation actions to `moderation_logs`

### Adding a New Notification Type
1. Create new Edge Function in `supabase/functions/`
2. Add template to `notification_templates` table
3. Use template with variable substitution
4. Send via Telegram Bot API
5. Log errors to `notification_errors` table
6. Return 200 OK to prevent retries
7. Test with real Telegram users

---

## 🔒 Security Principles

### 1. Row-Level Security (RLS)
**Current Implementation:** RLS policies enforce data access.

**Rules:**
- Users can only access their own data
- Admins use service role key (bypass RLS)
- Public data (categories, professions) readable by all

**❌ NEVER:**
- Disable RLS on tables with user data
- Use service role key on frontend
- Trust frontend input without validation

### 2. Input Validation
**Layers:**
1. **Frontend:** Zod schemas via React Hook Form
2. **Backend:** Edge Function validation
3. **Database:** Constraints and triggers

**❌ NEVER:**
- Skip validation on backend
- Trust frontend validation alone
- Accept unescaped user input in SQL

### 3. API Key Management
**Separation:**
- `VITE_SUPABASE_PUBLISHABLE_KEY` → Frontend (public)
- `SUPABASE_SERVICE_ROLE_KEY` → Backend only (secret)

**❌ NEVER:**
- Commit API keys to git
- Use service role key on frontend
- Share keys between environments

---

## 🎨 Design System Principles

### 1. Glass Morphism Pattern
**Decision:** Primary design aesthetic for Telegram Mini App.

**Implementation:**
```typescript
<GlassCard>  // backdrop-blur-md, semi-transparent
  <FormInput />
</GlassCard>
```

**Why:**
- Modern, premium feel
- Works with Telegram's dynamic background
- Distinguishes from standard web apps

**❌ NEVER:**
- Remove glass effect from mini-app
- Use solid backgrounds for cards
- Mix with other design patterns

### 2. Icon System (Lucide)
**Decision:** Lucide React for all icons.

**❌ NEVER:**
- Mix with other icon libraries
- Use emoji as functional icons
- Replace with custom SVGs (unless necessary)

### 3. Color System
**Decision:** HSL-based CSS variables for theming.

**Pattern:**
```css
--primary: 222.2 47.4% 11.2%;
--foreground: 210 40% 98%;
```

**❌ NEVER:**
- Use hex colors directly
- Modify color variables without full theme update
- Break light/dark mode support

---

## 🔄 State Management Principles

### 1. Server State → React Query
**Decision:** All server data managed by React Query.

**Why:**
- Automatic caching
- Background updates
- Optimistic updates
- Request deduplication

**Pattern:**
```typescript
// Queries for reading
const { data } = useQuery({
  queryKey: ['applications'],
  queryFn: async () => {
    const { data } = await supabase
      .from('partner_applications')
      .select('*')
    return data
  }
})

// Mutations for writing
const mutation = useMutation({
  mutationFn: async (data) => {
    return await supabase
      .from('partner_applications')
      .insert(data)
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['applications'])
  }
})
```

**❌ NEVER:**
- Store server data in useState
- Fetch data in useEffect
- Forget to invalidate queries after mutations

### 2. Form State → React Hook Form
**Decision:** All forms use React Hook Form + Zod.

**❌ NEVER:**
- Use controlled inputs without React Hook Form
- Skip validation schema
- Use native form submission

### 3. Global State → Context API
**Current:** Only used for Language context.

**❌ NEVER:**
- Add Redux/Zustand/other state library
- Overuse Context (causes re-renders)
- Store server data in Context

---

## 📱 Telegram Integration Principles

### 1. Haptic Feedback
**Decision:** Provide haptic feedback on user actions.

**Implementation:**
```typescript
const { hapticFeedback } = useTelegram()

hapticFeedback('success')  // On success
hapticFeedback('error')    // On error
hapticFeedback('light')    // On click
```

**❌ NEVER:**
- Overuse haptic feedback (annoying)
- Use on every interaction
- Use heavy feedback for minor actions

### 2. Main Button Pattern
**Decision:** Telegram's Main Button for form submission.

**Why:**
- Native Telegram UI
- Better mobile UX
- Consistent with Telegram apps

**❌ NEVER:**
- Replace with HTML button for submission
- Use Main Button for non-primary actions
- Forget to handle Main Button in useEffect

### 3. Back Button Pattern
**Decision:** Telegram's Back Button for navigation.

**Why:**
- Native back gesture
- Android back button support
- Consistent UX

**❌ NEVER:**
- Rely only on HTML back button
- Forget to show/hide based on route
- Break browser back button

---

## 🧪 Quality Assurance Rules

### 1. Data Integrity
**Critical Rules:**
- **ALWAYS** use transactions for multi-table operations
- **ALWAYS** validate foreign key relationships
- **NEVER** cascade delete without careful consideration
- **ALWAYS** soft delete (archive) instead of hard delete

### 2. Error Recovery
**Critical Rules:**
- **ALWAYS** show user-friendly error messages
- **ALWAYS** log errors for debugging
- **NEVER** expose technical details to users
- **ALWAYS** provide retry mechanism

### 3. Testing Strategy
**Current State:** No automated tests

**When Adding Tests:**
1. Start with critical paths (partner application, admin approval)
2. Mock Supabase client
3. Test form validation
4. Test state transitions
5. E2E test Telegram integration (manual)

---

## 🚀 Performance Rules

### 1. Image Optimization
**Critical Rules:**
- **ALWAYS** use Supabase Storage CDN
- **ALWAYS** resize images before upload (if possible)
- **NEVER** embed large images as base64 in database
- **ALWAYS** use public URLs

### 2. Query Optimization
**Critical Rules:**
- **ALWAYS** use indexes on filtered columns
- **ALWAYS** limit results with `.limit()`
- **NEVER** fetch unnecessary columns
- **ALWAYS** use select with specific columns

### 3. Bundle Optimization
**Current:** Vite with automatic code splitting

**❌ NEVER:**
- Import entire libraries (use tree-shaking)
- Bundle large dependencies in main chunk
- Forget to lazy load admin routes

---

## 📋 Checklist for Major Changes

Before making significant architectural changes:

- [ ] Read this entire document
- [ ] Understand the **why** behind the decision
- [ ] Consider impact on existing features
- [ ] Check if database migration needed
- [ ] Verify Telegram integration still works
- [ ] Test in both Telegram and web browser
- [ ] Test admin panel separately
- [ ] Check notification delivery
- [ ] Verify RLS policies
- [ ] Update TypeScript types if needed
- [ ] Document new patterns in this file

---

## 🆘 Common Pitfalls

### Pitfall 1: Mixing Admin and User Auth
**Symptom:** Admin can't log in, or Telegram users see admin features

**Solution:**
- Admin uses Supabase Auth (email/password)
- Users use Telegram WebApp authentication
- Keep separate contexts

### Pitfall 2: Service Role Key Exposure
**Symptom:** Security warning, unauthorized database access

**Solution:**
- **NEVER** use service role key on frontend
- Keep in backend Edge Functions only
- Use environment variables

### Pitfall 3: Status Transition Errors
**Symptom:** Applications stuck in pending, can't be approved

**Solution:**
- Follow status workflow strictly
- Check `moderated_by` is set
- Verify rejection_reason on rejection

### Pitfall 4: Notification Failures
**Symptom:** Users not receiving Telegram messages

**Solution:**
- Check `notification_errors` table
- Verify Telegram bot token
- Ensure user has started bot (`/start`)
- Check Edge Function logs

### Pitfall 5: Form State Loss
**Symptom:** Users lose data on page refresh

**Solution:**
- Use `useFormPersistence()` hook
- Save to localStorage after each step
- Clear only on successful submission

---

## 📖 Further Reading

**Internal Documentation:**
- `PROJECT_ARCHITECTURE.md` - Full architecture overview
- `ONBOARDING.md` - Developer onboarding guide
- `README.md` - Setup instructions

**External Resources:**
- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [React Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Last Updated:** December 25, 2024
**Maintained By:** Architecture Team
**Review Frequency:** After major architectural changes
