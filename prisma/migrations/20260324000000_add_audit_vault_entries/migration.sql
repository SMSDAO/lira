-- CreateTable
CREATE TABLE "audit_vault_entries" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_vault_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_vault_entries_hash_key" ON "audit_vault_entries"("hash");

-- CreateIndex
CREATE INDEX "audit_vault_entries_user_id_idx" ON "audit_vault_entries"("user_id");

-- CreateIndex
CREATE INDEX "audit_vault_entries_action_idx" ON "audit_vault_entries"("action");

-- CreateIndex
CREATE INDEX "audit_vault_entries_recorded_at_idx" ON "audit_vault_entries"("recorded_at");
