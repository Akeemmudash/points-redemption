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
    public function redeem(Customer $customer, int $points, int $amount, ServiceType $serviceType): Redemption
    {
        abort_if($customer->points_balance < $points, 422, 'Insufficient points');

        return DB::transaction(function () use ($customer, $points, $amount, $serviceType) {
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
    }
}
