# PMP Exam Simulator

## Overview
The PMP Exam Simulator is a comprehensive web application designed to help users prepare for the Project Management Professional (PMP) certification exam. It offers realistic exam simulations with 180 questions across the People, Process, and Business Environment domains. Key features include an exam timer, question navigation, answer marking, and detailed performance analytics, providing a thorough practice environment for aspiring PMP professionals.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React with TypeScript, using Vite for building.
- **Routing:** Wouter for lightweight client-side routing.
- **State Management:** TanStack Query for server state (exam questions, metadata), client-side session storage for exam progress (answers, time, marked questions), and `useState` for local UI interactions. No global state management library is used.
- **UI:** Shadcn UI (New York variant) built on Radix UI primitives, styled with Tailwind CSS for a distraction-free experience.
- **Key UI Patterns:** Modal overlays for pause/navigation/submission, real-time countdown timer, grid-based question navigator, and a results page with tabular review and domain performance charts.

### Backend
- **Framework:** Express.js with TypeScript.
- **Data Storage:** File-based storage using JSON files in the `/exams` directory for static exam questions and metadata. Drizzle ORM is configured for future database migration but not currently used.
- **API Design:** RESTful endpoints for fetching exam lists and specific exam data, with Zod schemas for runtime validation.
- **Session Management:** Entirely client-side; exam state is maintained on the client, and results are calculated upon submission.

### Data Schema & Validation
- **Shared Schemas:** Zod schemas are used for `questionSchema` (supporting single and multiple-answer types), `examSchema`, `userAnswerSchema`, `examSessionSchema`, and `resultSchemas`.
- **Question Types:** Discriminated unions in Zod support single-answer (radio buttons, `correctAnswer`) and multiple-answer (checkboxes, `correctAnswers`, with optional `minSelections`/`maxSelections`) questions.
- **Domain Distribution:** Questions are distributed approximately as: People ~42%, Process ~50%, Business Environment ~8%.

### Architecture Decisions
- **File-Based Storage:** Chosen for static content, simplified deployment, easy content management, and fast read performance.
- **Client-Side Session State:** Reduces server complexity, enables potential offline capabilities, and persists exam progress using `sessionStorage` across page refreshes.
- **Wouter:** Selected over React Router for its smaller bundle size and simpler API, sufficient for the application's linear navigation.
- **Shadcn UI:** Components are copied directly into the project for full customization, built on accessible Radix UI primitives, and align with Tailwind CSS styling.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: Neon Postgres driver (configured, not active).
- `drizzle-orm` & `drizzle-zod`: ORM and schema validation (configured for future use).

### UI Component Libraries
- `@radix-ui/*`: Various packages for accessible UI primitives.
- `embla-carousel-react`: Carousel functionality.
- `class-variance-authority`: Variant-based component styling.
- `cmdk`: Command palette component.

### Utilities
- `date-fns`: Date manipulation.
- `clsx` + `tailwind-merge`: Conditional CSS class utilities.
- `react-hook-form` + `@hookform/resolvers`: Form state management (available for future features).
- `zod`: Runtime type validation and schema definition.

### Fonts
- Google Fonts: Open Sans and Roboto.