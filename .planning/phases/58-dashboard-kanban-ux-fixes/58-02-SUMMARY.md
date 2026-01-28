# Summary: 58-02 Kanban Desktop Full-Card Drag & Hide Handles

## Status: COMPLETE

## What was built
Full-card dragging on desktop kanban boards. Drag listeners are now on the outer card div, so users can drag from anywhere. The GripVertical handle is completely hidden on desktop (`md:hidden`) and remains visible on mobile for touch-hold drag.

## Changes
- `src/components/kanban/kanban-card.tsx` — Moved `{...dragListeners}` from handle div to outer card div, changed handle from `md:opacity-0 md:group-hover:opacity-100` to `md:hidden`, removed drag listeners from handle div

## Commits
- `4db5ce2` — fix(58-02): enable full-card drag on desktop, hide grip handles

## Deviations
None.

## Must-haves verification
- [x] Desktop kanban cards are draggable by clicking anywhere on the card body
- [x] No visible drag handles on desktop kanban cards (not even on hover)
- [x] Mobile kanban cards still show drag handles for touch interaction
- [x] Single click on desktop still opens initiative detail (MouseSensor distance:5 prevents accidental drag)
