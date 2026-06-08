<?php
namespace App\Services;

use App\Enums\RedemptionStatus;
use App\Jobs\ReconcileRedemption;
use App\Models\Redemption;

class ReconciliationService
{
    public function queuePending(): int
    {
        $count = 0;

        Redemption::where('status', RedemptionStatus::Pending->value)
            ->where('created_at', '<=', now()->subMinutes(2))
            ->lazyById()
            ->each(function (Redemption $redemption) use (&$count) {
                ReconcileRedemption::dispatch($redemption->id);
                $count++;
            });

        return $count;
    }
}