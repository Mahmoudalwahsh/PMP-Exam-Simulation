# PMP Exam Simulator - Design Guidelines

## Design Approach
**Utility-Focused Design System** inspired by professional testing platforms (Pearson VUE, Khan Academy). Prioritizes distraction-free exam conditions, clear information hierarchy, and sustained readability during 230-minute sessions.

## Core Design Principles
1. **Maximum Focus**: Eliminate visual noise to maintain concentration during long exam sessions
2. **Clear Hierarchy**: Question content always primary, controls and navigation secondary
3. **Stress Reduction**: Calm, professional aesthetics to reduce test anxiety
4. **Accessible Information**: Critical exam data (timer, progress, question number) always visible but non-intrusive

## Typography System

**Font Stack**: 'Open Sans', 'Roboto', -apple-system, sans-serif

**Scale**:
- Question Text: text-lg (18px) - primary reading size for comfort
- Question Numbers/Labels: text-sm font-semibold uppercase tracking-wide
- Timer Display: text-2xl font-bold tabular-nums
- Section Headings: text-xl font-semibold
- Body/Explanations: text-base (16px) leading-relaxed
- Button Text: text-sm font-medium uppercase tracking-wider

**Weights**: Regular (400) for body, Medium (500) for UI elements, Semibold (600) for headings, Bold (700) for emphasis

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Card spacing: space-y-6
- Button padding: px-6 py-3

**Container Widths**:
- Exam interface: max-w-5xl (optimal reading width for questions)
- Results table: max-w-7xl (accommodate detailed review data)
- Exam selection: max-w-4xl

**Grid System**:
- Question navigation grid: 10 columns (grid-cols-10) for 180 questions
- Domain breakdown: 3 columns on desktop, stack on mobile
- Answer options: Single column vertical list

## Color Palette

**Brand Identity**:
Powered by **Patrons Consulting** - professional project management training and certification services.

**Primary Colors**:
- Primary Teal: HSL(174, 60%, 35%) - Patrons brand color (action buttons, active states, links)
- Secondary Teal: HSL(174, 40%, 55%) - Lighter teal for accents and highlights
- Background: Clean white/light gray canvas
- Text: Dark gray for primary content

**Semantic Colors**:
- Success: Green (correct answers, pass indicators)
- Warning: Amber (marked for review, time warnings)
- Error: Red (incorrect answers, fail indicators)
- Neutral Gray: Secondary text and borders

**Application**:
- Question cards: white bg, subtle border
- Selected answer: teal-tinted background with primary border
- Correct answer highlight: green-tinted background
- Incorrect answer highlight: red-tinted background
- Marked questions: amber border emphasis

## Component Library

**Exam Interface Components**:
1. **Fixed Header Bar** (sticky top-0): Timer (left), Exam Title (center), Progress indicator (right) - bg-white shadow-sm border-b px-8 py-4
2. **Question Card**: Large white card with generous padding (p-8), question number badge (top-left), question text (text-lg leading-relaxed)
3. **Answer Options**: Radio button list, each option in card-like container (p-4 border rounded-lg), hover state with subtle bg change
4. **Navigation Panel** (bottom): Previous/Next buttons (primary style), Mark for Review checkbox, Question grid toggle
5. **Question Navigator**: Overlay panel showing all 180 questions in 10-column grid, color-coded (answered/unanswered/marked)

**Pause Modal**: Full-screen overlay (bg-gray-900 bg-opacity-90), centered card with blur backdrop, large pause icon, resume button

**Results Components**:
1. **Score Summary Card**: Hero-style card showing percentage score (text-6xl font-bold), pass/fail status with appropriate color
2. **Domain Breakdown**: 3-column grid of cards, each showing domain name, score, and visual bar indicator
3. **Review Table**: Striped table (odd rows bg-gray-50), columns for Q#, Your Answer, Correct Answer, Result (icon), Explanation (expandable)

**Exam Selection Screen**:
- Grid of exam cards (2 columns desktop, 1 mobile)
- Each card: Exam title (text-xl font-semibold), question count, estimated duration, Start button (full-width primary)

## Button Styles

**Primary Action** (Start Exam, Submit, Resume): bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark shadow-sm
**Secondary Action** (Previous, Next, Cancel): bg-white text-primary border-2 border-primary px-6 py-3 rounded-lg
**Danger Action** (End Exam): bg-error text-white with confirmation requirement
**Mark for Review**: Toggle checkbox with warning color when active

## Interactive States

**Question Cards**: 
- Default: Subtle gray border
- Hover: Slightly darker gray border with subtle shadow
- Selected: Teal primary border with light teal-tinted background
- Marked: Amber/warning border for review emphasis

**Answer Options**:
- Unselected: Gray border with hover state
- Selected: Teal primary border with subtle teal-tinted background
- Disabled (review mode): Reduced opacity, not clickable

**Timer Display**:
- Normal: text-gray-700
- Warning (<30 min): text-warning-600 
- Critical (<10 min): text-error-600 animate-pulse

## Accessibility

- High contrast ratios (WCAG AA minimum)
- Keyboard navigation for all exam controls (Tab, Space, Enter, Arrow keys)
- Focus indicators with 2px outline offset
- Screen reader announcements for timer updates and question changes
- Skip navigation link to jump to question content

## Responsive Breakpoints

- Mobile (<768px): Single column, stacked navigation, simplified question grid
- Tablet (768px-1024px): Two-column layouts where appropriate
- Desktop (>1024px): Full multi-column experience, side-by-side controls

## Images

**Brand Integration**:
- Patrons Consulting logo displayed prominently on exam selection page and exam interface header
- Logo maintains professional appearance with clean spacing

**Functional Elements**:
- Icon set: Lucide React icons for UI elements (timer, navigation, status indicators)
- Result icons: Checkmarks (success) and X marks (error) in review table
- Minimal decorative imagery to maintain focus on exam content

## Performance Considerations

- Minimize animations (only fade transitions for modals)
- Lazy load question explanations in results table
- Optimize JSON parsing for large exam files
- No auto-save (explicit submit only to prevent distraction)