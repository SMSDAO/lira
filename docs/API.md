# Lira Protocol API Documentation

## Overview

The Lira Protocol exposes multiple APIs across different services:

- **PHP API** (Port 8000) - CRUD operations for users, tokens, agents
- **Go API** (Port 8080) - Agent execution and model management
- **Java API** (Port 8081) - Quantum oracle integration

All APIs return JSON responses and support CORS for frontend integration.

## Base URLs

```
Development:
- PHP API: http://localhost:8000
- Go API: http://localhost:8080
- Java API: http://localhost:8081

Production:
- PHP API: https://api.lira.ai
- Go API: https://go-api.lira.ai
- Java API: https://java-api.lira.ai
```

## Authentication

Currently, APIs are open for development. Production will implement JWT authentication.

```http
Authorization: Bearer <token>
```

## PHP API Endpoints

### Users

#### Get All Users
```http
GET /api/users
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "address": "0x742d...5e5c",
      "tokens": 12,
      "agents": 5,
      "status": "active"
    }
  ]
}
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "address": "0x742d35a06e5c53e5c"
}
```

### Tokens

#### Get All Tokens
```http
GET /api/tokens
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MyToken",
      "symbol": "MTK",
      "contract": "0x1234...5678",
      "supply": "1000000",
      "creator": "0x742d...5e5c",
      "status": "active"
    }
  ]
}
```

#### Create Token
```http
POST /api/tokens
Content-Type: application/json

{
  "name": "MyToken",
  "symbol": "MTK",
  "supply": "1000000",
  "creator": "0x742d35a06e5c53e5c"
}
```

### Agents (PHP)

#### Get All Agents
```http
GET /api/agents
```

#### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "Market Analyzer",
  "model_type": "GPT-4",
  "owner": "0x742d35a06e5c53e5c"
}
```

## Go API Endpoints

### Agents

#### List Agents
```http
GET /api/agents
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Market Analyzer",
      "model_type": "GPT-4",
      "owner": "0x742d...5e5c",
      "executions": 127,
      "is_active": true
    }
  ]
}
```

#### Get Agent
```http
GET /api/agents/:id
```

#### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "Price Oracle",
  "model_type": "Claude-3"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "new-id",
    "name": "Price Oracle",
    "model_type": "Claude-3",
    "owner": "0x742d...5e5c",
    "execution_count": 0,
    "is_active": true
  }
}
```

#### Execute Agent
```http
POST /api/agents/:id/execute
Content-Type: application/json

{
  "input_data": "Analyze BTC/USD market"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "agent_id": "1",
    "output": "Analyzed: BTC/USD market",
    "confidence": 0.95,
    "timestamp": "2026-01-12T23:50:00Z"
  }
}
```

#### Batch Execute Agents
```http
POST /api/agents/batch-execute
Content-Type: application/json

{
  "agent_ids": ["1", "2", "3"],
  "input_data": "Analyze market sentiment"
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "agent_id": "1",
      "output": "Parallel result for agent 1",
      "confidence": 0.92,
      "timestamp": "2026-01-12T23:50:00Z"
    },
    {
      "agent_id": "2",
      "output": "Parallel result for agent 2",
      "confidence": 0.94,
      "timestamp": "2026-01-12T23:50:00Z"
    }
  ]
}
```

### Models

#### List Models
```http
GET /api/models
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "GPT-4 Turbo",
      "type": "language",
      "version": "1.0",
      "description": "Advanced language model"
    }
  ]
}
```

#### Create Model
```http
POST /api/models
Content-Type: application/json

{
  "name": "Custom Model",
  "type": "language",
  "description": "My custom model"
}
```

### Quantum Oracle (Go)

#### Quantum Prediction
```http
POST /api/quantum/predict
Content-Type: application/json

{
  "data": "market_data_hash"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "result": "quantum_prediction_result",
    "confidence": 0.98,
    "qubits": 256,
    "timestamp": "2026-01-12T23:50:00Z"
  }
}
```

#### Quantum Status
```http
GET /api/quantum/status
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "qubits_available": 256,
    "queue_length": 3,
    "uptime": "99.9%"
  }
}
```

## Java API Endpoints

### Quantum Oracle (Java)

#### Health Check
```http
GET /api/quantum/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Java Quantum Oracle API"
}
```

#### Generate Prediction
```http
POST /api/quantum/predict
Content-Type: application/json

{
  "data": "input_data_for_prediction"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "result": "quantum_prediction_742",
    "confidence": 0.93,
    "qubits": 256,
    "executionTimeMs": 234
  }
}
```

#### Optimize Token Launch
```http
POST /api/quantum/optimize
Content-Type: application/json

{
  "initial_price": 1.0,
  "liquidity_target": 100000,
  "volatility": 0.15
}
```

Response:
```json
{
  "success": true,
  "data": {
    "optimized_price": 1.12,
    "optimized_liquidity": 125000,
    "optimized_volatility": 0.11,
    "confidence": 0.92,
    "quantum_advantage": true
  }
}
```

#### Get Status
```http
GET /api/quantum/status
```

Response:
```json
{
  "success": true,
  "data": {
    "qubits_available": 256,
    "queue_length": 3,
    "uptime": "99.9%",
    "active_jobs": 12
  }
}
```

## Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Production APIs implement rate limiting:
- 100 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## WebSocket Support (Planned)

Real-time updates for:
- Agent execution status
- Token launches
- Timeline feed

```javascript
ws://localhost:8080/ws/agents
```

## Code Examples

### JavaScript/TypeScript

```typescript
// Execute agent
const response = await fetch('http://localhost:8080/api/agents/1/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input_data: 'Analyze market' })
});
const result = await response.json();
```

### Python

```python
import requests

# Create token
response = requests.post('http://localhost:8000/api/tokens', json={
    'name': 'MyToken',
    'symbol': 'MTK',
    'supply': '1000000'
})
print(response.json())
```

### cURL

```bash
# Quantum prediction
curl -X POST http://localhost:8081/api/quantum/predict \
  -H "Content-Type: application/json" \
  -d '{"data": "market_data"}'
```

## Testing

Use the provided Postman collection or test with cURL:

```bash
# Health checks
curl http://localhost:8000/api/health
curl http://localhost:8080/health
curl http://localhost:8081/api/quantum/health
```

## Support

For API support:
- Documentation: https://docs.lira.ai
- GitHub Issues: https://github.com/SMSDAO/lira/issues
- Email: api@lira.ai

---

Last Updated: 2026-01-12
