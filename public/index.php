<?php
declare(strict_types=1);

const TDS_AUTH_URL = 'https://auth.thomasdye.net/auth/app/user/about/me';
const TDS_LOGIN_URL = 'https://auth.thomasdye.net/auth?redirect=https://device.server.thomasdye.net';

function redirectToLogin(): never
{
    header('Cache-Control: no-store');
    header('Location: ' . TDS_LOGIN_URL, true, 302);
    exit;
}

function hasProfileManagerAccess(array $user): bool
{
    $requiredRoles = [
        'net.thomasdye.profilemanager.admin',
        'net.thomasdye.profilemanager.devices.all',
        'net.thomasdye.profilemanager.apps.all',
        'net.thomasdye.profilemanager.profiles.all',
        'net.thomasdye.profilemanager.delete.all',
        'net.thomasdye.profilemanager.create.all',
        'net.thomasdye.profilemanager.events.all',
    ];

    $accessRights = $user['AccessRights'] ?? [];
    return is_array($accessRights) && count(array_intersect($requiredRoles, $accessRights)) > 0;
}

$token = trim((string) ($_COOKIE['TDS_Auth'] ?? ''));
if ($token === '') {
    redirectToLogin();
}

$request = curl_init(TDS_AUTH_URL);
curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);

$responseBody = curl_exec($request);
$responseCode = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
$requestError = curl_error($request);
curl_close($request);

if ($responseBody === false || $requestError !== '') {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Retry-After: 30');
    echo 'The authentication service is temporarily unavailable. Please try again shortly.';
    exit;
}

$user = json_decode($responseBody, true);
if ($responseCode < 200 || $responseCode >= 300 || !is_array($user)) {
    redirectToLogin();
}

if (!hasProfileManagerAccess($user)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'You do not have permission to use TDS MDM.';
    exit;
}

$reactEntry = __DIR__ . '/index.html';
if (!is_file($reactEntry) || !is_readable($reactEntry)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'The TDS MDM frontend has not been built on this server.';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header("Content-Security-Policy: frame-ancestors 'none'");
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
readfile($reactEntry);
