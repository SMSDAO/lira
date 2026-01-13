package com.lira.controllers;

import com.lira.models.QuantumPrediction;
import com.lira.services.QuantumOracleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/quantum")
@CrossOrigin(origins = "*")
public class QuantumOracleController {

    @Autowired
    private QuantumOracleService quantumService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "Java Quantum Oracle API");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predict(@RequestBody Map<String, Object> request) {
        try {
            String data = (String) request.get("data");
            QuantumPrediction prediction = quantumService.generatePrediction(data);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", prediction);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> status = new HashMap<>();
        status.put("qubits_available", 256);
        status.put("queue_length", 3);
        status.put("uptime", "99.9%");
        status.put("active_jobs", 12);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", status);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/optimize")
    public ResponseEntity<Map<String, Object>> optimize(@RequestBody Map<String, Object> request) {
        try {
            Double initialPrice = ((Number) request.get("initial_price")).doubleValue();
            Double liquidityTarget = ((Number) request.get("liquidity_target")).doubleValue();
            Double volatility = ((Number) request.get("volatility")).doubleValue();
            
            Map<String, Object> optimized = quantumService.optimizeLaunch(
                initialPrice, liquidityTarget, volatility
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", optimized);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
