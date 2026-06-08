<?php

namespace Tests\Support;

use App\Services\BapService;

class FakeBapService extends BapService
{
    public array $chargeResponse  = ['response_code' => '00', 'status' => 'successful', 'status_code' => 0, 'status_message' => 'ok'];
    public array $requeryResponse = ['response_code' => '00', 'status' => 'successful', 'status_code' => 0, 'status_message' => 'ok'];

    public function charge(string $reference, int $amount): array { return $this->chargeResponse; }
    public function requery(string $reference): array            { return $this->requeryResponse; }
}
