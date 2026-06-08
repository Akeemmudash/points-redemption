<?php

namespace App\Services;

use App\Models\Redemption;
use Illuminate\Database\Eloquent\Builder;

class ReportService
{
    public function baseQuery(array $filters): Builder
    {
        return Redemption::query()
            ->when($filters['from'] ?? null, fn(Builder $q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn(Builder $q, $to) => $q->whereDate('created_at', '<=', $to))
            ->when($filters['customer_id'] ?? null, fn(Builder $q, $id) => $q->where('customer_id', $id))
            ->when($filters['status'] ?? null, fn(Builder $q, $status) => $q->where('status', $status))
            ->when($filters['service_type'] ?? null, fn(Builder $q, $type) => $q->where('service_type', $type));
    }

    public function summary(array $filters): array
    {
        $stats = $this->baseQuery($filters)->selectRaw("
            COUNT(*) AS total_transactions,
            COUNT(*) FILTER (WHERE status = 'successful') AS total_successful,
            COUNT(*) FILTER (WHERE status = 'failed')     AS total_failed,
            COUNT(*) FILTER (WHERE status = 'pending')    AS total_pending,
            COALESCE(SUM(points_deducted), 0)                              AS total_points_deducted,
            COALESCE(SUM(points_deducted) FILTER (WHERE status = 'failed'), 0) AS total_points_reversed
        ")->first();

        return [
            'total_transactions'    => (int) $stats->total_transactions,
            'total_successful'      => (int) $stats->total_successful,
            'total_failed'          => (int) $stats->total_failed,
            'total_pending'         => (int) $stats->total_pending,
            'total_points_deducted' => (int) $stats->total_points_deducted,
            'total_points_reversed' => (int) $stats->total_points_reversed,
        ];
    }
}
