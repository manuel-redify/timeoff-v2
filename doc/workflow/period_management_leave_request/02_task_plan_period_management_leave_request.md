# Master Plan - Advanced Period Management for Leave Requests (Hours/Minutes)

**Status:** In Progress
**Source:** doc/prd/prd_period_management_leave_request.md

### Milestone 1: Database & Backend Core
- [x] 1.1: Create database migration for timestamp storage (dateStart/dateEnd as DateTime)
- [x] 1.2: Implement durationMinutes calculation logic
- [x] 1.3: Implement working days calculation (excluding weekends/holidays)
- [x] 1.4: Implement overlap prevention validation
- [x] 1.5: Add allowance validation (non-blocking warning)

### Milestone 2: Frontend Form Components
- [ ] 2.1: Build custom Time Picker component (Popover with Hours/Minutes)
- [ ] 2.2: Implement period selection presets (All Day, Morning, Afternoon)
- [ ] 2.3: Add Custom Range time selection for single-day requests
- [ ] 2.4: Build mobile-optimized Drawer layout
- [ ] 2.5: Add Notes textarea component

### Milestone 3: Admin On-Behalf Flow
- [ ] 3.1: Create employee Combobox with search functionality
- [ ] 3.2: Implement async context loading (balance, leave types)
- [ ] 3.3: Add privilege override for insufficient balance
- [ ] 3.4: Set default APPROVED status for admin-created requests
- [ ] 3.5: Implement Audit trail (byUserId, userId)

### Milestone 4: Calendar Visualization
- [ ] 4.1: Implement proportional positioning (Mini-Gantt style)
- [ ] 4.2: Add density indicators for stacked requests
- [ ] 4.3: Build tooltips with exact intervals and comments

### Milestone 5: Validation & Integration
- [ ] 5.1: Implement multi-day to single-day smart reset logic
- [ ] 5.2: Add chronological validation (End Time > Start Time)
- [ ] 5.3: Real-time duration display with company day conversion
- [ ] 5.4: End-to-end testing with all test cases

## 🔄 Next Steps
- Start Milestone 1 by creating the Detailed Phase file.
- Once all tasks are marked [x], trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Initial Plan based on PRD v3.5 |

