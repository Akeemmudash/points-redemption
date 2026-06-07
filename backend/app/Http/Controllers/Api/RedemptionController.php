<?php

namespace App\Http\Controllers\Api;

use App\Enums\ServiceType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRedemptionRequest;
use App\Http\Resources\RedemptionResource;
use App\Models\Customer;
use App\Services\RedemptionService;
use Illuminate\Http\Request;

class RedemptionController extends Controller
{
    public function store(StoreRedemptionRequest $request, RedemptionService $redemptions)
    {
        $data = $request->validated();

        $customer = Customer::findOrFail($data['customer_id']);

        $redemption = $redemptions->redeem(
            $customer,
            $data['points'],
            $data['amount'],
            ServiceType::from($data['service_type']),
        );

        return RedemptionResource::make($redemption)
            ->response()
            ->setStatusCode(201);
    }
}
