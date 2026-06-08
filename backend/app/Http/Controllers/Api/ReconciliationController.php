<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReconciliationService;

use Illuminate\Http\Request;

class ReconciliationController extends Controller
{
    public function run(ReconciliationService $reconciliation)
    {
        $count = $reconciliation->queuePending();

        return response()->json([
            'message' => "Queued {$count} pending redemption(s) for reconciliation.",
            'queued' => $count,
        ]);
    }
}
