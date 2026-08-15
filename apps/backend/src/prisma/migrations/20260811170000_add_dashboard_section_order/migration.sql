-- Persist the user's preferred resume section order on the dashboard draft.
-- Existing drafts receive the current default order.
ALTER TABLE "DashboardDraft"
ADD COLUMN "sectionOrder" TEXT[] NOT NULL DEFAULT ARRAY[
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications'
]::TEXT[];
