<?php

namespace App\Http\Controllers\Api;

use App\Enums\ServiceType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRedemptionRequest;
use App\Http\Requests\RedemptionIndexRequest;
use App\Http\Resources\RedemptionResource;
use App\Models\Customer;
use App\Models\Redemption;
use App\Services\RedemptionService;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class RedemptionController extends Controller
{
    #[OA\Get(
        path: '/api/redemptions',
        summary: 'List redemptions',
        tags: ['Redemptions'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'successful', 'failed'])),
            new OA\Parameter(name: 'service_type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['airtime', 'data', 'electricity', 'cable_tv'])),
            new OA\Parameter(name: 'customer_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'from', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-01'),
            new OA\Parameter(name: 'to', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date'), example: '2026-06-30'),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 15)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of redemptions'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(RedemptionIndexRequest $request)
    {
        $filters = $request->validated();

        $redemptions = Redemption::query()
            ->with('customer')
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['service_type'] ?? null, fn($q, $type) => $q->where('service_type', $type))
            ->when($filters['customer_id'] ?? null, fn($q, $id) => $q->where('customer_id', $id))
            ->when($filters['from'] ?? null, fn($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->when($filters['search'] ?? null, fn($q, $s) => $q->where(fn($q) =>
                $q->where('payment_reference', 'ILIKE', "%{$s}%")
                    ->orWhereHas('customer', fn($q) =>
                        $q->where('name', 'ILIKE', "%{$s}%")
                            ->orWhere('email', 'ILIKE', "%{$s}%")
                    )
            ))
            ->latest()
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return RedemptionResource::collection($redemptions);
    }

    #[OA\Get(
        path: '/api/redemptions/{id}',
        summary: 'Show a redemption',
        tags: ['Redemptions'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), example: 1),
        ],
        responses: [
            new OA\Response(response: 200, description: 'OK'),
            new OA\Response(response: 404, description: 'Not found'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(Redemption $redemption)
    {
        $redemption->load(['customer', 'logs']);
        return RedemptionResource::make($redemption);
    }

    #[OA\Post(
        path: '/api/redemptions',
        summary: 'Create a redemption',
        tags: ['Redemptions'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['customer_id', 'points', 'amount', 'service_type', 'idempotency_key'],
                properties: [
                    new OA\Property(property: 'customer_id', type: 'integer', example: 11),
                    new OA\Property(property: 'points', type: 'integer', example: 300),
                    new OA\Property(property: 'amount', type: 'integer', description: 'Value in kobo (minor units)', example: 30000),
                    new OA\Property(property: 'service_type', type: 'string', enum: ['airtime', 'data', 'electricity', 'cable_tv'], example: 'airtime'),
                    new OA\Property(property: 'idempotency_key', type: 'string', description: 'Unique key so a retried request is not processed twice', example: 'a1b2c3'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Redemption created'),
            new OA\Response(response: 422, description: 'Validation error or insufficient points'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function store(StoreRedemptionRequest $request, RedemptionService $redemptions)
    {
        $data = $request->validated();

        $customer = Customer::findOrFail($data['customer_id']);

        $redemption = $redemptions->redeem(
            $customer,
            $data['points'],
            $data['amount'],
            ServiceType::from($data['service_type']),
            $data['idempotency_key'],
        );

        return RedemptionResource::make($redemption)
            ->response()
            ->setStatusCode(201);
    }
}

