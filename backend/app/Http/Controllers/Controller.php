<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'Points Redemption API',
    version: '1.0.0',
    description: 'Admin API for managing customers, processing point redemptions, and reconciling transactions.'
)]
#[OA\Server(url: 'http://localhost:8000', description: 'Local')]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer'
)]
abstract class Controller
{
}
