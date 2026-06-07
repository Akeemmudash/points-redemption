<?php

namespace App\Services;

use Illuminate\Support\Arr;

class BapService
{
    public function charge(string $paymentReference, int $amount): array
    {
        return Arr::random([
            ['response_code' => '00',    'status' => 'successful', 'status_code' => 0,    'status_message' => 'Transaction successful'],
            ['response_code' => '99',    'status' => 'failed',     'status_code' => 2,    'status_message' => 'Transaction failed'],
            ['response_code' => '90009', 'status' => 'paid',       'status_code' => 1,    'status_message' => 'Transaction in progress'],
            ['response_code' => null,    'status' => null,         'status_code' => null, 'status_message' => 'No response from BAP service']
        ]);
    }
}
