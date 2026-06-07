<?php

namespace App\Enums;

enum RedemptionStatus: string
{
    case Pending = "pending";
    case Successful = 'successful';
    case Failed = 'failed';
}
