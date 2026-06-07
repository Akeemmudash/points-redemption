<?php

namespace App\Services;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use App\Models\Customer;
use App\Models\Redemption;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RedemptionService
{
    public function __construct(private BapService $bap) {}

    private function applyResponse(Redemption $redemption, array $response): void
    {
        match ($response['status']) {
            'successful' => $this->markSuccessful($redemption, $response),
            'failed'     => $this->reverse($redemption, $response),
            default      => $this->keepPending($redemption, $response),
        };
    }

    private function markSuccessful(Redemption $redemption, array $response): void
    {
        $redemption->update([
            'status'       => RedemptionStatus::Successful,
            'bap_response' => $response,
        ]);
    }

    private function keepPending(Redemption $redemption, array $response): void
    {
        $redemption->update(['bap_response' => $response]);
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

                return Redemption::create([
                    'customer_id' => $customer->id,
                    'points_deducted' => $points,
                    'amount' => $amount,
                    'idempotency_key' => $idempotencyKey,
                    'service_type' => $serviceType,
                    'payment_reference' => 'PP-' . Str::uuid(),
                    'status' => RedemptionStatus::Pending,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            return Redemption::where('idempotency_key', $idempotencyKey)->firstOrFail();
        }

        $response = $this->bap->charge($redemption->payment_reference, $redemption->amount);
        $this->applyResponse($redemption, $response);
        return $redemption->refresh();
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
        });
    }
}
