/*
  Warnings:

  - You are about to drop the column `createAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `doctor` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `doctor` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `patient` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `patient` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `specialties` table. All the data in the column will be lost.
  - You are about to drop the column `updated` on the `specialties` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `verification` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `verification` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `specialties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "doctor" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "patient" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "session" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "specialties" DROP COLUMN "createAt",
DROP COLUMN "updated",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "verification" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
