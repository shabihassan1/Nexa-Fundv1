# ===================================================================
# Quick Test Script for ML Service
# ===================================================================
# Tests if the ML Recommendation Service is running and responding
# Run from: RS(Nexa Fund)/RecomendationSystem(NF)/
# ===================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Testing ML Recommendation Service" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"
$allPassed = $true

# Test 1: Service Status
Write-Host "Test 1: Service Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/status" -Method Get -TimeoutSec 5
    Write-Host "SUCCESS: PASSED - Service is running" -ForegroundColor Green
    Write-Host "   Donors: $($response.donor_count)" -ForegroundColor Cyan
    Write-Host "   Campaigns: $($response.campaign_count)" -ForegroundColor Cyan
} catch {
    Write-Host "FAILED: Service not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 2: List Donors
Write-Host "Test 2: List Donors..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/donors" -Method Get -TimeoutSec 5
    $donorCount = $response.donors.Count
    Write-Host "SUCCESS: PASSED - Retrieved $donorCount donors" -ForegroundColor Green
    if ($donorCount -gt 0) {
        Write-Host "   Sample donor: $($response.donors[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: Could not retrieve donors" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 3: List Campaigns
Write-Host "Test 3: List Campaigns..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/campaigns" -Method Get -TimeoutSec 5
    $campaignCount = $response.campaigns.Count
    Write-Host "SUCCESS: PASSED - Retrieved $campaignCount campaigns" -ForegroundColor Green
    if ($campaignCount -gt 0) {
        Write-Host "   Sample campaign: $($response.campaigns[0].title)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: Could not retrieve campaigns" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 4: Get Recommendations (if we have donors)
Write-Host "Test 4: Get Recommendations..." -ForegroundColor Yellow
try {
    # Get first donor ID
    $donorsResponse = Invoke-RestMethod -Uri "$baseUrl/donors" -Method Get -TimeoutSec 5
    if ($donorsResponse.donors.Count -gt 0) {
        $donorId = $donorsResponse.donors[0].id
        
        $body = @{
            donor_id = $donorId
            top_k = 5
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/recommendations" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
        $recoCount = $response.recommendations.Count
        Write-Host "SUCCESS: PASSED - Got $recoCount recommendations for donor: $donorId" -ForegroundColor Green
        if ($recoCount -gt 0) {
            Write-Host "   Top recommendation: $($response.recommendations[0].title) (score: $($response.recommendations[0].predicted_score))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "WARNING: SKIPPED - No donors available to test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED: Could not get recommendations" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  SUCCESS: ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  ML Recommendation Service is working correctly" -ForegroundColor Green
} else {
    Write-Host "  ERROR: SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Check if:" -ForegroundColor Yellow
    Write-Host "  1. ML service is running (.\start-ml-service.ps1)" -ForegroundColor Yellow
    Write-Host "  2. Backend is running (cd backend; npm run dev)" -ForegroundColor Yellow
    Write-Host "  3. Database has campaigns and users" -ForegroundColor Yellow
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For interactive testing, visit: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
