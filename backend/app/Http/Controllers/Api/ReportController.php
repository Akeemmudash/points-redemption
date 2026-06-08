<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportFilterRequest;
use App\Services\ReportService;
use OpenApi\Attributes as OA;

class ReportController extends Controller
{
    #[OA\Get(
        path: '/api/reports/summary',
        summary: 'Get summary report',
        tags: ['Reports'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'from', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-01'),
            new OA\Parameter(name: 'to', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-30'),
            new OA\Parameter(name: 'customer_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer'), example: 11),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'successful', 'failed'])),
            new OA\Parameter(name: 'service_type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['airtime', 'data', 'electricity', 'cable_tv'])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Summary report retrieved',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'total_redemptions', type: 'integer', example: 15),
                                new OA\Property(property: 'total_points_deducted', type: 'integer', example: 4500),
                                new OA\Property(property: 'total_amount', type: 'integer', example: 450000),
                                new OA\Property(property: 'success_rate', type: 'number', format: 'float', example: 86.67),
                            ]
                        )
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function summary(ReportFilterRequest $request, ReportService $reports)
    {
        return response()->json([
            'data' => $reports->summary($request->validated()),
        ]);
    }

    #[OA\Get(
        path: '/api/reports/export',
        summary: 'Export report to CSV',
        tags: ['Reports'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'from', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-01'),
            new OA\Parameter(name: 'to', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-30'),
            new OA\Parameter(name: 'customer_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer'), example: 11),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'successful', 'failed'])),
            new OA\Parameter(name: 'service_type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['airtime', 'data', 'electricity', 'cable_tv'])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'CSV file stream',
                content: new OA\MediaType(
                    mediaType: 'text/csv',
                    schema: new OA\Schema(type: 'string')
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
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
