<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RedemptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'customer_id'       => $this->customer_id,
            'payment_reference' => $this->payment_reference,
            'points_deducted'   => $this->points_deducted,
            'amount'            => $this->amount,
            'service_type'      => $this->service_type,
            'status'            => $this->status,
            'created_at'        => $this->created_at,
        ];
    }
}
