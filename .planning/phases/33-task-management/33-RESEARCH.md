# Phase 33: Task Management - Research

**Researched:** 2026-01-25
**Domain:** Hierarchical task management with subtasks, comments, tags, and tree UI
**Confidence:** HIGH

## Summary

This phase implements comprehensive task management for projects: tasks with status/priority/due dates/assignees, nested subtasks up to 5 levels deep, comments, tags with inheritance, progress indicators, and collapsible tree view UI. The Task, TaskComment, TaskTag, and Tag models already exist in the Prisma schema (added in Phase 29), so this phase focuses on API routes, UI components, and the tree view interaction.

The codebase has excellent patterns to follow: Deliverable/Cost patterns provide CRUD and UI templates, Initiative comments provide the comment section pattern, and the schema already includes depth tracking and cascade handling decisions. The main complexity is building a recursive tree view UI with collapse/expand functionality - research confirms the shadcn Collapsible component combined with recursive rendering is the standard approach.

**Primary recommendation:** Build task management in logical chunks: (1) Task CRUD with flat list, (2) Subtask hierarchy with tree view, (3) Comments, (4) Tags with inheritance, (5) Progress indicators. Use recursive component pattern for tree view with shadcn Collapsible for expand/collapse. Handle cascade delete in application code as decided in Phase 29.

## Standard Stack

### Core (Already in Codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | ORM for Task/TaskComment/Tag/TaskTag models | Already defined in schema |
| React | 18.x | Component rendering | Recursive components for tree |
| shadcn/ui | Latest | UI components | Collapsible, Card, Badge, Button available |
| Lucide React | 0.562.0 | Icons | ChevronRight, ChevronDown for expand/collapse |
| Sonner | 2.x | Toast notifications | Standard in codebase |
| date-fns | 4.x | Date formatting | Already used in CostForm |

### New Component Needed

| Component | Source | Purpose | Installation |
|-----------|--------|---------|--------------|
| Collapsible | shadcn/ui | Expand/collapse tree nodes | `npx shadcn@latest add collapsible` |

### No Additional Libraries Needed

Build tree view with recursive components + Collapsible rather than external tree library:
- Simpler (no new dependency)
- Full control over styling
- Matches existing codebase patterns
- External tree libraries (MUI X, react-arborist) are overkill for 5-level depth

## Architecture Patterns

### Recommended File Structure

```
src/
  app/api/projects/[id]/tasks/
    route.ts                      # GET (list tree), POST (create)
    [taskId]/route.ts             # GET, PATCH, DELETE
    [taskId]/comments/route.ts    # GET, POST for task comments
  app/api/tags/
    route.ts                      # GET (list), POST (create)
    [tagId]/route.ts              # PATCH, DELETE
  components/projects/
    task-tree.tsx                 # Container for task tree
    task-tree-node.tsx            # Recursive tree node component
    task-form.tsx                 # Add/edit task form
    task-card.tsx                 # Task display in tree
    task-comments.tsx             # Comments section for task
    task-tag-select.tsx           # Tag selection with create-new
  components/ui/
    collapsible.tsx               # shadcn Collapsible (new)
  lib/
    task-utils.ts                 # Tree helpers, progress calculation
```

### Pattern 1: Recursive Tree Data Structure

**What:** Fetch tasks as flat list, build tree in frontend
**Why:** Prisma doesn't support recursive include; building tree client-side is standard pattern
**Example:**

```typescript
// API returns flat list with parentId
interface Task {
  id: string
  title: string
  parentId: string | null
  depth: number
  // ... other fields
}

// Build tree structure client-side
interface TaskWithChildren extends Task {
  children: TaskWithChildren[]
}

function buildTaskTree(tasks: Task[]): TaskWithChildren[] {
  const taskMap = new Map<string, TaskWithChildren>()
  const roots: TaskWithChildren[] = []

  // First pass: create nodes with empty children
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  // Second pass: connect parent-child relationships
  tasks.forEach(task => {
    const node = taskMap.get(task.id)!
    if (task.parentId) {
      const parent = taskMap.get(task.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  // Sort children by sortOrder
  const sortChildren = (nodes: TaskWithChildren[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(roots)

  return roots
}
```

### Pattern 2: Recursive Tree Node Component

**What:** Self-referencing component that renders its children recursively
**When to use:** Displaying hierarchical task tree
**Example:**

```typescript
// Source: Standard React recursive pattern
interface TaskTreeNodeProps {
  task: TaskWithChildren
  projectId: string
  level: number
  onTaskUpdate: () => void
}

function TaskTreeNode({ task, projectId, level, onTaskUpdate }: TaskTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = task.children.length > 0
  const canAddSubtask = level < 4 // 0-indexed, so level 4 = depth 5

  return (
    <div style={{ marginLeft: `${level * 24}px` }}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-2">
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-6" />} {/* Spacer for alignment */}

          <TaskCard
            task={task}
            projectId={projectId}
            canAddSubtask={canAddSubtask}
            onUpdate={onTaskUpdate}
          />
        </div>

        <CollapsibleContent>
          {task.children.map(child => (
            <TaskTreeNode
              key={child.id}
              task={child}
              projectId={projectId}
              level={level + 1}
              onTaskUpdate={onTaskUpdate}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
```

### Pattern 3: Progress Indicator Calculation

**What:** Calculate "X of Y complete" from task tree
**When to use:** Displaying progress on parent tasks
**Example:**

```typescript
// Calculate subtask completion for a task
function calculateProgress(task: TaskWithChildren): { completed: number; total: number } {
  let completed = 0
  let total = 0

  const countTasks = (t: TaskWithChildren) => {
    t.children.forEach(child => {
      total++
      if (child.status === 'DONE') {
        completed++
      }
      countTasks(child) // Recurse into nested subtasks
    })
  }

  countTasks(task)
  return { completed, total }
}

// Usage in TaskCard
const { completed, total } = calculateProgress(task)
const hasSubtasks = total > 0

// Display: "3 of 5 subtasks complete" or progress bar
```

### Pattern 4: Cascade Delete in Application Code

**What:** Delete task and all descendants recursively in app code
**Why:** Schema uses onDelete: NoAction per STATE.md decision
**Example:**

```typescript
// Source: Following STATE.md decision - cascade in app code
async function deleteTaskWithDescendants(taskId: string): Promise<void> {
  // Get all descendant task IDs using recursive query
  const descendantIds = await getDescendantTaskIds(taskId)

  // Delete in order: deepest first (or use transaction)
  await prisma.$transaction([
    // Delete task tags for all tasks
    prisma.taskTag.deleteMany({
      where: { taskId: { in: [taskId, ...descendantIds] } }
    }),
    // Delete comments for all tasks
    prisma.taskComment.deleteMany({
      where: { taskId: { in: [taskId, ...descendantIds] } }
    }),
    // Delete tasks (children first, then parent)
    ...descendantIds.reverse().map(id =>
      prisma.task.delete({ where: { id } })
    ),
    prisma.task.delete({ where: { id: taskId } })
  ])
}

async function getDescendantTaskIds(taskId: string): Promise<string[]> {
  const descendants: string[] = []

  async function collectDescendants(parentId: string) {
    const children = await prisma.task.findMany({
      where: { parentId },
      select: { id: true }
    })
    for (const child of children) {
      descendants.push(child.id)
      await collectDescendants(child.id)
    }
  }

  await collectDescendants(taskId)
  return descendants
}
```

### Pattern 5: Tag Inheritance

**What:** When tag added to task, automatically add to all subtasks with inherited=true
**When to use:** TASK-09 requirement
**Example:**

```typescript
// When adding tag to a task
async function addTagToTask(taskId: string, tagId: string): Promise<void> {
  // Get all descendant task IDs
  const descendantIds = await getDescendantTaskIds(taskId)

  await prisma.$transaction([
    // Add tag to the task itself (not inherited)
    prisma.taskTag.create({
      data: { taskId, tagId, inherited: false }
    }),
    // Add tag to all descendants (inherited=true)
    ...descendantIds.map(descendantId =>
      prisma.taskTag.upsert({
        where: { taskId_tagId: { taskId: descendantId, tagId } },
        create: { taskId: descendantId, tagId, inherited: true },
        update: { inherited: true } // Already exists, mark as inherited
      })
    )
  ])
}

// When removing tag from a task
async function removeTagFromTask(taskId: string, tagId: string): Promise<void> {
  const descendantIds = await getDescendantTaskIds(taskId)

  await prisma.taskTag.deleteMany({
    where: {
      tagId,
      taskId: { in: [taskId, ...descendantIds] },
      inherited: true // Only remove if inherited (or the original)
    }
  })

  // Also delete the original if it exists
  await prisma.taskTag.deleteMany({
    where: { taskId, tagId }
  })
}
```

### Anti-Patterns to Avoid

- **DON'T use onDelete: Cascade on self-reference:** MySQL/many DBs don't support it; already decided in STATE.md
- **DON'T fetch infinite depth with nested includes:** Prisma doesn't support recursive include
- **DON'T use external tree library for 5-level depth:** Overkill, adds complexity
- **DON'T create subtasks directly from tree:** Route through API with depth validation
- **DON'T calculate progress on server:** Do it client-side from tree data

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible UI | Custom expand/collapse | shadcn Collapsible | Keyboard accessible, animations |
| Tree building | Manual recursion in template | buildTaskTree utility | Separates data from rendering |
| Depth tracking | Calculate on render | Use schema depth field | Consistent, validated on create |
| Tag colors | Hardcoded values | Store in Tag model (color field) | User can customize |
| Comment timestamps | Manual formatting | Reuse formatCommentTime from initiatives | Consistent "X ago" format |

**Key insight:** The schema already handles complexity (depth field, inherited flag, sortOrder). Focus on UI patterns rather than data modeling.

## Common Pitfalls

### Pitfall 1: Depth Validation Bypass

**What goes wrong:** Subtask created at depth > 5 via direct API call
**Why it happens:** Only validating in UI, not API
**How to avoid:**
- Validate depth in API route before create
- Check parent's depth, reject if parent.depth >= 4
**Warning signs:** Tasks with depth > 4 in database

### Pitfall 2: Orphaned TaskTags After Delete

**What goes wrong:** TaskTag records remain after task deleted
**Why it happens:** Not cascading delete to related records
**How to avoid:**
- Delete TaskTag and TaskComment BEFORE deleting Task
- Use transaction for atomicity
**Warning signs:** Foreign key errors, ghost tags in queries

### Pitfall 3: Tree Build Performance

**What goes wrong:** Slow rendering with many tasks
**Why it happens:** Building tree on every render
**How to avoid:**
- useMemo for buildTaskTree result
- Only rebuild when tasks array changes
**Warning signs:** Laggy expand/collapse, high re-render count

### Pitfall 4: Missing Inherited Tag Updates

**What goes wrong:** New subtask doesn't get parent's tags
**Why it happens:** Only propagating on tag add, not on subtask create
**How to avoid:**
- When creating subtask, copy parent's tags with inherited=true
- Include in create transaction
**Warning signs:** User adds subtask, expects parent tags, sees none

### Pitfall 5: Collapse State Lost on Data Refresh

**What goes wrong:** All nodes collapse after adding/editing task
**Why it happens:** Expansion state stored in component, lost on re-render
**How to avoid:**
- Store expanded IDs in parent state (Set<string>)
- Pass down to tree nodes
- Don't reset on data refresh
**Warning signs:** User expands tree, edits task, tree collapses

### Pitfall 6: Assignee Mismatch with TeamMember Enum

**What goes wrong:** Task assignee dropdown shows database values, not friendly names
**Why it happens:** Using raw enum values instead of formatting
**How to avoid:**
- Reuse TEAM_MEMBER_OPTIONS from utils.ts
- Use formatTeamMember for display
**Warning signs:** "KHAIRUL" instead of "Khairul" in UI

## Code Examples

### Task API Routes

```typescript
// GET /api/projects/[id]/tasks - List tasks for project (flat list)
// Source: Following deliverables/route.ts pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        tags: {
          include: { tag: true }
        },
        _count: {
          select: { children: true, comments: true }
        }
      },
      orderBy: [
        { depth: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/projects/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate depth and validate
    let depth = 0
    let parentTags: { tagId: string }[] = []

    if (body.parentId) {
      const parent = await prisma.task.findUnique({
        where: { id: body.parentId },
        select: {
          id: true,
          depth: true,
          tags: { select: { tagId: true } }
        },
      })

      if (!parent) {
        return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
      }

      if (parent.depth >= 4) {
        return NextResponse.json(
          { error: 'Maximum nesting depth (5 levels) reached' },
          { status: 400 }
        )
      }

      depth = parent.depth + 1
      parentTags = parent.tags
    }

    // Get next sortOrder for siblings
    const maxSortOrder = await prisma.task.aggregate({
      where: {
        projectId: id,
        parentId: body.parentId || null,
      },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    // Create task with inherited tags in transaction
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          projectId: id,
          parentId: body.parentId || null,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          status: body.status || 'TODO',
          priority: body.priority || 'MEDIUM',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          assignee: body.assignee || null,
          depth,
          sortOrder: nextSortOrder,
        },
      })

      // Inherit parent tags if creating subtask
      if (parentTags.length > 0) {
        await tx.taskTag.createMany({
          data: parentTags.map(pt => ({
            taskId: newTask.id,
            tagId: pt.tagId,
            inherited: true,
          })),
        })
      }

      return newTask
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
```

### Task Tree Component

```typescript
// components/projects/task-tree.tsx
'use client'

import { useState, useMemo } from 'react'
import { TaskTreeNode } from './task-tree-node'
import { TaskForm } from './task-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  parentId: string | null
  depth: number
  sortOrder: number
  tags: { tag: { id: string; name: string; color: string } }[]
  _count: { children: number; comments: number }
}

interface TaskWithChildren extends Task {
  children: TaskWithChildren[]
}

interface TaskTreeProps {
  projectId: string
  tasks: Task[]
  onTasksChange: () => void
}

function buildTaskTree(tasks: Task[]): TaskWithChildren[] {
  const taskMap = new Map<string, TaskWithChildren>()
  const roots: TaskWithChildren[] = []

  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  tasks.forEach(task => {
    const node = taskMap.get(task.id)!
    if (task.parentId) {
      const parent = taskMap.get(task.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  const sortChildren = (nodes: TaskWithChildren[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(roots)

  return roots
}

export function TaskTree({ projectId, tasks, onTasksChange }: TaskTreeProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildTaskTree(tasks), [tasks])

  const toggleExpanded = (taskId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  // Calculate overall progress
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'DONE').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Tasks</Label>
          {totalTasks > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedTasks}/{totalTasks}
            </Badge>
          )}
        </div>
        {totalTasks > 0 && !showAddForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {showAddForm && (
        <TaskForm
          projectId={projectId}
          onSuccess={() => {
            onTasksChange()
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {tree.length === 0 && !showAddForm ? (
        <Card className="p-6 text-center border-dashed">
          <ListTodo className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No tasks yet</p>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add your first task
          </Button>
        </Card>
      ) : (
        <div className="space-y-1">
          {tree.map(task => (
            <TaskTreeNode
              key={task.id}
              task={task}
              projectId={projectId}
              level={0}
              expandedIds={expandedIds}
              onToggleExpanded={toggleExpanded}
              onTaskUpdate={onTasksChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Tags API

```typescript
// GET /api/tags - List all tags (global)
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST /api/tags - Create tag
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check for duplicate
    const existing = await prisma.tag.findUnique({
      where: { name: body.name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: {
        name: body.name.trim(),
        color: body.color || '#6B7280', // Default gray
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
```

### Task Comment API

```typescript
// Source: Following initiatives/[id]/comments/route.ts pattern

// GET /api/projects/[id]/tasks/[taskId]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { taskId } = await params

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/projects/[id]/tasks/[taskId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { session, error } = await requireAuth()
  if (error) return error

  try {
    const { taskId } = await params
    const body = await request.json()

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: body.content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External tree library | Recursive components + Collapsible | 2024+ | Simpler, more control |
| DB-level cascade | App-level cascade for self-ref | Ongoing | Required for MySQL self-ref |
| Server-side tree build | Client-side tree build | Standard | Prisma doesn't support recursive include |

**Deprecated/outdated:**
- N/A - Schema is current from Phase 29

## Open Questions

1. **Task Detail Sheet vs Inline Editing**
   - What we know: Tasks have many fields (title, desc, status, priority, due, assignee, tags, comments)
   - What's unclear: Edit in-place in tree card or open detail sheet?
   - Recommendation: Use TaskDetailSheet (like ProjectDetailSheet) - too many fields for inline editing

2. **Progress Display Location**
   - What we know: TASK-11 requires progress indicator
   - What's unclear: Show on every parent task or only in summary?
   - Recommendation: Show on parent tasks in tree + overall count in section header

3. **Tag Color Picker UI**
   - What we know: Tag model has color field
   - What's unclear: How to let user pick color?
   - Recommendation: Preset palette (8-10 colors) via Select, not full color picker

4. **Assignee Source**
   - What we know: Schema uses TeamMember enum (KHAIRUL, AZLAN, IZYANI)
   - What's unclear: Will this always be sufficient?
   - Recommendation: Use enum for now (matches initiatives), can extend to User relation later

## Sources

### Primary (HIGH confidence)
- `/prisma/schema.prisma` - Task, TaskComment, Tag, TaskTag models already defined
- `/src/components/projects/deliverable-*.tsx` - CRUD component patterns
- `/src/components/projects/project-detail-sheet.tsx` - Sheet integration pattern
- `/src/components/initiatives/initiative-detail.tsx` - Comment section pattern
- `/src/app/api/initiatives/[id]/comments/route.ts` - Comment API pattern
- `/src/lib/utils.ts` - TeamMember formatting helpers
- `/.planning/STATE.md` - Key decisions on global tags, onDelete: NoAction

### Secondary (MEDIUM confidence)
- [shadcn Collapsible](https://ui.shadcn.com/docs/components/collapsible) - Official component docs
- [Prisma Self-relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations) - Self-referential patterns
- [MrLightful shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) - Tree view pattern reference

### Tertiary (LOW confidence)
- [Prisma recursive issues](https://github.com/prisma/prisma/issues/3725) - Recursive query limitations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase, only need Collapsible
- Architecture: HIGH - Direct parallels to existing patterns
- Tree rendering: HIGH - Standard React recursive pattern
- Cascade delete: HIGH - Following STATE.md decision
- Tag inheritance: MEDIUM - Implementation approach clear, edge cases need testing

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)
