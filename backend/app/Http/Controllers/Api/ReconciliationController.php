<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReconciliationService;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ReconciliationController extends Controller
{
    #[OA\Post(
        path: '/api/reconciliation/run',
        summary: 'Run reconciliation',
        tags: ['Reconciliation'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reconciliation run triggered',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Queued 1 pending redemption(s) for reconciliation.'),
                        new OA\Property(property: 'queued', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function run(ReconciliationService $reconciliation)
    {
        $count = $reconciliation->queuePending();

        return response()->json([
            'message' => "Queued {$count} pending redemption(s) for reconciliation.",
            'queued' => $count,
        ]);
    }
}

