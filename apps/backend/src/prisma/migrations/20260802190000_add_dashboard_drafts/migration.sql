-- CreateTable
CREATE TABLE "DashboardDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'contact',
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact" JSONB NOT NULL,
    "experience" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "certifications" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardDraft_userId_key" ON "DashboardDraft"("userId");

-- AddForeignKey
ALTER TABLE "DashboardDraft" ADD CONSTRAINT "DashboardDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
