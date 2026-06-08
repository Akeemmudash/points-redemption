<?php

namespace Tests\Feature;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Redemption;
use App\Models\TransactionLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RedemptionApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(
            User::factory()->create(['role' => UserRole::Admin])
        );
    }

    private function actingAsUser(): void
    {
        Sanctum::actingAs(
            User::factory()->create(['role' => UserRole::User])
        );
    }

    public function test_list_endpoint_returns_paginated_redemptions(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create();
        Redemption::factory()->count(20)->for($customer)->create();

        $response = $this->getJson('/api/redemptions')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'customer_id',
                        'payment_reference',
                        'points_deducted',
                        'amount',
                        'service_type',
                        'status',
                        'requery_attempts',
                        'last_requery_at',
                        'bap_response',
                        'created_at',
                    ]
                ],
                'links',
                'meta',
            ]);

        $this->assertCount(15, $response->json('data'));
    }

    public function test_list_endpoint_filters_correctly(): void
    {
        $this->actingAsAdmin();
        $customer1 = Customer::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $customer2 = Customer::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $r1 = Redemption::factory()->for($customer1)->create([
            'status' => RedemptionStatus::Successful,
            'service_type' => ServiceType::Airtime,
            'payment_reference' => 'REF-JOHN-123',
            'created_at' => '2026-06-01 10:00:00',
        ]);

        $r2 = Redemption::factory()->for($customer2)->create([
            'status' => RedemptionStatus::Failed,
            'service_type' => ServiceType::Data,
            'payment_reference' => 'REF-JANE-456',
            'created_at' => '2026-06-10 10:00:00',
        ]);

        $response = $this->getJson('/api/redemptions?status=successful')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r1->id, $response->json('data.0.id'));

        $response = $this->getJson('/api/redemptions?service_type=data')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r2->id, $response->json('data.0.id'));

        $response = $this->getJson('/api/redemptions?customer_id=' . $customer1->id)->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r1->id, $response->json('data.0.id'));

        $response = $this->getJson('/api/redemptions?from=2026-06-01&to=2026-06-05')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r1->id, $response->json('data.0.id'));

        $response = $this->getJson('/api/redemptions?search=john')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r1->id, $response->json('data.0.id'));

        $response = $this->getJson('/api/redemptions?search=REF-JANE')->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($r2->id, $response->json('data.0.id'));
    }

    public function test_show_endpoint_returns_detail_with_relations(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create(['name' => 'Jane Smith']);
        $redemption = Redemption::factory()->for($customer)->create([
            'status' => RedemptionStatus::Pending,
        ]);

        TransactionLog::create([
            'redemption_id' => $redemption->id,
            'action' => 'created',
            'from_status' => null,
            'to_status' => 'pending',
            'context' => [],
        ]);

        TransactionLog::create([
            'redemption_id' => $redemption->id,
            'action' => 'still.pending',
            'from_status' => 'pending',
            'to_status' => 'pending',
            'context' => [],
        ]);

        $response = $this->getJson('/api/redemptions/' . $redemption->id)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'customer_id',
                    'payment_reference',
                    'points_deducted',
                    'amount',
                    'service_type',
                    'status',
                    'requery_attempts',
                    'last_requery_at',
                    'bap_response',
                    'created_at',
                    'customer' => [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'points_balance',
                        'status',
                        'created_at',
                    ],
                    'logs' => [
                        '*' => [
                            'id',
                            'redemption_id',
                            'action',
                            'from_status',
                            'to_status',
                            'context',
                            'created_at',
                        ]
                    ]
                ]
            ]);

        $this->assertEquals('Jane Smith', $response->json('data.customer.name'));
        $this->assertCount(2, $response->json('data.logs'));
    }

    public function test_list_endpoint_eager_loads_customer_to_prevent_n_plus_one(): void
    {
        $this->actingAsAdmin();
        $customer = Customer::factory()->create();
        Redemption::factory()->count(5)->for($customer)->create();

        DB::enableQueryLog();
        $this->getJson('/api/redemptions')->assertOk();
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $customerQueries = array_filter($queries, function ($query) {
            return str_contains($query['query'], 'select * from "customers"');
        });

        $this->assertLessThanOrEqual(1, count($customerQueries));
    }

    public function test_access_control(): void
    {
        $redemption = Redemption::factory()->create();

        $this->getJson('/api/redemptions')->assertUnauthorized();
        $this->getJson('/api/redemptions/' . $redemption->id)->assertUnauthorized();

        $this->actingAsUser();
        $this->getJson('/api/redemptions')->assertStatus(403);
        $this->getJson('/api/redemptions/' . $redemption->id)->assertStatus(403);
    }
}
