<?php

namespace App\Services;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use App\Models\Customer;
use App\Models\Redemption;
use App\Models\TransactionLog;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RedemptionService
{
    public function __construct(private BapService $bap) {}

    public function finalize(Redemption $redemption, array $response): void
    {
        match ($response['status']) {
            'successful' => $this->markSuccessful($redemption, $response),
            'failed'     => $this->reverse($redemption, $response),
            default      => $this->keepPending($redemption, $response),
        };
    }

    private function markSuccessful(Redemption $redemption, array $response): void
    {
        DB::transaction(function () use ($redemption, $response) {
            $fresh = Redemption::whereKey($redemption->getKey())->lockForUpdate()->first();
            if ($fresh->status !== RedemptionStatus::Pending) {
                return;
            }
            $fresh->update(['status' => RedemptionStatus::Successful, 'bap_response' => $response]);
            $this->log($fresh, 'finalized.successful', RedemptionStatus::Pending, RedemptionStatus::Successful, $response);
        });
    }

    private function keepPending(Redemption $redemption, array $response): void
    {
        $redemption->update(['bap_response' => $response]);
        $this->log($redemption, 'still.pending', RedemptionStatus::Pending, RedemptionStatus::Pending, $response);
    }

    private function reverse(Redemption $redemption, array $response): void
    {
        DB::transaction(function () use ($redemption, $response) {
            $fresh = Redemption::whereKey($redemption->getKey())->lockForUpdate()->first();
            if ($fresh->status !== RedemptionStatus::Pending) {
                return;
            }

            Customer::whereKey($fresh->customer_id)->lockForUpdate()->first()->increment('points_balance', $fresh->points_deducted);

            $fresh->update([
                'status'       => RedemptionStatus::Failed,
                'bap_response' => $response,
            ]);
            $this->log($fresh, 'finalized.failed', RedemptionStatus::Pending, RedemptionStatus::Failed, $response);
        });
    }


    private function log(Redemption $r, string $action, ?RedemptionStatus $from, ?RedemptionStatus $to, array $context = []): void
    {
        TransactionLog::create([
            'redemption_id' => $r->id,
            'action'        => $action,
            'from_status'   => $from?->value,
            'to_status'     => $to?->value,
            'context'       => $context,
        ]);
    }

    public function redeem(Customer $customer, int $points, int $amount, ServiceType $serviceType, string $idempotencyKey): Redemption
    {

        if ($existing = Redemption::where('idempotency_key', $idempotencyKey)->first()) {
            return $existing;
        }

        try {
            $redemption =  DB::transaction(function () use ($customer, $idempotencyKey, $points, $amount, $serviceType) {
                $locked = Customer::whereKey($customer->getKey())->lockForUpdate()->first();

                abort_if($locked->points_balance < $points, 422, 'Insufficient points');
                $locked->decrement('points_balance', $points);

                $redemption = Redemption::create([
                    'customer_id' => $locked->id,
                    'points_deducted' => $points,
                    'amount' => $amount,
                    'idempotency_key' => $idempotencyKey,
                    'service_type' => $serviceType,
                    'payment_reference' => 'PP-' . Str::uuid(),
                    'status' => RedemptionStatus::Pending,
                ]);
                $this->log($redemption, 'created', null, RedemptionStatus::Pending);
                return $redemption;
            });
        } catch (UniqueConstraintViolationException $e) {
            return Redemption::where('idempotency_key', $idempotencyKey)->firstOrFail();
        }

        $response = $this->bap->charge($redemption->payment_reference, $redemption->amount);
        $this->finalize($redemption, $response);
        return $redemption->refresh();
    }
}
