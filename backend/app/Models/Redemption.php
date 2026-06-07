<?php

namespace App\Models;

use App\Enums\ServiceType;
use App\Enums\RedemptionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Redemption extends Model
{
    /** @use HasFactory<\Database\Factories\RedemptionFactory> */
    use HasFactory;
    protected $fillable = [
        'customer_id',
        'idempotency_key',
        'payment_reference',
        'points_deducted',
        'amount',
        'service_type',
        'status',
        'bap_response',
        'requery_attempts',
        'last_requery_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => RedemptionStatus::class,
            'service_type' => ServiceType::class,
            'bap_response' => 'array',
            'last_requery_at' => 'datetime',
            'points_deducted' => 'integer',
            'amount' => 'integer',
            'requery_attempts' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(TransactionLog::class);
    }
}
