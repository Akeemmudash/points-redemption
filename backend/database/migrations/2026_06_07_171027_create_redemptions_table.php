<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('idempotency_key')->nullable()->unique();
            $table->string('payment_reference')->unique();
            $table->unsignedBigInteger('points_deducted');
            $table->unsignedBigInteger('amount');
            $table->string('service_type');
            $table->string('status')->default('pending');
            $table->json('bap_response')->nullable();
            $table->unsignedInteger('requery_attempts')->default(0);
            $table->timestamp('last_requery_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('redemptions');
    }
};
