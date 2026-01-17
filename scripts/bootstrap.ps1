# PowerShell script to bootstrap the Lira Protocol
# Admin pipeline for setting up the entire infrastructure

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Lira Protocol Bootstrap Pipeline  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js found: $(node --version)" -ForegroundColor Green

# Check npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm found: $(npm --version)" -ForegroundColor Green

# Check PHP
if (!(Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ PHP is not installed. Backend PHP services will not work." -ForegroundColor Yellow
} else {
    Write-Host "✓ PHP found: $(php --version | Select-Object -First 1)" -ForegroundColor Green
}

# Check Go
if (!(Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ Go is not installed. Backend Go services will not work." -ForegroundColor Yellow
} else {
    Write-Host "✓ Go found: $(go version)" -ForegroundColor Green
}

# Check Java
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ Java is not installed. Backend Java services will not work." -ForegroundColor Yellow
} else {
    Write-Host "✓ Java found: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
}

# Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ Docker is not installed. Containerized deployment will not work." -ForegroundColor Yellow
} else {
    Write-Host "✓ Docker found: $(docker --version)" -ForegroundColor Green
}

Write-Host ""

# Install Node.js dependencies
Write-Host "[2/10] Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Set up environment variables
Write-Host "[3/10] Setting up environment variables..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "✓ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠ Please configure .env with your settings!" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Set up database
Write-Host "[4/10] Setting up database..." -ForegroundColor Yellow
# Check if PostgreSQL is running
Write-Host "⚠ Ensure PostgreSQL is running and configured" -ForegroundColor Yellow
Write-Host "  Connection string should be in .env: DATABASE_URL" -ForegroundColor Gray
Write-Host ""

# Build frontend
Write-Host "[5/10] Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Compile smart contracts
Write-Host "[6/10] Compiling smart contracts..." -ForegroundColor Yellow
npx hardhat compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to compile contracts!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Contracts compiled" -ForegroundColor Green
Write-Host ""

# Run tests
Write-Host "[7/10] Running tests..." -ForegroundColor Yellow
npx hardhat test
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Some tests failed. Review before deployment." -ForegroundColor Yellow
} else {
    Write-Host "✓ All tests passed" -ForegroundColor Green
}
Write-Host ""

# Build Go services
Write-Host "[8/10] Building Go services..." -ForegroundColor Yellow
if (Get-Command go -ErrorAction SilentlyContinue) {
    Set-Location backend/go
    go build -o ../../bin/lira-go-api ./cmd/api
    Set-Location ../..
    if (Test-Path "bin/lira-go-api*") {
        Write-Host "✓ Go services built" -ForegroundColor Green
    } else {
        Write-Host "⚠ Go build might have failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipping Go build (not installed)" -ForegroundColor Yellow
}
Write-Host ""

# Build Java services
Write-Host "[9/10] Building Java services..." -ForegroundColor Yellow
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Set-Location backend/java
    mvn clean package -DskipTests
    Set-Location ../..
    Write-Host "✓ Java services built" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping Java build (Maven not installed)" -ForegroundColor Yellow
}
Write-Host ""

# Setup complete
Write-Host "[10/10] Bootstrap complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure .env with your API keys and settings" -ForegroundColor White
Write-Host "2. Deploy contracts: .\scripts\contracts.ps1" -ForegroundColor White
Write-Host "3. Start development server: npm run dev" -ForegroundColor White
Write-Host "4. Start PHP backend: npm run php:serve" -ForegroundColor White
Write-Host "5. Start Go API: .\bin\lira-go-api" -ForegroundColor White
Write-Host ""
Write-Host "Admin Dashboard: http://localhost:3000/admin" -ForegroundColor Green
Write-Host "User Dashboard: http://localhost:3000/dashboard" -ForegroundColor Green
Write-Host ""
