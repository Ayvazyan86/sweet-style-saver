# Project Architecture Documentation

## Project Overview

**Project Name:** Sweet Style Saver (Айвазян рекомендует)

**Project Type:** Telegram Mini App with Web Admin Panel

**Purpose:** A platform connecting service professionals (partners) with customers through a Telegram bot ecosystem. Partners can apply to join the platform, customers can place orders and ask questions, and administrators moderate all content.

**Scope:** Full-stack application featuring:
- Telegram Mini App for end-users (partner applications, orders, questions)
- Web-based Admin Panel for moderation and management
- Telegram Bot for user interaction and notifications
- Supabase Backend for data persistence and serverless functions
- Automated card generation for partner profiles
- Channel publication system for approved partners

---

## Architecture Style

**Primary Pattern:** Multi-Layer Architecture with Serverless Backend

**Architecture Components:**

### 1. Presentation Layer (Frontend)
- **React SPA** with TypeScript
- **Dual Interface Pattern:**
  - Telegram Mini App UI (for Telegram users)
  - Web Landing Page (for web visitors)
  - Admin Dashboard (for moderators)
- **Component-Based Architecture** using shadcn/ui design system

### 2. Application Layer (Business Logic)
- React hooks for state management and business operations
- Custom hooks for domain-specific logic (forms, authentication, Telegram integration)
- React Query for server state management and caching

### 3. Backend Layer (Serverless)
- **Supabase Edge Functions** (Deno runtime)
- RESTful API pattern
- Event-driven architecture for notifications
- Telegram Bot API integration

### 4. Data Layer
- **PostgreSQL** (via Supabase)
- **Relational Schema** with foreign key constraints
- Row-Level Security (RLS) policies
- Storage buckets for media files

---

## Technology Stack

### Frontend Stack

#### Core Framework
- **React 18.3.1** - UI library
  - Role: View layer and component composition
  - Layer: Presentation
  - Responsibility: User interface rendering and interaction

- **TypeScript 5.8.3** - Language
  - Role: Type-safe development
  - Layer: All layers
  - Responsibility: Static type checking and IDE support

- **Vite 5.4.19** - Build tool
  - Role: Development server and bundler
  - Layer: Build/Development
  - Responsibility: Fast HMR, production builds

#### Routing & State Management
- **React Router DOM 6.30.1** - Client-side routing
  - Role: Navigation and route management
  - Layer: Presentation
  - Responsibility: SPA routing, lazy loading pages

- **TanStack React Query 5.83.0** - Server state management
  - Role: Data fetching, caching, synchronization
  - Layer: Application
  - Responsibility: Server state cache, background updates, optimistic updates

#### UI Framework
- **shadcn/ui** - Component library
  - Role: Pre-built, accessible UI components
  - Layer: Presentation
  - Responsibility: Consistent design system

- **Radix UI** - Headless component primitives
  - Role: Accessible, unstyled component foundation
  - Layer: Presentation
  - Responsibility: Accessibility, keyboard navigation, ARIA

- **Tailwind CSS 3.4.17** - Utility-first CSS
  - Role: Styling framework
  - Layer: Presentation
  - Responsibility: Rapid UI development, responsive design

- **Framer Motion 12.23.26** - Animation library
  - Role: UI animations and transitions
  - Layer: Presentation
  - Responsibility: Page transitions, micro-interactions

#### Form Management
- **React Hook Form 7.61.1** - Form state management
  - Role: Form validation and state
  - Layer: Application
  - Responsibility: Form handling, validation, submission

- **Zod 3.25.76** - Schema validation
  - Role: Runtime type validation
  - Layer: Application
  - Responsibility: Input validation, type safety

- **@hookform/resolvers 3.10.0** - Validation bridge
  - Role: Connect Zod with React Hook Form
  - Layer: Application
  - Responsibility: Schema validation integration

#### Additional Libraries
- **Lucide React 0.462.0** - Icon library
  - Role: SVG icon system
  - Layer: Presentation
  - Responsibility: Consistent iconography

- **date-fns 3.6.0** - Date utilities
  - Role: Date formatting and manipulation
  - Layer: Application
  - Responsibility: Date calculations, localization

- **Sonner 1.7.4** - Toast notifications
  - Role: User feedback system
  - Layer: Presentation
  - Responsibility: Success/error messages

- **canvas-confetti 1.9.4** - Celebration effects
  - Role: Success animations
  - Layer: Presentation
  - Responsibility: Visual feedback

- **fabric 6.9.1** - Canvas manipulation
  - Role: Image editing capabilities
  - Layer: Application
  - Responsibility: Card template customization

### Backend Stack

#### Backend-as-a-Service
- **Supabase** - Complete backend platform
  - Role: Authentication, database, storage, serverless functions
  - Layer: Backend
  - Responsibility: All backend operations

- **@supabase/supabase-js 2.89.0** - Supabase client
  - Role: Frontend-to-backend communication
  - Layer: Integration
  - Responsibility: API calls, real-time subscriptions

#### Database
- **PostgreSQL 14.1** - Relational database
  - Role: Primary data store
  - Layer: Data
  - Responsibility: Persistent storage, referential integrity, ACID transactions

#### Serverless Functions Runtime
- **Deno** - JavaScript/TypeScript runtime
  - Role: Serverless function execution
  - Layer: Backend
  - Responsibility: Edge function execution, Telegram webhooks

#### External Services Integration
- **Telegram Bot API** - Bot platform
  - Role: User interface through Telegram
  - Layer: Integration
  - Responsibility: Bot commands, webhooks, message delivery

- **Telegram Mini Apps SDK** - WebApp integration
  - Role: Telegram native UI integration
  - Layer: Integration
  - Responsibility: Native Telegram UI features, haptic feedback

### Development Tools

#### Linting & Code Quality
- **ESLint 9.32.0** - Linter
  - Role: Code quality enforcement
  - Responsibility: Style consistency, error prevention

- **TypeScript ESLint 8.38.0** - TypeScript rules
  - Role: TypeScript-specific linting
  - Responsibility: Type-aware linting

#### Build Tooling
- **@vitejs/plugin-react-swc 3.11.0** - React plugin
  - Role: Fast React refresh
  - Responsibility: HMR, JSX transformation

- **PostCSS 8.5.6** - CSS processor
  - Role: CSS transformation
  - Responsibility: Autoprefixing, Tailwind processing

- **Autoprefixer 10.4.21** - CSS compatibility
  - Role: Browser compatibility
  - Responsibility: CSS vendor prefixes

---

## Directory Structure Analysis

### Frontend Structure (`/src`)

```
src/
├── components/          # React components
│   ├── admin/          # Admin panel components
│   ├── mini-app/       # Telegram Mini App components
│   └── ui/             # shadcn/ui base components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client & types
├── lib/                # Utility libraries
├── pages/              # Route pages
│   └── admin/          # Admin panel pages
├── App.tsx             # Application root
├── main.tsx            # Entry point
└── index.css           # Global styles
```

### Backend Structure (`/supabase`)

```
supabase/
├── functions/          # Edge Functions (Deno)
│   ├── telegram-webhook/           # Bot webhook handler
│   ├── generate-partner-card/      # Card image generation
│   ├── publish-partner-to-channel/ # Channel publishing
│   ├── notify-*/                   # Notification functions
│   ├── geocode-*/                  # Geocoding services
│   └── check-telegram-channel/     # Channel validation
├── migrations/         # Database schema migrations
└── config.toml         # Supabase configuration
```

### Key Responsibilities by Directory

#### `/src/components/mini-app/`
- Partner application form components
- Order and question form components
- Photo upload and preview
- Form validation and submission
- Progress tracking
- Template selection

#### `/src/components/admin/`
- Admin authentication layout
- Navigation sidebar
- Admin-specific UI patterns

#### `/src/pages/admin/`
- Application moderation interface
- Partner management
- Order and question moderation
- Settings management
- Dashboard and analytics
- Notification management
- Card template management
- Profession management

#### `/src/hooks/`
- `useTelegram` - Telegram WebApp integration
- `useAdminAuth` - Admin authentication logic
- `useFormFieldSettings` - Dynamic form configuration
- `useFormPersistence` - Form state persistence
- `usePartnerStatus` - Partner status queries
- `useSuccessSound` - Success feedback

#### `/src/contexts/`
- `LanguageContext` - Internationalization (RU/EN)

#### `/supabase/functions/`
- Telegram bot command handlers
- Partner card image generation (SVG to PNG)
- Telegram channel publication
- Notification dispatching
- Geocoding services
- Channel validation

---

## Core Domain Entities

### User Profiles
**Table:** `profiles`
- Telegram user data
- Language preferences
- Created via Telegram webhook

### Partner Applications
**Table:** `partner_applications`
- Status workflow: `pending` → `approved` / `rejected`
- Personal information (name, age, profession, city)
- Business details (agency, description)
- Contact information (phone, website, social media)
- Photo and template selection
- Moderation metadata

### Partner Profiles
**Table:** `partner_profiles`
- Created from approved applications
- Active partner data
- Partner types: `star` / `paid` / `free`
- Status: `active` / `inactive` / `archived`
- Channel post tracking
- Payment tracking

### Orders
**Table:** `orders`
- Customer service requests
- Status workflow: `pending` → `approved` → `awaiting_partners` → `active` / `expired`
- Category-based
- Budget and contact information
- Published to partner private channels

### Questions
**Table:** `questions`
- Customer inquiries
- Similar workflow to orders
- Published to expert partners

### Categories
**Table:** `categories`
- Service categories
- Multilingual support (RU/EN)
- Links orders, questions, partners

### Professions
**Table:** `professions`
- Partner profession taxonomy
- Grouped by profession categories
- Multilingual support

### Card Templates
**Table:** `card_templates`
- Visual templates for partner cards
- Configurable text positioning and styling
- Default template support

---

## Key Use Cases

### 1. Partner Onboarding Flow

```
User opens Telegram Bot
  → /start command received
  → Profile created in database
  → Menu displayed with Mini App button
  → User opens "Become Partner" form
  → Multi-step form completion:
     1. Photo upload
     2. Personal data (name, age, profession, city)
     3. Work details (agency, description, categories)
     4. Contacts (phone, telegram, website, socials)
     5. Video platforms
     6. Office address
     7. Card template selection
     8. Preview
  → Form submission
  → Application stored with status: pending
  → Admin notification sent
  → Admin reviews application
  → Admin approves:
     → partner_profile created
     → Card generated (Edge Function)
     → Posted to Telegram channel (Edge Function)
     → Success notification to partner
  → OR Admin rejects:
     → Rejection reason provided
     → Rejection notification to partner
```

### 2. Order Placement Flow

```
Customer opens Order Form
  → Telegram authentication
  → Select category
  → Fill order details (text, budget, city, contact)
  → Submit order
  → Order stored with status: pending
  → Admin notification
  → Admin reviews and approves
  → Order status: awaiting_partners
  → Order published to relevant partner private channels
  → Partners receive notification
  → Order becomes active
```

### 3. Partner Card Generation

```
Admin approves partner application
  → Trigger: generate-partner-card function
  → Fetch partner data + template
  → Download template image (convert to base64)
  → Download partner photo (if exists)
  → Generate SVG with overlay:
     - Partner photo (circular crop)
     - Name, profession, city, age
  → Convert SVG to PNG (via resvg-wasm)
  → Upload to Supabase Storage
  → Return public URL
  → Update partner profile with card URL
```

### 4. Admin Moderation

```
Admin logs in (email + password)
  → Supabase Auth verification
  → Role check (user_roles table)
  → Admin panel access granted
  → View pending applications/orders/questions
  → Review content
  → Approve or reject with reason
  → Status updated in database
  → Notifications triggered
  → Moderation log created
```

---

## Data Flow Architecture

### User-Facing Flow (Telegram Mini App)

```
Telegram User
  ↓ (WebApp API)
React App (Mini App)
  ↓ (supabase-js client)
Supabase API
  ↓
PostgreSQL Database
```

### Admin Flow

```
Admin Browser
  ↓ (HTTPS)
React App (Admin Panel)
  ↓ (supabase-js client, authentication)
Supabase Auth + API
  ↓
PostgreSQL Database + RLS
```

### Bot Interaction Flow

```
Telegram User
  ↓ (Bot commands)
Telegram Bot API
  ↓ (Webhook)
telegram-webhook Edge Function
  ↓
Supabase Database
```

### Notification Flow

```
Database Trigger (application approved)
  ↓
notify-application-result Edge Function
  ↓
Telegram Bot API
  ↓
User receives message in Telegram
```

### Card Generation Flow

```
Admin approves application
  ↓ (API call)
generate-partner-card Edge Function
  ↓ (fetch data)
Supabase Database + Storage
  ↓ (generate image)
SVG → PNG conversion
  ↓ (upload)
Supabase Storage
  ↓ (return URL)
Partner profile updated
```

### Channel Publication Flow

```
Admin publishes partner
  ↓ (API call)
publish-partner-to-channel Edge Function
  ↓ (fetch data)
Supabase Database
  ↓ (format message)
Caption generation
  ↓ (send)
Telegram Bot API → Channel
  ↓ (track)
channel_post_id saved to database
```

---

## Integration Points

### 1. Supabase Integration
**Client:** `@/integrations/supabase/client.ts`
- Authentication persistence (localStorage)
- Auto token refresh
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2. Telegram Bot Integration
**Entry:** `telegram-webhook/index.ts`
- Commands: `/start`, `/help`, `/menu`, `/status`
- User profile creation/update
- Mini App URL generation
- Status checking

### 3. Telegram Mini App Integration
**Hook:** `useTelegram.ts`
- WebApp API access
- User data extraction
- Haptic feedback
- Theme detection
- Main Button control
- Back Button control

### 4. Geocoding Integration
**Functions:** `geocode-city/`, `geocode-address/`
- Address validation
- Coordinate resolution
- City autocomplete

### 5. Image Generation Integration
**Function:** `generate-partner-card/`
- SVG generation
- resvg-wasm for PNG conversion
- Supabase Storage for hosting

---

## Security Model

### Authentication
- **Admin Panel:** Supabase Auth (email/password)
- **Telegram Users:** Telegram WebApp authentication (initData validation)
- **Edge Functions:** Service role key for privileged operations

### Authorization
- **Role-Based Access Control (RBAC)**
  - Roles: `admin`, `moderator`
  - Stored in `user_roles` table
  - Checked via `has_role()` database function

### Row-Level Security (RLS)
- Database policies enforce data access
- Users can only access their own data
- Admins bypass restrictions via service role

### API Security
- Edge functions use CORS headers
- Service role key for backend operations
- JWT verification configurable per function

---

## Configuration Management

### Environment Variables
**Frontend (.env):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key

**Backend (Supabase secrets):**
- `SUPABASE_URL` - Internal Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin API key
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

### Settings Table
**Database-driven configuration:**
- `telegram_channel_id` - Target channel for partner posts
- `telegram_discussion_chat_id` - Discussion group ID
- Notification templates
- Form field settings (visibility, requirement)

### Build Configuration
**vite.config.ts:**
- Path aliases (`@/` → `./src`)
- React SWC plugin
- Dev server on port 8080
- Component tagging for development

**tailwind.config.ts:**
- Custom color system (HSL variables)
- Animation keyframes
- Design tokens

---

## Deployment Architecture

### Frontend Deployment
- **Platform:** Lovable.dev (mentioned in README)
- **Build:** `npm run build` → static assets
- **Hosting:** CDN-based SPA hosting
- **Redirects:** `public/_redirects` for SPA routing

### Backend Deployment
- **Platform:** Supabase Cloud
- **Functions:** Auto-deployed from `/supabase/functions/`
- **Database:** Managed PostgreSQL
- **Storage:** S3-compatible object storage

### Telegram Bot Setup
- **Webhook URL:** Points to `telegram-webhook` function
- **Mini App URL:** Frontend deployment URL
- **Bot Commands:** Configured via BotFather

---

## State Management Strategy

### Server State (React Query)
- Queries for data fetching
- Mutations for write operations
- Automatic cache invalidation
- Optimistic updates
- Background refetching

### Local State (React)
- Component state via `useState`
- Form state via React Hook Form
- Global state via Context API (Language)

### Persistent State
- Form persistence in localStorage (via `useFormPersistence`)
- Telegram user preferences
- Admin session (Supabase Auth)

---

## Internationalization (i18n)

**Implementation:** Custom translation system
**File:** `lib/i18n.ts`
**Supported Languages:** Russian (ru), English (en)

**Context:** `LanguageContext`
- Auto-detect from Telegram user language
- Manual language switching
- Translation function `t(key, language)`

**Coverage:**
- Form labels
- Navigation
- Buttons
- Status messages
- Placeholders
- Error messages

---

## Form Field Configuration System

**Table:** `form_field_settings`
**Purpose:** Dynamic form configuration without code changes

**Features:**
- Toggle field visibility
- Toggle field requirement
- Multilingual labels
- Sort order customization
- Form type categorization (partner, order, question)

**Hook:** `useFormFieldSettings`
- Fetches configuration from database
- Applies to forms dynamically

---

## Error Handling & Logging

### Frontend Error Handling
- Toast notifications (Sonner) for user feedback
- React Query error states
- Form validation errors (Zod)
- Try-catch blocks in async operations

### Backend Error Handling
- Edge functions return 200 OK to Telegram (prevent retries)
- Error logging to console (Supabase logs)
- Notification error tracking table (`notification_errors`)
- Moderation logs for audit trail

### Error Types Tracked
- Notification delivery failures
- Channel posting errors
- Geocoding failures
- Image generation failures

---

## Database Schema Highlights

### Enums
- `app_role`: admin, moderator
- `application_status`: pending, approved, rejected
- `partner_status`: active, inactive, archived
- `partner_type`: star, paid, free
- `request_status`: pending, approved, rejected, awaiting_partners, active, expired
- `field_type`: string, text, number, phone, url, select

### Key Relationships
- `profiles` → `partner_applications` (one-to-many)
- `partner_applications` → `partner_profiles` (one-to-one)
- `partner_profiles` → `payments` (one-to-many)
- `categories` ← many-to-many → `partner_profiles`
- `orders` / `questions` → `categories` (many-to-one)
- `orders` / `questions` → publication tracking

### Moderation System
- `moderation_logs` table for audit trail
- Moderated by admin reference
- Rejection reason tracking
- Moderation timestamp

---

## Performance Considerations

### Frontend Optimization
- Code splitting via React Router
- Lazy loading of admin routes
- Image optimization via Supabase CDN
- React Query caching reduces API calls

### Database Optimization
- Indexes on frequently queried fields
- Foreign key constraints for referential integrity
- Query optimization via joins
- Timestamps for sorting and filtering

### Edge Function Optimization
- Deno runtime (fast startup)
- Minimal dependencies
- Image optimization (SVG → PNG)
- Base64 encoding for image transport

---

## Monitoring & Analytics

### Built-in Tracking
- Channel statistics (`channel_stats` table)
- Application submission tracking
- Order and question metrics
- Payment tracking

### Admin Dashboard
- Pending item counts
- Status distribution
- Recent activity
- Partner types distribution

---

## External Dependencies

### Runtime Dependencies
- Node.js (development)
- Deno (Edge Functions)
- PostgreSQL (Supabase managed)

### Third-Party Services
- Supabase (Backend platform)
- Telegram Bot API
- Lovable.dev (hosting platform)
- CDN for static assets

---

## Conventions & Standards

### Code Style
- TypeScript strict mode disabled (for flexibility)
- ESLint for code quality
- Functional components (React)
- Hooks pattern

### Naming Conventions
- PascalCase for components
- camelCase for functions/variables
- snake_case for database fields
- kebab-case for file names (URLs)

### File Organization
- Co-location of related components
- Separation of admin and mini-app components
- Shared UI components in `/ui`
- Custom hooks in `/hooks`

---

## Testing Strategy

**Current State:** No explicit test files present

**Recommended Approach:**
- Unit tests for utility functions
- Integration tests for form submission
- E2E tests for critical flows
- Manual QA for Telegram integration

---

## Documentation Standards

### Code Documentation
- TypeScript interfaces for type documentation
- JSDoc comments where needed
- README for project setup

### API Documentation
- Database schema via Supabase types
- Edge function parameters documented in code
- Environment variables documented in README

---

## Version Control

**Repository Structure:**
- Git-based version control
- Migration files timestamped
- Linear migration history

**Branch Strategy:** (Not specified in codebase)

---

## Future Scalability Notes

### Current Bottlenecks
- Image generation (synchronous, CPU-intensive)
- Notification delivery (sequential)
- Single database instance

### Scaling Opportunities
- Implement queue for image generation
- Batch notification delivery
- Read replicas for reporting
- CDN caching for generated cards
- Background job processing

---

This architecture document reflects the **current state** of the codebase as analyzed from the repository. No assumptions or extrapolations beyond the visible code have been made.
