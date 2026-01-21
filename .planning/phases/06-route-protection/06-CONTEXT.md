# Phase 6: Route Protection - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect routes and API endpoints from unauthorized access. Unauthenticated users are redirected to login. API calls without session return 401, wrong role returns 403. Non-admin users cannot access /admin/* routes.

</domain>

<decisions>
## Implementation Decisions

### Redirect behavior
- Unauthenticated users redirected to login page with return URL preserved (callbackUrl parameter)
- After successful login, user returns to originally requested page

### Admin route blocking
- Non-admin users accessing /admin/* see a 403 page with "You don't have permission to access this page"
- Not a silent redirect — explicit permission denied message

### Access logging
- Log failed access attempts to server console
- Include: who tried, what route, timestamp
- No database audit trail (console only for debugging)

### Claude's Discretion
- Middleware vs layout-level protection strategy
- API error response format (401/403 body structure)
- Which routes are public (login, access-denied) vs protected
- Static asset handling

</decisions>

<specifics>
## Specific Ideas

- Current Google auth domain blocking (@talenta.com.my) is working correctly — route protection builds on top of this
- User confirmed no issues with current auth flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-route-protection*
*Context gathered: 2026-01-21*
