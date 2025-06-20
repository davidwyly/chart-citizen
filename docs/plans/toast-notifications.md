# Toast Notifications

## User Story
Receive clear and timely notifications about application events (success, errors, warnings) without interrupting workflow.

## Acceptance Criteria
- Displays temporary, non-intrusive notification messages.
- Notifications have different types (success, error, info) with visual cues.
- Users can dismiss notifications; they auto-disappear after set time.
- Multiple notifications can be queued and displayed in a controlled manner.

## High-Level Implementation Strategy
- Implement `useToast` React hook for state/logic.
- Use reducer pattern for `ADD_TOAST`, `UPDATE_TOAST`, `DISMISS_TOAST`, `REMOVE_TOAST` actions.
- Integrate with UI component library (e.g., shadcn/ui `Toast`) for rendering.
- Implement queueing mechanism to limit visible toasts and auto-dismissal timeout.

## High-Level Testing Approach
- Unit tests for `reducer` function (state transitions for all actions).
- Unit tests for `useToast` hook (toast creation, updating, dismissal, auto-removal).
- Integration tests (toast appearance/disappearance in response to events).
- Visual regression tests (consistent styling/placement of different toast types). 