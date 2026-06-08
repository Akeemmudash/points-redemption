<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportFilterRequest;
use App\Services\ReportService;

class ReportController extends Controller
{
    public function summary(ReportFilterRequest $request, ReportService $reports)
    {
        return response()->json([
            'data' => $reports->summary($request->validated()),
        ]);
    }

    public function export(ReportFilterRequest $request, ReportService $reports)
    {
        $query = $reports->baseQuery($request->validated())
            ->with('customer')
            ->latest();

        $filename = 'transactions-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');

            // Header row
            fputcsv($out, [
                'ID',
                'Customer',
                'Email',
                'Payment Reference',
                'Points Deducted',
                'Amount (kobo)',
                'Service Type',
                'Status',
                'Created At',
            ]);

            $query->lazyById()->each(function ($r) use ($out) {
                fputcsv($out, [
                    $r->id,
                    $r->customer?->name,
                    $r->customer?->email,
                    $r->payment_reference,
                    $r->points_deducted,
                    $r->amount,
                    $r->service_type->value,
                    $r->status->value,
                    $r->created_at->toDateTimeString(),
                ]);
            });

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
