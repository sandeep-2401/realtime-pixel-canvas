/*
  Warnings:

  - The primary key for the `Pixel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `roomId` to the `Pixel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pixel" DROP CONSTRAINT "Pixel_pkey",
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD CONSTRAINT "Pixel_pkey" PRIMARY KEY ("roomId", "x", "y");
