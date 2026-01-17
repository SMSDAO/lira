<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple router
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse request
$uri = parse_url($requestUri, PHP_URL_PATH);
$uri = trim($uri, '/');
$parts = explode('/', $uri);

// API endpoints
if ($parts[0] === 'api') {
    $resource = $parts[1] ?? '';
    $id = $parts[2] ?? null;

    switch ($resource) {
        case 'health':
            echo json_encode(['status' => 'healthy', 'service' => 'PHP API']);
            break;

        case 'users':
            require_once __DIR__ . '/../src/Controllers/UserController.php';
            $controller = new \Lira\Controllers\UserController();
            
            if ($requestMethod === 'GET' && $id) {
                $controller->getUser($id);
            } elseif ($requestMethod === 'GET') {
                $controller->getAllUsers();
            } elseif ($requestMethod === 'POST') {
                $controller->createUser();
            } elseif ($requestMethod === 'PUT' && $id) {
                $controller->updateUser($id);
            } elseif ($requestMethod === 'DELETE' && $id) {
                $controller->deleteUser($id);
            }
            break;

        case 'tokens':
            require_once __DIR__ . '/../src/Controllers/TokenController.php';
            $controller = new \Lira\Controllers\TokenController();
            
            if ($requestMethod === 'GET' && $id) {
                $controller->getToken($id);
            } elseif ($requestMethod === 'GET') {
                $controller->getAllTokens();
            } elseif ($requestMethod === 'POST') {
                $controller->createToken();
            }
            break;

        case 'agents':
            require_once __DIR__ . '/../src/Controllers/AgentController.php';
            $controller = new \Lira\Controllers\AgentController();
            
            if ($requestMethod === 'GET' && $id) {
                $controller->getAgent($id);
            } elseif ($requestMethod === 'GET') {
                $controller->getAllAgents();
            } elseif ($requestMethod === 'POST') {
                $controller->createAgent();
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Invalid request']);
}
