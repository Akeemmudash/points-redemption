<?php

namespace App\Jobs;

use App\Enums\RedemptionStatus;
use App\Models\Redemption;
use App\Models\TransactionLog;
use App\Services\BapService;
use App\Services\RedemptionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReconcileRedemption implements ShouldQueue
{
    use Queueable;
    public int $tries = 3;
    public array $backoff = [10, 30, 60];


    /**
     * Create a new job instance.
     */
    public function __construct(public int $redemptionId){}


    /**
     * Execute the job.
     */
    public function handle(BapService $bap, RedemptionService $redemptions): void
    {
        $redemption = Redemption::find($this->redemptionId);

        if (! $redemption || $redemption->status !== RedemptionStatus::Pending) {
            return;
        }

        $response = $bap->requery($redemption->payment_reference);

        $redemption->increment('requery_attempts');
        $redemption->update(['last_requery_at' => now()]);
        TransactionLog::create([
            'redemption_id' => $redemption->id,
            'action' => 'requery',
            'from_status' => RedemptionStatus::Pending->value,
            'to_status' => null,
            'context' => $response,
        ]);

        $redemptions->finalize($redemption, $response);
    }
}
