# Revert Transactions Pagination to Original Pattern

The user is dissatisfied with the current pagination implementation and has requested a return to the "previous" style. We will restore the manual state management and simple navigation while maintaining the backend performance optimizations.

## Proposed Changes

### Frontend

#### [MODIFY] [useTransactions.ts](file:///d:/Expense-Tracker/Expense-Tracker/frontend/src/hooks/useTransactions.ts)
- Maintain the `useQuery` implementation to keep React Query's caching benefits, as the user didn't explicitly reject it.
- Ensure the hook correctly returns the paginated data object.

#### [MODIFY] [page.tsx](file:///d:/Expense-Tracker/Expense-Tracker/frontend/src/app/(dashboard)/transactions/page.tsx)
- Revert the UI from complex numbered pagination to simple "Previous" and "Next" buttons.
- Ensure `page` state is correctly used to fetch results.
- Remove the "Viewing X of Y" counter unless absolutely necessary.
- Fix any potential logic errors causing the buttons not to appear.

### Backend [Done]
- Backend is already optimized with `skip/limit` and `totalItems` metadata.

## Verification Plan
1. Manually navigate through pages.
2. Verify that filters update the list and reset the page.
3. Verify that adding/editing/deleting transactions still triggers a refresh.
