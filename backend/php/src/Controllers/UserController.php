<?php

namespace Lira\Controllers;

class UserController {
    public function getAllUsers() {
        // Mock data - in production, fetch from database
        $users = [
            ['id' => 1, 'address' => '0x742d...5e5c', 'tokens' => 12, 'agents' => 5, 'status' => 'active'],
            ['id' => 2, 'address' => '0x8a3f...2b1d', 'tokens' => 8, 'agents' => 3, 'status' => 'active'],
            ['id' => 3, 'address' => '0x9c2e...4f7a', 'tokens' => 15, 'agents' => 7, 'status' => 'active'],
        ];
        
        echo json_encode(['success' => true, 'data' => $users]);
    }

    public function getUser($id) {
        // Mock data
        $user = [
            'id' => $id,
            'address' => '0x742d...5e5c',
            'tokens' => 12,
            'agents' => 5,
            'status' => 'active',
            'created_at' => '2026-01-01T00:00:00Z'
        ];
        
        echo json_encode(['success' => true, 'data' => $user]);
    }

    public function createUser() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate input
        if (!isset($input['address'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Address required']);
            return;
        }
        
        // Mock response
        $user = [
            'id' => rand(1000, 9999),
            'address' => $input['address'],
            'tokens' => 0,
            'agents' => 0,
            'status' => 'active',
            'created_at' => date('c')
        ];
        
        http_response_code(201);
        echo json_encode(['success' => true, 'data' => $user]);
    }

    public function updateUser($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Mock response
        echo json_encode(['success' => true, 'message' => 'User updated']);
    }

    public function deleteUser($id) {
        // Mock response
        echo json_encode(['success' => true, 'message' => 'User deleted']);
    }
}
