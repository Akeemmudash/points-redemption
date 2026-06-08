<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ReconciliationController;
use App\Http\Controllers\Api\RedemptionController;
use App\Models\Redemption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// Public
Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'service' => 'points-redemption-api'
]));


Route::post('/login', [AuthController::class, 'login']);




// Authenticated

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    //IsAdmin
    Route::middleware('role:admin')->group(
        function () {
            Route::get('/admin/ping', fn () => response()->json(['message' => 'hello, admin']));

            Route::apiResource('customers', CustomerController::class)->except(['destroy']);

            Route::patch('/customers/{customer}/deactivate', [CustomerController::class, 'deactivate'])->name('customers.deactivate');

            Route::post('/redemptions', [RedemptionController::class, 'store']);
            Route::post('/reconciliation/run', [ReconciliationController::class, 'run']);
        }
    );
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
