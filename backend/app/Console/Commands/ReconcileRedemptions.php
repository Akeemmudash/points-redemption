<?php

namespace App\Console\Commands;

use App\Services\ReconciliationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('redemptions:reconcile')]
#[Description('Queue pending redemptions for reconciliation.')]
class ReconcileRedemptions extends Command
{
    protected $signature = 'redemptions:reconcile';
    protected $description = 'Queue pending redemptions for reconciliation.';

    public function handle(ReconciliationService $reconciliation): int
    {
        $count = $reconciliation->queuePending();
        $this->info("Queued {$count} pending redemption(s).");

        return self::SUCCESS;
    }
}
