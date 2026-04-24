# Core Engine API — Rust multi-stage build
# Produces a minimal runtime image (~10 MB) from the Actix-web HTTP server.

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM rust:1.78-slim AS builder

WORKDIR /app

# Cache dependency downloads before copying source
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release 2>/dev/null; rm -rf src

# Build the real source
COPY src ./src
RUN cargo build --release

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/lira-core-api .

ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -sf http://localhost:4000/health || exit 1

CMD ["./lira-core-api"]
