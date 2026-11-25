package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.MlBatchRankRequestDto;
import com.pathfinder.backend.dto.MlMatchRequestDto;
import com.pathfinder.backend.dto.MlMatchResponseDto;
import com.pathfinder.backend.service.MlMatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ml")
public class MlMatchingController {

    private static final Logger log = LoggerFactory.getLogger(MlMatchingController.class);
    private final MlMatchingService mlMatchingService;

    public MlMatchingController(MlMatchingService mlMatchingService) {
        this.mlMatchingService = mlMatchingService;
    }

    @PostMapping("/predict-match")
    public ResponseEntity<MlMatchResponseDto> predictMatch(@RequestBody(required = false) MlMatchRequestDto request) {
        try {
            MlMatchResponseDto response = mlMatchingService.predictMatch(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in /api/ml/predict-match: {}", e.getMessage(), e);
            return ResponseEntity.ok(mlMatchingService.deterministicFallback(request != null ? request : new MlMatchRequestDto()));
        }
    }

    @PostMapping("/rank-batch")
    public ResponseEntity<List<MlMatchResponseDto>> rankBatch(@RequestBody(required = false) MlBatchRankRequestDto request) {
        try {
            List<MlMatchResponseDto> ranked = mlMatchingService.rankBatch(request);
            return ResponseEntity.ok(ranked);
        } catch (Exception e) {
            log.error("Error in /api/ml/rank-batch: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }
}
