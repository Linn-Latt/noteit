-- CreateIndex
CREATE INDEX "Notebook_userId_parentId_isDeleted_idx" ON "Notebook"("userId", "parentId", "isDeleted");

-- CreateIndex
CREATE INDEX "Notebook_userId_isDeleted_idx" ON "Notebook"("userId", "isDeleted");
