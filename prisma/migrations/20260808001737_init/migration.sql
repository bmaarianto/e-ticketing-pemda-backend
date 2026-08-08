/*
  Warnings:

  - A unique constraint covering the columns `[nama_kategori]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "attachment_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "categories_nama_kategori_key" ON "categories"("nama_kategori");
