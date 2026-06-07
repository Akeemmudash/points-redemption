<?php

namespace Database\Factories;

use App\Enums\ServiceType;
use App\Enums\RedemptionStatus;
use App\Models\Customer;
use App\Models\Redemption;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Redemption>
 */
class RedemptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $points = fake()->numberBetween(100, 2000);

        return [
            'customer_id' => Customer::factory(),
            'idempotency_key' => (string) Str::uuid(),
            'payment_reference' => 'PP-' . Str::uuid(),
            'points_deducted' => $points,
            'amount' => $points * 100,
            'service_type' => fake()->randomElement(ServiceType::cases()),
            'status' => RedemptionStatus::Pending,
            'bap_response' => null,
            'requery_attempts' => 0,
            'last_requery_at' => null,
        ];
    }

    public function successful(): static
    {
        return $this->state(fn() => ['status' => RedemptionStatus::Successful]);
    }

    public function failed(): static
    {
        return $this->state(fn() => ['status' => RedemptionStatus::Failed]);
    }
}
