<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Customer::factory()->count(10)->create();

        Customer::factory()->create([
            'name' => 'Tunde Adebayo',
            'email' => 'tundeadebayo@gmail.com',
            'points_balance' => 10000
        ]);
    }
}
