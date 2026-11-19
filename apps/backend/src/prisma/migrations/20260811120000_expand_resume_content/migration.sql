-- Additive resume fields keep existing dashboard drafts valid while supporting
-- semantic summaries, grouped skills, and projects.
ALTER TABLE "DashboardDraft"
ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "skillGroups" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN "projects" JSONB NOT NULL DEFAULT '[]'::jsonb;
