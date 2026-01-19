<?php
/**
 * Health Check Endpoint for PHP API
 * 
 * Returns 200 OK if service is healthy
 * Returns 503 Service Unavailable if unhealthy
 */

header('Content-Type: application/json');

$health = [
    'status' => 'healthy',
    'service' => 'lira-php-api',
    'timestamp' => date('c'),
    'version' => '1.0.0'
];

// Check database connection
try {
    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbPort = getenv('DB_PORT') ?: '5432';
    $dbName = getenv('DB_NAME') ?: 'lira';
    $dbUser = getenv('DB_USER') ?: 'postgres';
    $dbPass = getenv('DB_PASSWORD') ?: '';
    
    $dsn = "pgsql:host=$dbHost;port=$dbPort;dbname=$dbName";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_TIMEOUT => 2,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $health['database'] = 'connected';
} catch (PDOException $e) {
    $health['status'] = 'unhealthy';
    $health['database'] = 'disconnected';
    http_response_code(503);
}

echo json_encode($health, JSON_PRETTY_PRINT);
