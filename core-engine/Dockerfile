# Core Engine — Rust library build
# Builds the library crate and packages the compiled artifacts.

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM rust:1.78-slim AS builder

WORKDIR /app

# Cache dependency downloads before copying source
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo '// temporary lib target for dependency caching' > src/lib.rs \
    && cargo build --release --lib 2>/dev/null; rm -rf src

# Build the real source
COPY src ./src
RUN cargo build --release --lib

# Final image contains the built library artifacts under /app/target/release
FROM builder
