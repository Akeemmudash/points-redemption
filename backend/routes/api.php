<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// Public
Route::get('/health', fn() => response()->json([
    'status' => 'ok',
    'service' => 'points-redemption-api'
]));


Route::post('/login', [AuthController::class, 'login']);




// Authenticated

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout',  [AuthController::class, 'logout']);

    Route::middleware('role:admin')->group(
        function () {
            Route::get('/admin/ping', fn() => response()->json(['message' => 'hello, admin']));
        }
    );
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
