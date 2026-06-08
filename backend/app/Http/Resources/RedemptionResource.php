<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RedemptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'customer_id'       => $this->customer_id,
            'payment_reference' => $this->payment_reference,
            'points_deducted'   => $this->points_deducted,
            'amount'            => $this->amount,
            'service_type'      => $this->service_type->value,
            'status'            => $this->status->value,
            'requery_attempts'  => $this->requery_attempts,
            'last_requery_at'   => $this->last_requery_at,
            'bap_response'      => $this->bap_response,
            'created_at'        => $this->created_at,
            'customer'          => CustomerResource::make($this->whenLoaded('customer')),
            'logs'              => TransactionLogResource::collection($this->whenLoaded('logs')),
        ];
    }
}
