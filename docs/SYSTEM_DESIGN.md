# System Design Explanation

This document details the architecture, design choices, and transaction integrity strategy implemented in the Points Redemption & Transaction Reconciliation System.

---

## 1. Backend Architecture & Design Patterns

The backend is built with **Laravel 11** using a clean, service-oriented architecture to keep controller thin and business logic decoupled:

- **Service Layer**:
  - `RedemptionService`: Orchestrates customer point checks, point deductions, mock BAP charge initiation, status resolution, and point reversals.
  - `ReconciliationService`: Manages command-line and queue execution tasks for fetching, processing, and recording updates for pending transactions.
  - `BapService`: Simulates third-party provider responses (Successful, Failed, Paid/Progress, Timeout) and handles payment requeries.
  - `ReportService`: Consolidates summary metrics and powers the dynamic CSV export stream.
- **Form Requests**: Used for input validation on all creation, updates, filtering, and reporting endpoints (e.g., `StoreRedemptionRequest`, `RedemptionIndexRequest`, `ReportFilterRequest`).
- **API Resources**: Formats payload outputs (e.g., `CustomerResource`, `RedemptionResource`, `TransactionLogResource`) and conditionally preloads database relationships to prevent N+1 performance issues.
- **Middleware**: Custom `EnsureUserHasRole` middleware verifies admin privilege via Sanctum token verification.
- **Rate Limiting**: Configured custom rate-limit throttles on authentication and points redemption routes to prevent brute-force and DDoS attempts.

---

## 2. Transaction Integrity & Concurrency Handling

Handling concurrent requests, avoiding duplicate payments, and preventing double deduction or double reversal of points is critical:

1. **Idempotency Guard**:
   - The client generates a unique `idempotency_key` (typically a UUID) when loading the redemption request form.
   - The backend checks for an existing record with that key before taking any action. If a match is found, it immediately returns the original response.
   - To prevent race conditions where two requests arrive simultaneously, the `idempotency_key` column has a **unique database constraint**. If both insert concurrently, the database blocks one, throwing a `UniqueConstraintViolationException` which is caught to safely return the first record.
2. **Optimistic & Pessimistic Locking**:
   - During points deduction, the customer record is locked using **pessimistic locking** (`lockForUpdate()`) inside a database transaction (`DB::transaction`). This prevents concurrent requests from reading or writing outdated balances.
   - For points reversal (on failed redemptions) and status updates (on reconciliation), the redemption row is locked using `lockForUpdate()` and checks the status first. If the status is not `pending`, the execution returns early, avoiding duplicate reversals.

---

## 3. Reconciliation & Background Workers

The reconciliation layer handles transactions that do not complete immediately (timeouts or paid/progress status):

- **Cron Schedule**: A cron scheduler runs `php artisan redemptions:reconcile` every 5 minutes (configured in `routes/console.php`).
- **Queue Worker**: The reconciliation command dispatches individual `ReconcileRedemption` background jobs (pushed to the database queue) for each pending record.
- **Requery Attempts**: Each job calls `BapService::requery` and logs the outcome in the `transaction_logs` table (acting as an audit trail). If the status is resolved, the points are reversed (Failed) or kept (Successful); if still pending, it retries with an exponential backoff configuration (`$backoff = [10, 30, 60]`).
- **Dashboard Action**: Admins can manually trigger this reconciliation flow via `POST /api/reconciliation/run`.

---

## 4. Database Schema

The schema consists of:
- `users`: Stores admin credentials and their casted `UserRole` enums.
- `customers`: Stores customer name, contact details, points balance, and status.
- `redemptions`: Stores customer reference, points deducted, amount, payment reference, status, BAP response details, requery attempts, and timestamps.
- `transaction_logs`: Stores historical audit trails detailing `action`, status state-transitions (`from_status` -> `to_status`), and JSON context.
