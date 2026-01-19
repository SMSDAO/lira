# PowerShell script for deploying and managing smart contracts
# Admin contract management pipeline

param(
    [Parameter(Mandatory=$false)]
    [string]$Network = "localhost",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "verify", "upgrade", "status", "test")]
    [string]$Action = "deploy"
)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Lira Contract Management Pipeline " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Network: $Network" -ForegroundColor Yellow
Write-Host "Action: $Action" -ForegroundColor Yellow
Write-Host ""

function Deploy-Contracts {
    param([string]$NetworkName)
    
    Write-Host "[1/4] Compiling contracts..." -ForegroundColor Yellow
    npx hardhat compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Compilation failed!" -ForegroundColor Red
        return $false
    }
    Write-Host "✓ Compilation successful" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[2/4] Running contract tests..." -ForegroundColor Yellow
    npx hardhat test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Some tests failed!" -ForegroundColor Yellow
        $continue = Read-Host "Continue with deployment? (y/n)"
        if ($continue -ne "y") {
            return $false
        }
    } else {
        Write-Host "✓ All tests passed" -ForegroundColor Green
    }
    Write-Host ""
    
    Write-Host "[3/4] Deploying to $NetworkName..." -ForegroundColor Yellow
    npx hardhat run scripts/deploy/deploy.js --network $NetworkName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        return $false
    }
    Write-Host "✓ Deployment successful" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[4/4] Saving deployment artifacts..." -ForegroundColor Yellow
    if (Test-Path "deployments/$NetworkName-addresses.json") {
        $addresses = Get-Content "deployments/$NetworkName-addresses.json" | ConvertFrom-Json
        Write-Host "✓ Deployment addresses:" -ForegroundColor Green
        Write-Host "  LiraToken: $($addresses.liraToken)" -ForegroundColor Cyan
        Write-Host "  TokenLaunchFactory: $($addresses.tokenLaunchFactory)" -ForegroundColor Cyan
        Write-Host "  AgentExecutor: $($addresses.agentExecutor)" -ForegroundColor Cyan
    }
    Write-Host ""
    
    return $true
}

function Verify-Contracts {
    param([string]$NetworkName)
    
    Write-Host "Verifying contracts on $NetworkName..." -ForegroundColor Yellow
    
    if (!(Test-Path "deployments/$NetworkName-addresses.json")) {
        Write-Host "❌ No deployment found for $NetworkName" -ForegroundColor Red
        return $false
    }
    
    $addresses = Get-Content "deployments/$NetworkName-addresses.json" | ConvertFrom-Json
    
    Write-Host "Verifying LiraToken..." -ForegroundColor Yellow
    npx hardhat verify --network $NetworkName $addresses.liraToken $addresses.deployer $addresses.deployer
    
    Write-Host "Verifying TokenLaunchFactory..." -ForegroundColor Yellow
    npx hardhat verify --network $NetworkName $addresses.tokenLaunchFactory $addresses.liraToken $addresses.deployer
    
    Write-Host "Verifying AgentExecutor..." -ForegroundColor Yellow
    npx hardhat verify --network $NetworkName $addresses.agentExecutor $addresses.deployer
    
    Write-Host "✓ Verification complete" -ForegroundColor Green
    return $true
}

function Test-Contracts {
    Write-Host "Running comprehensive contract tests..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "[1/3] Unit tests..." -ForegroundColor Yellow
    npx hardhat test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed!" -ForegroundColor Red
        return $false
    }
    Write-Host "✓ Unit tests passed" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[2/3] Coverage analysis..." -ForegroundColor Yellow
    npx hardhat coverage
    Write-Host ""
    
    Write-Host "[3/3] Gas reporting..." -ForegroundColor Yellow
    $env:REPORT_GAS = "true"
    npx hardhat test
    $env:REPORT_GAS = ""
    Write-Host ""
    
    Write-Host "✓ All tests complete" -ForegroundColor Green
    return $true
}

function Get-ContractStatus {
    param([string]$NetworkName)
    
    Write-Host "Contract Status for $NetworkName" -ForegroundColor Yellow
    Write-Host ""
    
    if (!(Test-Path "deployments/$NetworkName-addresses.json")) {
        Write-Host "❌ No deployment found for $NetworkName" -ForegroundColor Red
        return $false
    }
    
    $addresses = Get-Content "deployments/$NetworkName-addresses.json" | ConvertFrom-Json
    
    Write-Host "Deployment Information:" -ForegroundColor Cyan
    Write-Host "  Network: $($addresses.network)" -ForegroundColor White
    Write-Host "  Deployer: $($addresses.deployer)" -ForegroundColor White
    Write-Host "  Timestamp: $($addresses.timestamp)" -ForegroundColor White
    Write-Host ""
    Write-Host "Contract Addresses:" -ForegroundColor Cyan
    Write-Host "  LiraToken: $($addresses.liraToken)" -ForegroundColor White
    Write-Host "  TokenLaunchFactory: $($addresses.tokenLaunchFactory)" -ForegroundColor White
    Write-Host "  AgentExecutor: $($addresses.agentExecutor)" -ForegroundColor White
    Write-Host ""
    
    return $true
}

# Execute action
$success = $false
switch ($Action) {
    "deploy" {
        $success = Deploy-Contracts -NetworkName $Network
    }
    "verify" {
        $success = Verify-Contracts -NetworkName $Network
    }
    "test" {
        $success = Test-Contracts
    }
    "status" {
        $success = Get-ContractStatus -NetworkName $Network
    }
}

Write-Host ""
if ($success) {
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "  Action completed successfully!    " -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
} else {
    Write-Host "====================================" -ForegroundColor Red
    Write-Host "  Action failed!                    " -ForegroundColor Red
    Write-Host "====================================" -ForegroundColor Red
    exit 1
}
Write-Host ""
