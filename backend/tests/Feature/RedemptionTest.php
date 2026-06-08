<?php

namespace Tests\Feature;

use App\Enums\RedemptionStatus;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Redemption;
use App\Models\User;
use App\Services\BapService;
use App\Services\RedemptionService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Support\FakeBapService;

class RedemptionTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(
            User::factory()->create(['role' => UserRole::Admin])
        );
    }

    public function test_deducts_points_on_a_successful_redemption(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 1000]);

        $this->mock(BapService::class)->shouldReceive('charge')->once()
            ->andReturnUsing(fn() => ['response_code' => '00', 'status' => 'successful', 'status_code' => 0, 'status_message' => 'ok']);

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'k-success',
        ])->assertCreated();

        $this->assertEquals(700, $customer->fresh()->points_balance);
        $this->assertDatabaseHas('redemptions', ['status' => 'successful', 'points_deducted' => 300]);
    }

    public function test_refunds_points_on_a_failed_redemption(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 1000]);

        $this->mock(BapService::class)->shouldReceive('charge')->once()
            ->andReturnUsing(fn() => ['response_code' => '99', 'status' => 'failed', 'status_code' => 2, 'status_message' => 'failed']);

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'k-fail',
        ])->assertCreated();

        $this->assertEquals(1000, $customer->fresh()->points_balance);
        $this->assertDatabaseHas('redemptions', ['status' => 'failed']);
    }

    public function test_leaves_a_redemption_pending_when_the_provider_is_unsure(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 1000]);

        $this->mock(BapService::class)->shouldReceive('charge')->once()
            ->andReturnUsing(fn() => ['response_code' => '90009', 'status' => 'paid', 'status_code' => 1, 'status_message' => 'in progress']);

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'k-pending',
        ])->assertCreated();

        $this->assertEquals(700, $customer->fresh()->points_balance);
        $this->assertDatabaseHas('redemptions', ['status' => 'pending']);
    }

    public function test_rejects_a_redemption_when_points_are_insufficient(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 100]);

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'k-broke',
        ])->assertStatus(422);

        $this->assertEquals(100, $customer->fresh()->points_balance);
        $this->assertDatabaseCount('redemptions', 0);
    }

    public function test_processes_a_repeated_idempotency_key_only_once(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 1000]);

        $this->mock(BapService::class)->shouldReceive('charge')->once()
            ->andReturnUsing(fn() => ['response_code' => '00', 'status' => 'successful', 'status_code' => 0, 'status_message' => 'ok']);

        $payload = [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'dup-key',
        ];

        $this->postJson('/api/redemptions', $payload)->assertCreated();
        $this->postJson('/api/redemptions', $payload);

        $this->assertEquals(700, $customer->fresh()->points_balance);
        $this->assertDatabaseCount('redemptions', 1);
    }

    public function test_reconciles_a_pending_redemption_and_is_safe_to_re_run(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['points_balance' => 1000]);

        $fake = new FakeBapService();
        $fake->chargeResponse  = ['response_code' => '90009', 'status' => 'paid',   'status_code' => 1, 'status_message' => 'in progress'];
        $fake->requeryResponse = ['response_code' => '99',    'status' => 'failed', 'status_code' => 2, 'status_message' => 'failed'];
        $this->app->instance(BapService::class, $fake);

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 300,
            'amount' => 30000,
            'service_type' => 'airtime',
            'idempotency_key' => 'recon',
        ])->assertCreated();
        $this->assertDatabaseHas('redemptions', ['status' => 'pending']);
        $this->assertEquals(700, $customer->fresh()->points_balance);

        Redemption::query()->update(['created_at' => now()->subMinutes(5)]);
        $this->postJson('/api/reconciliation/run')->assertOk();

        $this->assertDatabaseHas('redemptions', ['status' => 'failed']);
        $this->assertEquals(1000, $customer->fresh()->points_balance);

        $this->postJson('/api/reconciliation/run');
        $this->assertEquals(1000, $customer->fresh()->points_balance);
    }

    public function test_does_not_reverse_points_twice(): void
    {
        $customer = Customer::factory()->create(['points_balance' => 700]);
        $redemption = Redemption::factory()->for($customer)->failed()->create(['points_deducted' => 300]);

        app(RedemptionService::class)->finalize($redemption, [
            'response_code' => '99',
            'status' => 'failed',
            'status_code' => 2,
            'status_message' => 'failed',
        ]);

        $this->assertEquals(700, $customer->fresh()->points_balance);
    }

    public function test_cannot_store_two_redemptions_with_the_same_idempotency_key(): void
    {
        $customer = Customer::factory()->create();
        Redemption::factory()->for($customer)->create(['idempotency_key' => 'same']);

        $this->expectException(UniqueConstraintViolationException::class);
        Redemption::factory()->for($customer)->create(['idempotency_key' => 'same']);
    }

    public function test_rejects_an_unauthenticated_redemption_request(): void
    {
        $customer = Customer::factory()->create();

        $this->postJson('/api/redemptions', [
            'customer_id' => $customer->id,
            'points' => 100,
            'amount' => 10000,
            'service_type' => 'airtime',
            'idempotency_key' => 'no-auth',
        ])->assertUnauthorized();
    }
}
