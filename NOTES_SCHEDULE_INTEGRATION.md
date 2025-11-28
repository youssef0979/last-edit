# Notes & Schedule Integration

## Overview

This document describes the seamless integration between the Notes workspace and Schedule (time-blocking) system in Resolve. The integration allows users to connect their notes with time blocks, creating a unified productivity workflow.

---

## Key Features

### 1. Add to Timeline from Notes

**Location**: Notes workspace → Note cards  
**Trigger**: "Add to Timeline" button (appears on hover)  
**Behavior**: Opens a pre-filled dialog to schedule the note

**What Gets Pre-filled**:
- Title (from note title)
- Description (from note body)
- Icon (if the note has one)
- Color (matches note's background color)
- Note reference (invisible link maintained in database)

**User Flow**:
1. User hovers over a note card
2. "Add to Timeline" button becomes visible
3. User clicks button
4. Dialog opens with date picker and time selectors
5. Note preview shows at top (with icon, title, body)
6. User selects date and time range
7. Click "Add to Timeline"
8. Time block created on Schedule page with all note data

### 2. Note Preview from Time Blocks

**Location**: Schedule page → Timeline  
**Trigger**: Click on any time block linked to a note  
**Visual Indicator**: Small note icon (📝) appears in time block header

**Behavior**:
- Clicking a linked time block opens note preview dialog
- Preview shows full note content without leaving the timeline
- Non-intrusive modal that can be quickly dismissed

**Preview Content**:
- Note title with icon
- Full note body text
- Checklist progress (if applicable)
- Tags (if any)
- "Open in Notes" button to navigate to full Notes workspace

### 3. Checklist Progress Indicator

**Location**: Schedule page → Timeline → Time blocks with linked notes containing checklists  
**Visual**: Small checkmark icon with completion ratio

**Display Format**: `✓ 3/5` (3 completed out of 5 total items)  
**Position**: Below the time block title/description  
**Purpose**: Quick visibility into task completion without opening preview

**Calculation**:
- Automatically counts checked vs unchecked items
- Updates in real-time when note checklist is modified
- Only appears if note has a checklist with at least one item

---

## Database Schema

### Notes Table
```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  body TEXT,
  checklist JSONB,
  color TEXT DEFAULT '#ffffff',
  icon TEXT,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Time Blocks Table
```sql
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Relationship
- **Type**: One-to-many (one note can be linked to multiple time blocks)
- **Foreign Key**: `time_blocks.note_id` → `notes.id`
- **On Delete**: SET NULL (deleting a note doesn't delete time blocks, just removes the link)
- **Indexed**: Yes, for fast lookups

---

## Visual Design Integration

### Unified Color System
Both systems share the same color palette, ensuring visual consistency:
- Notes and their linked time blocks use identical colors
- Color picker in notes matches schedule color options
- Muted, professional palette throughout

### Consistent Iconography
- Icons from notes transfer to time blocks
- Small StickyNote icon indicates linked blocks
- CheckCircle icon shows checklist progress
- All icons from Lucide React library (consistent stroke width, style)

### Cohesive Motion
- 100-150ms transitions throughout
- Hover states use same shadow elevation changes
- Dialog animations match across both systems
- Subtle, never distracting

### Shared Components
- Dialog system (same base component)
- Button styles (identical variants and sizes)
- Input fields (same styling and validation)
- Color pickers (unified preset selection)

---

## User Experience Flow

### Creating a Scheduled Note Session

**Scenario**: User wants to schedule focused time to work on a note's checklist

1. **In Notes Workspace**:
   - User creates/edits note with checklist items
   - Adds descriptive title and icon
   - Clicks "Add to Timeline"

2. **In Timeline Dialog**:
   - Sees preview of note content
   - Selects tomorrow's date
   - Sets 9:00 AM - 10:30 AM time slot
   - Confirms

3. **In Schedule View**:
   - Time block appears with note's color and icon
   - Shows "3/8" checklist progress
   - Block is clearly marked as linked (note icon)

4. **During Session**:
   - User clicks time block to review checklist
   - Preview opens instantly
   - Can click "Open in Notes" to edit/complete items
   - Returns to Schedule view

5. **After Completion**:
   - Checklist progress updates automatically
   - Time block shows "8/8" completion
   - Visual satisfaction of finished work

### Reviewing Past Notes

**Scenario**: User wants to see which notes they scheduled last week

1. Navigate to Schedule
2. Scroll back to previous days
3. Time blocks with note icon show past scheduled notes
4. Click any block to see what was planned
5. Use "Open in Notes" to revisit content

---

## Technical Implementation

### State Management
- React Query for data fetching and caching
- Automatic cache invalidation when notes/blocks update
- Optimistic UI updates for instant feedback

### Data Validation
- Zod schemas validate all user inputs
- Title length limits (200 chars)
- Time format validation (HH:mm)
- Proper error messages

### Performance
- Indexed database queries for fast lookups
- Lazy loading of note preview data (only when dialog opens)
- Debounced checklist progress calculations
- Minimal re-renders through React Query

### Error Handling
- Toast notifications for user feedback
- Graceful degradation if note is deleted
- Clear error messages with context
- Automatic retry on network failures

---

## Future Enhancements

### Potential Features (Not Yet Implemented)

1. **Two-Way Sync**
   - Create note directly from schedule
   - Auto-link newly created notes during scheduled time

2. **Smart Scheduling**
   - AI suggests optimal time slots based on note priority
   - Recurring note sessions (daily journaling, etc.)

3. **Progress Tracking**
   - Historical completion rate graphs
   - Time spent vs. estimated time
   - Productivity insights

4. **Collaboration**
   - Share scheduled note sessions with friends
   - Collaborative checklist completion
   - Joint planning sessions

5. **Reminders**
   - Push notifications when scheduled note time approaches
   - Desktop notifications for checklist items
   - Email digests of upcoming scheduled notes

---

## Design Principles

### 1. Non-Intrusive
- Integration enhances but doesn't dominate
- Users can use Notes or Schedule independently
- Linking is optional, never required

### 2. Contextual
- Information appears when and where it's needed
- No clutter when features aren't being used
- Progressive disclosure of complexity

### 3. Unified
- Shared visual language across systems
- Consistent interaction patterns
- Seamless navigation between contexts

### 4. Fast
- Instant UI feedback
- Quick transitions
- Minimal loading states
- Optimistic updates

### 5. Obvious
- Clear visual indicators (icons, colors)
- Discoverable actions (hover states)
- Intuitive workflows
- No hidden features

---

## Testing Checklist

- [ ] Create note and add to timeline
- [ ] Verify pre-filled data matches note
- [ ] Click time block to see preview
- [ ] Confirm checklist progress displays correctly
- [ ] Edit note, verify time block updates
- [ ] Delete note, confirm time block remains (unlinked)
- [ ] Try scheduling same note multiple times
- [ ] Test with notes that have no checklist
- [ ] Test with notes that have no icon
- [ ] Verify mobile responsive behavior

---

## Accessibility

- All dialogs have proper ARIA labels
- Keyboard navigation fully supported
- Focus management in modals
- Screen reader announcements for state changes
- High contrast indicators for linked blocks
- Touch targets meet 44x44px minimum

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Integration Status**: ✅ Complete
