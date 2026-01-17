<?php

namespace Lira\Controllers;

class TokenController {
    public function getAllTokens() {
        // Mock data - in production, fetch from database
        $tokens = [
            [
                'id' => 1,
                'name' => 'MyToken',
                'symbol' => 'MTK',
                'contract' => '0x1234...5678',
                'supply' => '1000000',
                'creator' => '0x742d...5e5c',
                'status' => 'active'
            ],
            [
                'id' => 2,
                'name' => 'CoolToken',
                'symbol' => 'COOL',
                'contract' => '0x8765...4321',
                'supply' => '500000',
                'creator' => '0x8a3f...2b1d',
                'status' => 'active'
            ],
        ];
        
        echo json_encode(['success' => true, 'data' => $tokens]);
    }

    public function getToken($id) {
        $token = [
            'id' => $id,
            'name' => 'MyToken',
            'symbol' => 'MTK',
            'contract' => '0x1234...5678',
            'supply' => '1000000',
            'creator' => '0x742d...5e5c',
            'status' => 'active',
            'launched_at' => '2026-01-10T10:00:00Z'
        ];
        
        echo json_encode(['success' => true, 'data' => $token]);
    }

    public function createToken() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['symbol']) || !isset($input['supply'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name, symbol, and supply required']);
            return;
        }
        
        $token = [
            'id' => rand(1000, 9999),
            'name' => $input['name'],
            'symbol' => $input['symbol'],
            'contract' => '0x' . bin2hex(random_bytes(20)),
            'supply' => $input['supply'],
            'creator' => $input['creator'] ?? '0x0000000000000000000000000000000000000000',
            'status' => 'pending',
            'launched_at' => date('c')
        ];
        
        http_response_code(201);
        echo json_encode(['success' => true, 'data' => $token]);
    }
}
