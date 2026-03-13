# Academy Registration System — Design Document

**Date:** 2026-03-12
**Status:** Approved

## Overview

Public web page where coaches/masters register their athletes for tournaments via a link shared by the organizer. Identification by phone (WhatsApp), athletes saved in the cloud for reuse between tournaments.

## Key Decisions

- **No login required** — identification by phone number (WhatsApp)
- **Cloud persistence** — athletes saved in Supabase, reusable across tournaments
- **User = organizer** — whoever creates the tournament in the app is the federation/organizer
- **No payment gateway** — only manual tracking (fee amount + instructions text + manual paid/pending status)
- **Mandatory review** — coach must confirm each athlete before submitting
- **Auto-category** — category calculated from age + belt + weight + gender

## Coach Flow (4 Screens)

### Screen 1: Identification
- Academy name, coach name, phone (WhatsApp)
- If phone exists → loads saved academy + athletes
- If new → creates registration

### Screen 2: Select Athletes
- List of saved athletes (checkbox to select)
- "Add new athlete" button → modal: Name, Birth Date, Gender, Belt, Weight
- Can edit weight/belt of existing athletes (changes between tournaments)
- Category auto-calculated

### Screen 3: Mandatory Review
- Table with all selected athletes + calculated category
- Coach MUST confirm each athlete (checkbox)
- Warning: "Check all data. Errors may generate incorrect matches."
- Submit only enabled when all reviewed

### Screen 4: Confirmation
- Registration summary
- Payment instructions (if configured)
- Protocol number
- "Awaiting organizer approval"

## Organizer Flow (Central Integration)

- Central sees list of pending registrations
- Can approve/reject each registration
- On approve → athletes auto-imported into tournament
- Payment status: manual toggle (paid/pending)
- Tournament config: optional fee amount + payment instructions text

## Database Schema (New Supabase Tables)

### `open_tournaments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | Tournament name |
| date | date | Tournament date |
| location | text | |
| registration_deadline | timestamptz | |
| fee_amount | numeric | Optional |
| fee_instructions | text | Free text (Pix key, bank info, etc.) |
| status | text | open / closed |
| created_by | uuid FK → auth.users | The organizer |
| created_at | timestamptz | |

### `academy_coaches`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| academy_name | text | |
| coach_name | text | |
| phone | text UNIQUE | WhatsApp number as identifier |
| created_at | timestamptz | |

### `academy_athletes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| coach_id | uuid FK → academy_coaches | |
| name | text | |
| birth_date | date | |
| gender | text | M / F |
| belt | text | |
| created_at | timestamptz | |

### `tournament_registrations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK → open_tournaments | |
| coach_id | uuid FK → academy_coaches | |
| status | text | pending / approved / rejected |
| payment_status | text | pending / paid |
| submitted_at | timestamptz | |
| reviewed_at | timestamptz | |

### `registration_athletes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| registration_id | uuid FK → tournament_registrations | |
| athlete_id | uuid FK → academy_athletes | |
| weight | numeric | Weight at time of registration |
| belt | text | Belt at time of registration |
| category | text | Auto-calculated |
| reviewed_by_coach | boolean | Must be true before submit |

## Technology

- **Frontend:** React + Tailwind (same repo, public route or separate build)
- **Backend:** Supabase (tables + RLS policies)
- **No auth required** for coaches — phone-based identification
- **RLS:** open_tournaments readable by all, writable by creator; coach data writable by anyone (public registration)

## Future Considerations

- Payment gateway integration (Pix API)
- Federation entity (separate from user)
- Email/SMS notifications
- Registration editing after submission
