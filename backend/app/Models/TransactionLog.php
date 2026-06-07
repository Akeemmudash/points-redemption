<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionLog extends Model
{

    protected $fillable = ['redemption_id', 'action', 'from_status', 'to_status', 'context'];

    protected function casts(): array
    {
        return ['context' => 'array'];
    }

    public function redemption(): BelongsTo
    {
        return $this->belongsTo(Redemption::class);
    }
}
