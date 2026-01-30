# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

### API Module Architecture
- **Issue**: Multi-level approval functionality is disabled due to model migration issues
- **Files**: `backend/workorder/urls.py` (lines 23-35)
- **Impact**: Advanced approval workflows cannot be used
- **Fix approach**: Complete the abandoned multi-level approval model migrations and uncomment the disabled views

### Task Assignment Algorithm
- **Issue**: Round-robin task assignment strategy lacks persistence of last assigned operator
- **Files**: `backend/workorder/models/core.py` (line 726)
- **Impact**: Not truly round-robin, may assign same operator consecutively
- **Fix approach**: Implement persistent state tracking for round-robin assignments

### Error Handling in Production
- **Issue**: Default fallback SECRET_KEY in production settings
- **Files**: `backend/config/settings.py` (lines 18-22)
- **Impact**: Security risk if environment variable is not properly configured
- **Fix approach**: Remove fallback key and fail fast if SECRET_KEY is not set

## Known Bugs

### Missing Inventory Actions
- **Bug**: Stock-in and stock-out operations lack actual stock quantity updates
- **Files**: `backend/workorder/views/inventory.py` (lines 287, 334)
- **Symptoms**: ProductStock records not created when expected
- **Trigger**: Performing inventory transactions
- **Workaround**: Manual database updates required

### Undelivered Feature Implementations
- **Bug**: Several TODO items mark incomplete features
- **Files**: Multiple files throughout codebase
- **Symptoms**: Missing functionality for core business features
- **Specific areas**:
  - Production time tracking in `backend/workorder/models/finance.py`
  - Supplier statement logic in `backend/workorder/views/finance.py`
  - Photo upload in `frontend/src/views/inventory/components/DeliveryReceiveDialog.vue`
  - API integration in `frontend/src/store/modules/user.js`

## Security Considerations

### Debug Mode Risk
- **Risk**: DEBUG flag can be enabled in production
- **Files**: `backend/config/settings.py` (line 25)
- **Current mitigation**: Environment variable control
- **Recommendations**: Add additional validation to prevent accidental production debug enablement

### CORS Configuration
- **Risk**: Open CORS configuration in development
- **Files**: `backend/config/settings.py`
- **Current mitigation**: Environment-based restrictions
- **Recommendations**: Implement stricter CORS policies for production environments

## Performance Bottlenecks

### Large Detail Component
- **Problem**: WorkOrderDetail.vue has high complexity (3508 lines)
- **Files**: `frontend/src/views/workorder/Detail.vue`
- **Cause**: Monolithic component handling multiple responsibilities
- **Improvement path**: Split into smaller, focused components

### Database Query Optimization
- **Problem**: Potential N+1 queries in views
- **Files**: `backend/workorder/views/work_orders.py`
- **Cause**: Missing select_related/prefetch_related optimizations
- **Improvement path**: Add query optimizations where needed

## Fragile Areas

### Multi-level Approval System
- **Files**: `backend/workorder/urls.py` (disabled), `backend/workorder/views/multi_level_approval.py` (commented)
- **Why fragile**: Feature disabled but dependencies may exist
- **Safe modification**: Enable only after testing in isolated environment
- **Test coverage**: Unknown due to disabled state

### Migration Dependencies
- **Files**: Multiple migration files with complex dependencies
- **Why fragile**: Manual intervention required for multi-level approval
- **Safe modification**: Always create new migrations with makemigrations
- **Test coverage**: Unknown for disabled features

## Scaling Limits

### SQLite Limitation
- **Current capacity**: Suitable for small to medium deployments
- **Limit**: Performance degradation with large datasets
- **Scaling path**: Migrate to PostgreSQL for production

### Frontend Bundle Size
- **Current capacity**: Large components (Detail.vue 3508 lines)
- **Limit**: Slow initial load times
- **Scaling path**: Component splitting and code splitting

## Dependencies at Risk

### Vue 2.x End of Life
- **Risk**: No longer receiving security updates
- **Impact**: Security vulnerabilities may accumulate
- **Migration plan**: Consider Vue 3 migration path

## Missing Critical Features

### Production Time Tracking
- **Problem**: Time management module not implemented
- **Blocks**: Production cost calculations and employee performance tracking
- **Status**: Marked as TODO in finance models

### Automated Notifications
- **Problem**: Real-time notification system partially implemented
- **Blocks**: Timely alerts for deadline warnings and task assignments
- **Status**: Basic structure exists but may need enhancement

## Test Coverage Gaps

### Frontend Testing
- **What's not tested**: Most Vue components lack unit tests
- **Files**: `frontend/src/**/*.vue`
- **Risk**: Component changes may introduce unnoticed bugs
- **Priority**: High

### Integration Testing
- **What's not tested**: End-to-end workflows for core business processes
- **Files**: `backend/workorder/tests/`
- **Risk**: Integration issues between models and views
- **Priority**: Medium

---

*Concerns audit: 2026-01-30*