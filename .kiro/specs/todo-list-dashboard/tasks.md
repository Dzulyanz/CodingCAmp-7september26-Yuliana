# Implementation Plan: Todo List Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard using pure HTML, CSS, and Vanilla JavaScript. The app is structured as one HTML entry point (`index.html`), one stylesheet (`css/style.css`), and one JavaScript module (`js/app.js`). All state is persisted to `localStorage`. The JavaScript layer uses an IIFE pattern with five controllers — `StorageManager`, `GreetingController`, `FocusTimerController`, `TodoController`, and `QuickLinksController` — each initialised at `DOMContentLoaded`.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - [x] 1.1 Create `index.html` with semantic markup for all four dashboard components
    - Define `<section id="greeting">`, `<section id="focus-timer">`, `<section id="todo-list">`, and `<section id="quick-links">` inside `<main class="dashboard">`
    - Include all IDs and elements listed in the design HTML structure: `#greeting-message`, `#greeting-time`, `#greeting-date`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-alert`, `#todo-add-form`, `#todo-input`, `#todo-items`, `#links-add-form`, `#link-label-input`, `#link-url-input`, `#links-add-btn`, `#links-list`
    - Link `<link rel="stylesheet" href="css/style.css">` and `<script src="js/app.js" defer></script>`
    - _Requirements: 14.1, 14.4_

  - [x] 1.2 Create `css/style.css` with CSS custom properties, reset baseline, and card skeleton
    - Define colour palette and spacing scale as CSS variables (`--space-lg`, etc.)
    - Set `body { font-size: 16px; line-height: 1.5; }` to satisfy 14.3
    - Add `.dashboard`, `.card`, `.error`, `.toast` placeholder rules (values filled in Task 7)
    - _Requirements: 14.3_

  - [x] 1.3 Create `js/app.js` with IIFE wrapper and empty controller stubs
    - Top-level IIFE `(function() { ... })();` containing object literals for all five controllers
    - Each controller exposes at minimum an `init()` method returning `undefined`
    - Wire `document.addEventListener('DOMContentLoaded', ...)` to call each `init()` in order: `StorageManager`, `GreetingController`, `FocusTimerController`, `TodoController`, `QuickLinksController`
    - Include `generateId()` utility with `crypto.randomUUID()` and `Math.random()` fallback
    - _Requirements: 14.1, 15.1_

- [x] 2. Implement StorageManager
  - [x] 2.1 Implement `StorageManager._load` and `StorageManager._save` with full error handling
    - `_load(key, fallback)`: wraps `localStorage.getItem` + `JSON.parse` in try/catch; returns fallback for `null`, non-array, or malformed JSON
    - `_save(key, value)`: wraps `localStorage.setItem` + `JSON.stringify` in try/catch; returns `true` on success, `false` on failure
    - Expose `loadTasks()`, `saveTasks()`, `loadLinks()`, `saveLinks()` as thin wrappers using keys `tdl__tasks` and `tdl__links`
    - _Requirements: 9.3, 9.4, 9.5, 13.3, 13.4, 13.5_

  - [ ] 2.2 Write property test — Task serialisation round-trip (Property 1)
    - **Property 1: Task serialisation round-trip**
    - Use `fast-check` to generate arbitrary valid Task arrays; assert `loadTasks(saveTasks(arr))` produces deeply equal array
    - **Validates: Requirements 9.3, 9.4**

  - [ ] 2.3 Write property test — Link serialisation round-trip (Property 2)
    - **Property 2: Link serialisation round-trip**
    - Use `fast-check` to generate arbitrary Link arrays of length 0–20; assert round-trip equality on all fields
    - **Validates: Requirements 13.3, 13.4**

  - [ ] 2.4 Write unit tests for StorageManager edge cases
    - `_load` with `null` stored value returns fallback
    - `_load` with non-array JSON (object, string) returns fallback
    - `_save` when `localStorage.setItem` throws returns `false`
    - _Requirements: 9.5, 13.5_

- [x] 3. Implement GreetingController
  - [x] 3.1 Implement `GreetingController._greetingFor(hour)` mapping function
    - Returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ] 3.2 Write property test — greeting covers all 24 hours (Property 8)
    - **Property 8: Time-based greeting covers all 24 hours with no gaps or overlaps**
    - Use `fast-check` integer in [0, 23]; assert return value is exactly one of the four strings and matches the boundary table
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

  - [x] 3.3 Implement `GreetingController._render()` and `GreetingController.init()`
    - `_render()`: call `new Date()`, populate `#greeting-time` via `toLocaleTimeString`, `#greeting-date` via `toLocaleDateString`, `#greeting-message` via `_greetingFor`
    - Wrap `new Date()` in try/catch; on Invalid Date render `"-- : --"` and `"Date unavailable"` placeholders (Requirement 1.5)
    - `init()`: call `_render()` immediately, then `setInterval(() => this._render(), 60_000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_

  - [ ] 3.4 Write unit tests for GreetingController boundary hours
    - Specific hours: 0, 4, 5, 11, 12, 17, 18, 20, 21, 23 — verify correct greeting string returned
    - Verify `_render()` sets placeholder text when `new Date()` throws
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.5_

- [x] 4. Implement FocusTimerController
  - [~] 4.1 Implement timer state, `_formatTime(seconds)`, and `_renderDisplay()`
    - State: `_remaining = 25 * 60`, `_startedAt = null`, `_snapshotAt = null`, `_intervalId = null`, `_running = false`
    - `_formatTime(s)`: zero-pad minutes and seconds to produce `"MM:SS"` string
    - `_renderDisplay()`: write formatted string to `#timer-display`; toggle `#timer-start` / `#timer-stop` hidden attribute based on `_running`
    - _Requirements: 3.3, 4.1, 4.2_

  - [ ] 4.2 Write property test — timer display format (Property 11)
    - **Property 11: Timer display format is valid MM:SS for any remaining seconds in [0, 1500]**
    - Use `fast-check` integer in [0, 1500]; assert output matches `/^\d{2}:\d{2}$/` and decoding equals input
    - **Validates: Requirements 3.3**

  - [x] 4.3 Implement `_tick()` with wall-clock drift correction
    - Calculate `elapsed = Math.round((Date.now() - this._startedAt) / 1000)` and derive `_remaining = Math.max(0, this._snapshotAt - elapsed)`
    - Call `_renderDisplay()`; when `_remaining === 0` call `_onComplete()`
    - _Requirements: 3.2, 3.3, 3.7, 4.3, 15.3_

  - [x] 4.4 Implement Start, Stop, Reset handlers and `_onComplete()`
    - Start: guard `_running` to prevent double-start (Requirement 3.6 / 4.6); set `_startedAt = Date.now()`, `_snapshotAt = _remaining`, `_running = true`, start `setInterval(_tick, 1000)`
    - Stop: clear interval, retain `_remaining`, set `_running = false`, call `_renderDisplay()` (Requirement 4.3)
    - Reset: clear interval, set `_remaining = 25 * 60`, `_running = false`, call `_renderDisplay()` (Requirement 4.5)
    - `_onComplete()`: clear interval, set `_running = false`, un-hide `#timer-alert` with completion message (aria-live="assertive"), auto-hide after 5 seconds (Requirement 3.5)
    - _Requirements: 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 4.5 Write unit tests for FocusTimerController
    - Start from initial state begins countdown; Stop retains `_remaining`; Reset restores 25:00; double-Start is no-op; `_onComplete` un-hides alert
    - _Requirements: 3.4, 3.5, 3.6, 4.1–4.7_

- [ ] 5. Checkpoint — Ensure all tests pass
  - Run `npx vitest --run` (or `npx jest --no-coverage`) and confirm green. Ask the user if any test failures need clarification.

- [x] 6. Implement TodoController
  - [x] 6.1 Implement `TodoController.init()` and `_render()`
    - `init()`: load tasks from `StorageManager.loadTasks()`; call `_render()`; attach submit handler on `#todo-add-form`
    - `_render()`: rebuild `#todo-items` `<ul>` from `this._tasks`; each `<li>` includes checkbox, description `<span>`, Edit and Delete buttons; when list is empty render `<p>No tasks yet.</p>`
    - _Requirements: 7.1, 9.1, 9.2_

  - [x] 6.2 Implement `_addTask(description)`
    - Trim input; if empty/whitespace-only: retain focus, show inline error in `#todo-add-error` (Requirement 5.5); return
    - Otherwise: create Task `{ id: generateId(), description: trimmed, done: false, createdAt: Date.now() }`; push to `_tasks`; call `StorageManager.saveTasks`; if save returns `false` show error toast; call `_render()`; clear input
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 6.3 Write property test — whitespace-only task descriptions are rejected (Property 3)
    - **Property 3: Whitespace-only task descriptions are rejected**
    - Generate whitespace-only strings; assert `_tasks` length unchanged and error element is visible
    - **Validates: Requirements 5.5**

  - [ ] 6.4 Write property test — task addition grows list by exactly one (Property 5)
    - **Property 5: Task addition grows the list by exactly one, with trimmed description and done=false**
    - Generate arbitrary task list + valid description with optional surrounding whitespace; assert length +1, `description === input.trim()`, `done === false`, input cleared
    - **Validates: Requirements 5.2, 5.3**

  - [x] 6.5 Implement `_editTask(id, description)` and edit-mode lock
    - Activate edit mode: set `_editingId = id`; replace description span with `<input>` pre-filled with current description; disable all other Edit controls
    - Confirm (Save / Enter): trim value; if empty/whitespace-only show inline error, stay in edit mode (Requirement 6.6); else update `_tasks`, persist, call `_render()`, clear `_editingId`
    - Cancel (Cancel button / Escape): restore original description, call `_render()`, clear `_editingId`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 6.6 Write property test — whitespace-only edit values are rejected (Property 4)
    - **Property 4: Whitespace-only edit values are rejected**
    - Generate any Task + whitespace string; assert description unchanged, task stays in edit mode, error visible
    - **Validates: Requirements 6.6**

  - [x] 6.7 Implement `_toggleTask(id)` and `_deleteTask(id)`
    - `_toggleTask`: flip `done`; persist; call `_render()` (Requirement 7.2, 7.3, 7.4)
    - `_deleteTask`: filter `_tasks`; persist; call `_render()`; if list becomes empty `_render()` shows empty state (Requirement 8.2, 8.5)
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 6.8 Write property test — completion toggle is an involution (Property 7)
    - **Property 7: Completion toggle is an involution**
    - Generate any Task; toggle twice; assert `done` equals original value
    - **Validates: Requirements 7.2, 7.3**

  - [ ] 6.9 Write property test — task deletion preserves relative order (Property 6)
    - **Property 6: Task deletion preserves relative order**
    - Generate list ≥1 + valid index; assert post-deletion length is n−1 and remaining items retain original relative order
    - **Validates: Requirements 8.2**

  - [ ] 6.10 Write unit tests for TodoController scenarios
    - Adding task clears input field; deleting last task renders empty state; edit-mode lock prevents concurrent edits
    - _Requirements: 5.3, 8.5, 6.3_

- [ ] 7. Implement QuickLinksController
  - [x] 7.1 Implement `QuickLinksController.init()` and `_render()`
    - `init()`: load links from `StorageManager.loadLinks()`; call `_render()`; attach submit handler on `#links-add-form`
    - `_render()`: rebuild `#links-list`; each `<li>` has a link button and Delete button; when empty render `<p>No links yet.</p>`; if `_links.length >= 20` disable `#links-add-btn` and show `#links-limit-msg`; otherwise re-enable button and hide message
    - _Requirements: 10.6, 13.1, 13.2_

  - [x] 7.2 Implement URL normalisation and `_addLink(label, url)`
    - Normalise: if url does not start with `http://` or `https://`, prepend `https://`
    - Validate with `URL` constructor; if throws show inline error in `#links-add-error` (Requirement 10.4)
    - If label empty show error (Requirement 10.4); if limit reached block silently (already disabled)
    - Otherwise: create Link `{ id: generateId(), label: trimmed, url: normalised, order: _links.length }`; push; persist; `_render()`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 7.3 Write property test — URL normalisation prepends https:// (Property 9)
    - **Property 9: URL normalisation prepends https:// when scheme is absent**
    - Generate URL strings without `http://` or `https://` prefix; assert normalised result starts with `https://` and passes `URL` constructor
    - **Validates: Requirements 10.5**

  - [ ] 7.4 Write property test — link count never exceeds 20 (Property 10)
    - **Property 10: Link count never exceeds 20**
    - Generate sequences of add-link operations; assert collection size never exceeds 20 and Add control is disabled at limit
    - **Validates: Requirements 10.2, 10.6**

  - [~] 7.5 Implement `_deleteLink(id)` with confirmation and `_openLink(url)`
    - `_deleteLink`: call `window.confirm()`; if confirmed filter `_links` and update `order` values; persist; if `_save` returns `false` show error toast and restore removed link; call `_render()`
    - `_openLink(url)`: call `window.open(url, '_blank', 'noopener,noreferrer')`; if url is empty or malformed do not open and show inline error (Requirements 11.2, 11.3)
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 7.6 Write unit tests for QuickLinksController
    - Clicking a link calls `window.open` with `_blank`; link with empty URL does not open a new tab
    - _Requirements: 11.1, 11.2_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Run `npx vitest --run` and confirm green. Ask the user if any failures need clarification before continuing.

- [ ] 9. Implement responsive CSS layout and visual design
  - [~] 9.1 Implement dashboard grid layout and responsive breakpoints in `style.css`
    - `.dashboard`: `display: grid; grid-template-columns: 1fr; gap: var(--space-lg);` for viewport < 768px
    - `@media (min-width: 768px)`: `grid-template-columns: 1fr 1fr;` for two-column layout
    - Verify no horizontal overflow at 320px, 767px, 768px, and 1280px viewport widths
    - _Requirements: 14.2, 14.5, 14.6_

  - [~] 9.2 Implement card styles, typography, and component-specific visual rules
    - `.card`: `padding`, `border-radius`, `box-shadow` for visual separation (≥16px gap between cards, Requirement 14.2)
    - Strikethrough: `.task--done .task-title { text-decoration: line-through; }` (Requirement 7.2)
    - `.error`: inline error styling adjacent to inputs
    - `.toast.error`: dismissible toast with `aria-live="polite"`, auto-dismissed after 5 seconds
    - Focus styles: visible `:focus-visible` outlines for keyboard navigation
    - _Requirements: 7.2, 14.2, 14.3_

- [ ] 10. Implement error handling, empty-state UI, and accessibility polish
  - [~] 10.1 Implement global error boundary and persistent storage-failure banner
    - `window.onerror` handler that calls `console.error` without crashing the page
    - When `StorageManager._save` returns `false` controllers show a dismissible toast error message
    - When `localStorage` is entirely unavailable on load, show a persistent warning banner (Requirement 9.5, 13.5)
    - _Requirements: 9.5, 13.5_

  - [~] 10.2 Audit and finalise accessibility attributes across all components
    - Verify `aria-live="assertive"` on `#timer-alert` and `aria-live="polite"` on `#todo-items` and toast elements
    - Verify `hidden` attribute toggling on Start/Stop buttons and limit message (Requirement 4.1, 4.2, 10.6)
    - Verify `<time>` element for `#greeting-time`, `<output>` for `#timer-display`
    - Verify all interactive controls have accessible labels (button text or `aria-label`)
    - _Requirements: 3.5, 4.1, 4.2, 10.6_

- [~] 11. Final checkpoint — Ensure all tests pass and polish
  - Run `npx vitest --run` (or `npx jest --no-coverage`) and verify all tests green.
  - Open `index.html` directly in a browser and confirm all four components render, localStorage persists across reload, and responsive breakpoints work.
  - Ask the user if any adjustments are needed before marking the feature complete.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for full traceability
- Property-based tests use [fast-check](https://fast-check.io/) with a minimum of 100 iterations each
- Unit tests run in jsdom (Vitest or Jest) — no real browser required for the test suite
- Checkpoints (Tasks 5, 8, 11) are integration gates; do not proceed past them with failing tests
- The IIFE architecture in `app.js` means all controllers are defined before `DOMContentLoaded` fires — order within the IIFE matters only for variable hoisting
- `crypto.randomUUID()` fallback (Task 1.3) must be in place before any controller creates IDs

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["4.4"] },
    { "id": 7, "tasks": ["4.5", "6.1"] },
    { "id": 8, "tasks": ["6.2"] },
    { "id": 9, "tasks": ["6.3", "6.4", "6.5"] },
    { "id": 10, "tasks": ["6.6", "6.7"] },
    { "id": 11, "tasks": ["6.8", "6.9", "6.10", "7.1"] },
    { "id": 12, "tasks": ["7.2"] },
    { "id": 13, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 14, "tasks": ["7.6", "9.1"] },
    { "id": 15, "tasks": ["9.2"] },
    { "id": 16, "tasks": ["10.1", "10.2"] }
  ]
}
```
