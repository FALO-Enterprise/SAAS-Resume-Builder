-- The Free plan advertises PDF-only export, so keep its persisted entitlement
-- aligned with the pricing contract. Other export formats remain plan-gated.
UPDATE "Plan"
SET "canExportPDF" = TRUE,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'FREE';
