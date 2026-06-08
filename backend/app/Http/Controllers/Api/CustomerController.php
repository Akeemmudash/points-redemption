<?php

namespace App\Http\Controllers\Api;

use App\Enums\CustomerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Customer',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 11),
        new OA\Property(property: 'name', type: 'string', example: 'Ada Lovelace'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'phone', type: 'string'),
        new OA\Property(property: 'points_balance', type: 'integer', example: 10000),
        new OA\Property(property: 'status', type: 'string', enum: ['active', 'inactive']),
    ]
)]
class CustomerController extends Controller
{
    #[OA\Get(
        path: '/api/customers',
        summary: 'List customers',
        tags: ['Customers'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['active', 'inactive'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of customers'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('perPage', 15), 100));

        $customers = Customer::query()
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->search;
                $q->where(function ($q) use ($term) {
                    $q->where('name', 'ilike', "%{$term}%")
                        ->orWhere('email', 'ilike', "%{$term}%");
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return CustomerResource::collection($customers);
    }

    #[OA\Post(
        path: '/api/customers',
        summary: 'Create a customer',
        tags: ['Customers'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'phone'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Ada Lovelace'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'ada@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '+2348012345678'),
                    new OA\Property(property: 'points_balance', type: 'integer', example: 1000),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Customer created', content: new OA\JsonContent(ref: '#/components/schemas/Customer')),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function store(StoreCustomerRequest $request)
    {
        $customer = Customer::create($request->validated());
        return CustomerResource::make($customer)->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/customers/{id}',
        summary: 'Show a customer',
        tags: ['Customers'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), example: 11),
        ],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Customer')),
            new OA\Response(response: 404, description: 'Not found'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(Customer $customer)
    {
        return CustomerResource::make($customer);
    }

    #[OA\Put(
        path: '/api/customers/{id}',
        summary: 'Update a customer',
        tags: ['Customers'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), example: 11),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Ada Lovelace'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'ada@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '+2348012345678'),
                    new OA\Property(property: 'points_balance', type: 'integer', example: 1000),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Customer updated', content: new OA\JsonContent(ref: '#/components/schemas/Customer')),
            new OA\Response(response: 404, description: 'Not found'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $customer->update($request->validated());
        return CustomerResource::make($customer);
    }

    #[OA\Patch(
        path: '/api/customers/{id}/deactivate',
        summary: 'Deactivate a customer',
        tags: ['Customers'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), example: 11),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Customer deactivated', content: new OA\JsonContent(ref: '#/components/schemas/Customer')),
            new OA\Response(response: 404, description: 'Not found'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function deactivate(Customer $customer)
    {
        $customer->update(['status' => CustomerStatus::Inactive]);
        return CustomerResource::make($customer);
    }
}

