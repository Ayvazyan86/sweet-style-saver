# Onboarding Guide
## Quick Start for New Developers

Welcome to the Sweet Style Saver project! This guide will help you understand the project quickly and start contributing safely.

---

## 🎯 What Is This Project?

**TL;DR:** A Telegram-based platform connecting service professionals (stylists, beauticians, etc.) with customers. Partners apply through a Telegram bot, admins moderate applications, and approved partners get published to a Telegram channel.

**Key Features:**
- 📱 Telegram Mini App for partner applications
- 👥 Customer order and question submission
- 🔐 Admin panel for content moderation
- 🤖 Telegram bot for user interaction
- 🎨 Automatic partner card generation
- 📢 Channel publication system

---

## 🚀 Getting Started (5 Minutes)

### Prerequisites
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Telegram account (for testing)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd sweet-style-saver

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env and add Supabase credentials

# 4. Start development server
npm run dev
```

**Access Points:**
- Frontend: http://localhost:8080
- Admin Panel: http://localhost:8080/admin/login

### Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

Get these from your Supabase project settings.

---

## 📂 Project Structure (What's Where)

```
sweet-style-saver/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin panel components
│   │   ├── mini-app/       # Telegram Mini App forms
│   │   └── ui/             # Reusable UI components (shadcn)
│   ├── pages/              # Route pages
│   │   ├── admin/          # Admin panel pages
│   │   ├── Index.tsx       # Landing / Main menu
│   │   ├── PartnerForm.tsx # Partner application form
│   │   ├── OrderForm.tsx   # Customer order form
│   │   └── QuestionForm.tsx # Customer question form
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts (Language)
│   ├── integrations/       # External services (Supabase)
│   ├── lib/                # Utilities (i18n, utils)
│   └── App.tsx             # Application root
├── supabase/
│   ├── functions/          # Edge Functions (backend logic)
│   │   ├── telegram-webhook/           # Bot webhook handler
│   │   ├── generate-partner-card/      # Card generation
│   │   ├── publish-partner-to-channel/ # Channel posting
│   │   └── notify-*/                   # Notification functions
│   └── migrations/         # Database schema versions
├── public/                 # Static assets
└── config files            # vite, tailwind, typescript
```

---

## 🗺️ Key File Locations

### Need to modify forms?
→ `src/pages/PartnerForm.tsx`, `OrderForm.tsx`, `QuestionForm.tsx`

### Need to add admin functionality?
→ `src/pages/admin/AdminApplications.tsx`, etc.

### Need to modify database?
→ Create new migration in `supabase/migrations/`

### Need to add backend logic?
→ Create new Edge Function in `supabase/functions/`

### Need to add UI components?
→ Add to `src/components/ui/` (from shadcn) or `src/components/mini-app/`

### Need to modify Telegram bot?
→ `supabase/functions/telegram-webhook/index.ts`

---

## 🧭 Understanding the Flow

### 1. Partner Application Flow
```
User opens Telegram Bot
  → Clicks "Become Partner"
  → Opens Mini App (PartnerForm.tsx)
  → Fills 8-step form
  → Submits application
  → Stored in partner_applications table (status: pending)
  → Admin receives notification
  → Admin reviews in Admin Panel (AdminApplications.tsx)
  → Admin approves:
     - Creates partner_profile
     - Generates card (generate-partner-card function)
     - Posts to channel (publish-partner-to-channel function)
  → User receives approval notification
```

### 2. Order Flow
```
Customer opens Order Form
  → Fills order details + category
  → Submits order
  → Admin moderates
  → Approved orders published to partner private channels
  → Partners can respond
```

### 3. Admin Moderation Flow
```
Admin logs in
  → Views pending items (applications/orders/questions)
  → Reviews content
  → Approves or rejects with reason
  → Notifications automatically sent
  → Moderation logged in moderation_logs
```

---

## 🛠️ Common Development Tasks

### Task: Add a New Field to Partner Form

1. **Update Database:**
```sql
-- Create migration: supabase/migrations/YYYYMMDD_add_field.sql
ALTER TABLE partner_applications 
ADD COLUMN new_field TEXT;

ALTER TABLE partner_profiles 
ADD COLUMN new_field TEXT;
```

2. **Update TypeScript Types:**
```bash
# Regenerate types from Supabase
npm run supabase:gen-types
```

3. **Update Form Component:**
```typescript
// src/pages/PartnerForm.tsx
const [formData, setFormData] = useState({
  // ...existing fields
  new_field: '',
})

// Add input in appropriate step
<FormInput
  label="New Field"
  value={formData.new_field}
  onChange={(value) => setFormData({...formData, new_field: value})}
/>
```

4. **Update Admin View:**
```typescript
// src/pages/admin/AdminApplications.tsx
<p><strong>New Field:</strong> {application.new_field}</p>
```

### Task: Add a New Admin Page

1. **Create Page Component:**
```typescript
// src/pages/admin/AdminNewPage.tsx
export default function AdminNewPage() {
  return (
    <div>
      <h1>New Admin Page</h1>
    </div>
  )
}
```

2. **Add Route:**
```typescript
// src/App.tsx
import AdminNewPage from './pages/admin/AdminNewPage'

<Route path="/admin" element={<AdminLayout />}>
  {/* existing routes */}
  <Route path="new-page" element={<AdminNewPage />} />
</Route>
```

3. **Add Navigation:**
```typescript
// src/components/admin/AdminLayout.tsx
const navItems = [
  // ...existing items
  { href: '/admin/new-page', label: 'New Page', icon: Icon },
]
```

### Task: Add a New Edge Function

1. **Create Function Directory:**
```bash
mkdir supabase/functions/my-new-function
```

2. **Create Function:**
```typescript
// supabase/functions/my-new-function/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { param } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Your logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

3. **Deploy:**
```bash
supabase functions deploy my-new-function
```

### Task: Add Translations

```typescript
// src/lib/i18n.ts
export const translations = {
  ru: {
    // ...existing
    myNewKey: 'Мой новый текст',
  },
  en: {
    // ...existing
    myNewKey: 'My new text',
  }
}

// Usage in component
const { t } = useLanguage()
<p>{t('myNewKey')}</p>
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Mixing Service Role Key with Frontend
**Problem:** Service role key exposed in frontend code

**Solution:**
```typescript
// ❌ NEVER in frontend
import { SUPABASE_SERVICE_ROLE_KEY } from '@/config'

// ✅ ALWAYS use anon key in frontend
import { supabase } from '@/integrations/supabase/client'
```

### ❌ Mistake 2: Forgetting to Invalidate React Query Cache
**Problem:** UI doesn't update after mutation

**Solution:**
```typescript
const mutation = useMutation({
  mutationFn: updateFunction,
  onSuccess: () => {
    queryClient.invalidateQueries(['cache-key']) // Don't forget!
  }
})
```

### ❌ Mistake 3: Hardcoding User-Facing Text
**Problem:** Text not translatable

**Solution:**
```typescript
// ❌ WRONG
<button>Submit</button>

// ✅ CORRECT
<button>{t('submit')}</button>
```

### ❌ Mistake 4: Modifying Database Schema Directly
**Problem:** Schema out of sync, no rollback possible

**Solution:**
```bash
# ✅ ALWAYS create migration
supabase migration new add_field
# Edit the .sql file
# Then apply: supabase db push
```

### ❌ Mistake 5: Skipping Form Validation
**Problem:** Invalid data in database

**Solution:**
```typescript
// ✅ ALWAYS use Zod schema
const schema = z.object({
  name: z.string().min(2),
  age: z.number().min(18),
})

// Then use with React Hook Form
const form = useForm({
  resolver: zodResolver(schema),
})
```

---

## 🧪 Testing Your Changes

### Manual Testing Checklist

**Before Committing:**
- [ ] Run `npm run dev` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Test in browser (web interface)
- [ ] Test in Telegram (Mini App)
- [ ] Test admin panel
- [ ] Test both languages (RU/EN)
- [ ] Check browser console for errors
- [ ] Check Supabase logs for errors

**For Database Changes:**
- [ ] Migration runs successfully
- [ ] Rollback works
- [ ] Types regenerated (`npm run supabase:gen-types`)
- [ ] RLS policies still work

**For UI Changes:**
- [ ] Mobile responsive
- [ ] Dark mode support (Telegram themes)
- [ ] Loading states shown
- [ ] Error states handled
- [ ] Success feedback provided

---

## 🔍 Debugging Tips

### Problem: "Supabase client not initialized"
**Solution:** Check `.env` file has correct credentials

### Problem: "User not authenticated"
**Solution:** 
- Admin: Log in via `/admin/login`
- User: Must open via Telegram Bot

### Problem: "Row Level Security policy violation"
**Solution:** Check if operation requires service role key (backend)

### Problem: Edge Function not working
**Solution:**
1. Check Supabase logs
2. Verify environment variables set
3. Check CORS headers
4. Test with curl/Postman

### Problem: Translations not showing
**Solution:**
1. Check key exists in `lib/i18n.ts`
2. Check language context is provided
3. Check `t()` function used correctly

### Problem: Form not submitting
**Solution:**
1. Check validation errors in console
2. Check React Hook Form state
3. Check network tab for API calls
4. Check Supabase logs

---

## 📚 Architecture Quick Reference

### Tech Stack at a Glance
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React Query + React Hook Form
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Runtime:** Browser (frontend) + Deno (backend)
- **Platform:** Telegram Mini App + Web

### Key Design Patterns
1. **Dual Interface:** Telegram Mini App + Admin Panel
2. **Serverless Backend:** Supabase Edge Functions
3. **Database-Driven Config:** Settings in database
4. **Multi-Step Forms:** Wizard pattern for complex forms
5. **Status Workflows:** State machines for moderation

### Authentication
- **Users:** Telegram WebApp authentication
- **Admins:** Supabase Auth (email/password)
- **Backend:** Service role key in Edge Functions

### Important Hooks
- `useTelegram()` - Telegram WebApp integration
- `useLanguage()` - Translations
- `useAdminAuth()` - Admin authentication
- `useFormPersistence()` - Save form state

---

## 🎓 Learning Path

### Day 1: Setup & Orientation
- [ ] Clone and run project
- [ ] Explore file structure
- [ ] Read `PROJECT_CONTEXT.md`
- [ ] Test Telegram Mini App
- [ ] Test Admin Panel

### Day 2: Frontend Deep Dive
- [ ] Study PartnerForm.tsx (multi-step form)
- [ ] Understand React Query usage
- [ ] Explore component library (shadcn)
- [ ] Test language switching

### Day 3: Backend Deep Dive
- [ ] Study Supabase schema (types.ts)
- [ ] Read Edge Function examples
- [ ] Understand notification system
- [ ] Test bot webhook locally

### Day 4: Integration Understanding
- [ ] Telegram Bot API integration
- [ ] Card generation flow
- [ ] Channel publication flow
- [ ] Notification delivery

### Week 2: Make First Contribution
- [ ] Pick a small task (bug fix or small feature)
- [ ] Create branch
- [ ] Implement change
- [ ] Test thoroughly
- [ ] Submit PR

---

## 🆘 Where to Get Help

### Documentation
1. **PROJECT_CONTEXT.md** - Architectural decisions and rules
2. **PROJECT_ARCHITECTURE.md** - Detailed architecture overview
3. **This file** - Practical development guide

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [React Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run linter

# Supabase (if using CLI)
supabase start           # Start local Supabase
supabase db push         # Apply migrations
supabase functions deploy # Deploy function
supabase gen types       # Generate TypeScript types
```

---

## 🎯 Quick Wins (Easy First Tasks)

### Task 1: Add a New Category
1. Insert into `categories` table via Supabase dashboard
2. Test in forms (OrderForm, QuestionForm)
3. Verify in admin panel

### Task 2: Update Translation
1. Add/modify key in `src/lib/i18n.ts`
2. Test language switching
3. Commit changes

### Task 3: Improve Error Message
1. Find error message in code
2. Make it more user-friendly
3. Add translation if needed
4. Test error scenario

### Task 4: Add Loading State
1. Find component missing loading state
2. Add `isLoading` check
3. Show skeleton or spinner
4. Test loading scenario

### Task 5: Fix Responsive Issue
1. Find component not mobile-friendly
2. Add Tailwind responsive classes
3. Test on mobile screen size
4. Commit fix

---

## 🚀 Ready to Code?

You're now ready to start contributing! Remember:

✅ **DO:**
- Read `PROJECT_CONTEXT.md` for architectural rules
- Ask questions before making big changes
- Test thoroughly in both interfaces
- Write descriptive commit messages
- Check console for errors

❌ **DON'T:**
- Change core architecture without discussion
- Mix service role key with frontend
- Skip validation
- Hardcode user-facing text
- Modify database schema without migrations

**Good luck and happy coding! 🎉**

---

**Last Updated:** December 25, 2024
