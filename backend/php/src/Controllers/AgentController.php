<?php

namespace Lira\Controllers;

class AgentController {
    public function getAllAgents() {
        $agents = [
            [
                'id' => 1,
                'name' => 'Market Analyzer',
                'model_type' => 'GPT-4',
                'owner' => '0x742d...5e5c',
                'executions' => 1247,
                'status' => 'active',
                'created_at' => '2026-01-10T10:00:00Z'
            ],
            [
                'id' => 2,
                'name' => 'Price Oracle',
                'model_type' => 'Claude-3',
                'owner' => '0x8a3f...2b1d',
                'executions' => 892,
                'status' => 'active',
                'created_at' => '2026-01-08T15:30:00Z'
            ],
        ];
        
        echo json_encode(['success' => true, 'data' => $agents]);
    }

    public function getAgent($id) {
        $agent = [
            'id' => $id,
            'name' => 'Market Analyzer',
            'model_type' => 'GPT-4',
            'owner' => '0x742d...5e5c',
            'executions' => 1247,
            'status' => 'active',
            'created_at' => '2026-01-10T10:00:00Z',
            'config' => [
                'temperature' => 0.7,
                'max_tokens' => 2000
            ]
        ];
        
        echo json_encode(['success' => true, 'data' => $agent]);
    }

    public function createAgent() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['model_type'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name and model_type required']);
            return;
        }
        
        $agent = [
            'id' => rand(1000, 9999),
            'name' => $input['name'],
            'model_type' => $input['model_type'],
            'owner' => $input['owner'] ?? '0x0000000000000000000000000000000000000000',
            'executions' => 0,
            'status' => 'active',
            'created_at' => date('c')
        ];
        
        http_response_code(201);
        echo json_encode(['success' => true, 'data' => $agent]);
    }
}
