<?php

namespace App\Http\Requests;

use App\Enums\RedemptionStatus;
use App\Enums\ServiceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportFilterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from'         => ['sometimes', 'date'],
            'to'           => ['sometimes', 'date', 'after_or_equal:from'],
            'customer_id'  => ['sometimes', 'integer', 'exists:customers,id'],
            'status'       => ['sometimes', Rule::enum(RedemptionStatus::class)],
            'service_type' => ['sometimes', Rule::enum(ServiceType::class)],
        ];
    }
}
