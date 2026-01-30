# Share All Absences Feature Documentation

## Overview

The "Share All Absences" feature allows administrators to control visibility of leave information across the organization. When enabled, all employees can see each other's absences in the calendar. When disabled, employees can only see absences from their own team/department.

## Feature Description

### Purpose
- **Transparency Control**: Enable company-wide visibility of leave schedules when needed
- **Privacy Protection**: Maintain departmental privacy when required by company policy
- **Flexible Access Control**: Allow administrators to adjust sharing based on organizational culture

### Business Value
- **Improved Coordination**: Teams can plan better with full visibility of company absences
- **Privacy Compliance**: Respect regional privacy requirements by limiting access when needed
- **Administrative Control**: Simple toggle for HR to manage information access policies

## Technical Implementation

### Database Schema
```prisma
model Company {
  // ... other fields
  shareAllAbsences Boolean @default(false) @map("share_all_absences")
}
```

### Frontend Components

#### 1. Company Settings Form
**Location**: `app/(dashboard)/settings/company/company-form.tsx:208-227`

```typescript
<FormField
  control={form.control}
  name="shareAllAbsences"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Share All Absences</FormLabel>
        <FormDescription>
          Allow all employees to see each other's absences.
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

#### 2. Calendar View Integration
**Location**: `components/charts/month-view.tsx:29-67`

The month view component fetches user company data and intelligently determines the appropriate view:

```typescript
// Fetch user company data to determine appropriate view
useEffect(() => {
    async function fetchUserData() {
        try {
            const res = await fetch('/api/users/me');
            if (res.ok) {
                const json = await res.json();
                setUserCompany(json.company);
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    }
    fetchUserData();
}, []);

// Determine appropriate view based on company settings
let viewToUse = filters?.view;
if (!viewToUse && userCompany) {
    if (userCompany.shareAllAbsences) {
        viewToUse = 'company'; // Show company-wide if sharing is enabled
    } else {
        viewToUse = 'team'; // Default to team view
    }
} else if (!viewToUse) {
    viewToUse = 'team'; // Fallback
}
```

### API Implementation

#### 1. Company Settings API
**Location**: `app/api/company/route.ts:14, 89-92`

```typescript
// Schema validation
const updateCompanySchema = z.object({
    shareAllAbsences: z.boolean().optional(),
    // ... other fields
});

// Update implementation
const updatedCompany = await prisma.company.update({
    where: { id: user.companyId },
    data: validation.data,
});
```

#### 2. Calendar API Permission Logic
**Location**: `app/api/calendar/month/route.ts:75-96`

```typescript
// Team view permission check
if (!isSuper && !isInDept && !company.shareAllAbsences) {
    return ApiErrors.forbidden('You do not have permission to view this department');
}

// Company view permission check
if (!user.isAdmin && !user.company.shareAllAbsences) {
    return ApiErrors.forbidden('You do not have permission to view company-wide absences');
}
```

### User Authentication Context
**Location**: `lib/rbac.ts:8-18`

The `getCurrentUser()` function includes company data for frontend access:

```typescript
export async function getCurrentUser() {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            company: true,  // ← Includes shareAllAbsences setting
            department: true,
            defaultRole: true,
        }
    });
    return user;
}
```

## User Experience

### Settings Location
1. Navigate to **Settings → Company**
2. Find **"Share All Absences"** toggle in the company settings form
3. Toggle ON to enable company-wide visibility
4. Toggle OFF to restrict to team/department visibility
5. Click **"Update settings"** to save changes

### Calendar Behavior

#### When "Share All Absences" is ON:
- ✅ All employees can see absences across entire company
- ✅ Calendar defaults to company view
- ✅ Users can filter by any department or employee
- ✅ Wall chart and list views show company-wide data
- ✅ No permission restrictions for calendar access

#### When "Share All Absences" is OFF:
- ✅ Employees only see absences from their department
- ✅ Calendar defaults to team view
- ✅ Non-admin users cannot access other departments' data
- ✅ Supervisors can see their managed departments
- ✅ Company-wide filters are restricted for non-admins

### Permission Matrix

| User Role | Sharing ON | Sharing OFF |
|-----------|-------------|-------------|
| **Admin** | ✅ Company-wide access | ✅ Company-wide access |
| **Supervisor** | ✅ Company-wide access | ✅ Managed departments + own department |
| **Employee** | ✅ Company-wide access | ✅ Own department only |

## Security & Privacy

### Access Control
1. **Admin Override**: Administrators always have full access regardless of setting
2. **Role-Based**: Different visibility levels for different user roles
3. **API Enforcement**: Backend validates permissions on every request

### Privacy Protection
1. **Default Restricted**: Setting defaults to `false` for privacy-first approach
2. **Department Boundaries**: Maintains data segregation when disabled
3. **Audit Trail**: All access logged and monitored

## Testing

### Test Scenarios

#### 1. Toggle Functionality
- [ ] Enable toggle and verify company-wide visibility
- [ ] Disable toggle and verify restricted visibility
- [ ] Test toggle persistence after page refresh

#### 2. Permission Testing
- [ ] Verify admin always has full access
- [ ] Test supervisor access with different settings
- [ ] Confirm employee restrictions when disabled

#### 3. Calendar View Testing
- [ ] Test month view with both settings
- [ ] Test wall chart view behavior
- [ ] Verify list view restrictions
- [ ] Test filter functionality in both modes

#### 4. Edge Cases
- [ ] Test with no departments configured
- [ ] Test with single user company
- [ ] Verify behavior during toggle changes

### Performance Considerations
- **Database Queries**: Efficient filtering using Prisma where clauses
- **Frontend State**: Minimal additional state management
- **API Responses**: No performance impact on existing endpoints

## Troubleshooting

### Common Issues

#### 1. "Toggle has no effect"
**Cause**: Frontend not accessing company data or not triggering re-fetch
**Solution**: Verify user data fetching and calendar view updates

#### 2. "Permission denied errors"
**Cause**: Backend permission logic blocking valid requests
**Solution**: Check user roles and company setting in database

#### 3. "Calendar shows wrong data"
**Cause**: View parameter not being passed correctly to API
**Solution**: Verify URL parameters and API request structure

### Debug Steps
1. Check `share_all_absences` column in database
2. Verify API response from `/api/users/me` includes company data
3. Monitor network requests for correct `view` parameters
4. Review console logs for permission errors

## Related Features

### Integration Points
- **Team View Toggle**: Works together with "Hide Team View" setting
- **Supervisor System**: Respects departmental hierarchy
- **Calendar Filters**: Filter options adapt based on sharing settings
- **Notification System**: No impact on notification delivery

### Dependencies
- **User Authentication**: Requires authenticated user session
- **Company Structure**: Depends on departments and users being configured
- **Calendar System**: Integrates with all calendar view types

## Future Enhancements

### Potential Improvements
1. **Granular Permissions**: Allow selective sharing by department
2. **Time-Based Sharing**: Enable sharing during specific periods
3. **User Preferences**: Individual override settings per user
4. **Audit Dashboard**: Track who accessed shared data and when

### Considerations
- **Compliance**: Additional data protection regulations
- **Performance**: Large company data sets
- **User Experience**: More intuitive control interface
- **Mobile**: Consistent behavior across devices

---

**Last Updated**: January 30, 2026  
**Version**: 1.0  
**Maintainer**: Development Team