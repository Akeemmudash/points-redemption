<?php

namespace App\Services;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use App\Models\Customer;
use App\Models\Redemption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RedemptionService
{
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

    private function reverse(Redemption $redemption, array $response): void
    {
        DB::transaction(function () use ($redemption, $response) {
            $redemption->customer->increment('points_balance', $redemption->points_deducted);

            $redemption->update([
                'status'       => RedemptionStatus::Failed,
                'bap_response' => $response,
            ]);
        });
    }

    private function keepPending(Redemption $redemption, array $response): void
    {
        $redemption->update(['bap_response' => $response]);
    }

    public function __construct(private BapService $bap) {}
    public function redeem(Customer $customer, int $points, int $amount, ServiceType $serviceType): Redemption
    {
        abort_if($customer->points_balance < $points, 422, 'Insufficient points');

        $redemption =  DB::transaction(function () use ($customer, $points, $amount, $serviceType) {
            $customer->decrement('points_balance', $points);
            return Redemption::create([
                'customer_id' => $customer->id,
                'points_deducted' => $points,
                'amount' => $amount,
                'service_type' => $serviceType,
                'payment_reference' => 'PP-' . Str::uuid(),
                'status' => RedemptionStatus::Pending,
            ]);
        });

        $response = $this->bap->charge($redemption->payment_reference, $redemption->amount);
        $this->applyResponse($redemption, $response);
        return $redemption->refresh();
    }
}
