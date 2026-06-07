<?php

namespace App\Enums;

enum ServiceType: string
{
    case Airtime = "airtime";
    case Data = "data";
    case Electricity = "electricity";
    case CableTv = "cable_tv";
}
