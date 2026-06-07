<?php

namespace App\Models;

use App\Enums\CustomerStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    /** @use HasFactory<\Database\Factories\CustomerFactory> */
    use HasFactory;
    protected $fillable = ['name', 'email', 'phone', 'points_balance', 'status'];

    protected $attributes = [
        'status' => 'active',
    ];

    protected function casts(): array
    {
        return [
            'status' => CustomerStatus::class,
            'points_balance' => 'integer'
        ];
    }

    public function redemptions(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
