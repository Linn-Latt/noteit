/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,parentId]` on the table `Notebook` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Notebook_userId_name_key";

-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notebook_userId_name_parentId_key" ON "Notebook"("userId", "name", "parentId");

-- AddForeignKey
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Notebook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
