<?php

namespace App\Http\Requests;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RedemptionIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', Rule::enum(RedemptionStatus::class)],
            'service_type' => ['nullable', 'string', Rule::enum(ServiceType::class)],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'search' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
