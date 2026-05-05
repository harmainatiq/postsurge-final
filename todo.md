# AI Social Media Post Generator - TODO

## Phase 1: Database Schema & Planning
- [x] Design database schema for brand guidelines
- [x] Design database schema for generated posts
- [x] Design database schema for post scheduling metadata
- [x] Generate and apply database migrations

## Phase 2: Email/Password Authentication
- [x] Create email/password registration flow
- [x] Create email/password login flow
- [x] Add password hashing and validation
- [x] Integrate with existing auth system

## Phase 3: Brand Guidelines Management
- [x] Create brand guidelines form (tone, style, content preferences)
- [x] Build brand guidelines storage and retrieval
- [x] Add brand guidelines editing interface
- [x] Display active brand guidelines in dashboard

## Phase 4: AI Post Generation Engine
- [x] Build AI prompt system using brand guidelines
- [x] Implement bulk post generation (30 posts at once)
- [x] Add topic input interface
- [x] Store generated posts in database
- [x] Display generated posts in UI

## Phase 5: Post Management Dashboard
- [x] Create post selection interface with checkboxes
- [x] Build post editing modal/interface
- [x] Implement post deletion
- [x] Add post history view
- [x] Show scheduled vs draft posts

## Phase 6: Zapier Integration
- [x] Create webhook endpoint for Zapier
- [x] Add scheduling metadata to posts
- [x] Send selected posts to Zapier webhook
- [x] Document Zapier setup instructions

## Phase 7: Design System & UI Polish
- [x] Choose elegant color palette and typography
- [x] Apply minimal modern design throughout
- [x] Create consistent navigation structure
- [x] Add loading states and animations
- [x] Polish all forms and interactions

## Phase 8: Testing & Quality Assurance
- [x] Test complete user flow from signup to scheduling
- [x] Verify AI generation quality
- [x] Test Zapier webhook integration
- [x] Check responsive design on mobile
- [x] Create production checkpoint

## Phase 9: Deployment
- [x] Deploy to production
- [x] Verify live deployment
- [x] Provide live preview link to user

## New Feature Requests

### In-App Scheduling System
- [x] Add scheduledTime field to posts table (Pakistan timezone)
- [x] Create scheduling interface with date/time picker
- [x] Change "Send to Zapier" to "Schedule on Facebook"
- [x] Implement automatic Zapier webhook trigger at scheduled time
- [x] Add background job/cron for scheduled post processing

### Settings Page
- [x] Create settings database table for webhook URL
- [x] Build settings page UI
- [x] Add webhook URL management
- [x] Add username editing functionality
- [x] Store webhook URL per user
- [x] Auto-use stored webhook for scheduling

### Design Refinement
- [x] Remove all border radius (sharp corners)
- [x] Change all buttons to black
- [x] Integrate unique custom icons
- [x] Add custom unique font (Space Grotesk)
- [x] Perfect all alignments and spacing
- [x] Make design look less AI-generated

## Bug Fixes

### Scheduling System
- [x] Fix immediate Zapier sending - posts should only send at scheduled time
- [x] Implement background cron job to check for posts ready to send
- [x] Update scheduling flow to mark posts as "pending" not "scheduled"
- [x] Send to Zapier only when current time >= scheduled time
- [x] Test delayed sending with future scheduled times

## New Feature: Landing Page & Onboarding

### Landing Page
- [x] Create hero section with value proposition
- [x] Add features showcase (AI generation, brand guidelines, scheduling)
- [x] Add benefits section (time savings, consistency, automation)
- [x] Add founder section with image and bio
- [x] Add login/signup CTAs throughout page
- [x] Make page responsive and modern

### Onboarding Flow
- [x] Step 1: Name setup
- [x] Step 2: Zapier webhook instructions with visual guide
- [x] Step 3: Brand guidelines setup (optional, can skip)
- [x] Step 4: Redirect to dashboard
- [x] Add progress indicator
- [x] Save onboarding state to prevent re-showing

## Bug Fixes: Authentication Flow

- [x] Fix OAuth callback redirect to go to onboarding instead of dashboard
- [x] Fix logout to redirect back to landing page (/)
- [x] Update founder name from Hamza Liaqat to Lorem Ipsum
- [x] Test complete flow: landing → signup → onboarding → dashboard → logout → landing
