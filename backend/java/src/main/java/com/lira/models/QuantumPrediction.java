package com.lira.models;

import lombok.Data;

@Data
public class QuantumPrediction {
    private String result;
    private Double confidence;
    private Integer qubits;
    private Integer executionTimeMs;
}
