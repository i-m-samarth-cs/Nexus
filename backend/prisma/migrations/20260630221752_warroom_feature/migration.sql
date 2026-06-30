-- AlterTable
ALTER TABLE "users" ADD COLUMN     "color" TEXT DEFAULT '#00f5ff',
ADD COLUMN     "name" TEXT DEFAULT 'Operative',
ADD COLUMN     "warRoomId" TEXT;

-- CreateTable
CREATE TABLE "war_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "war_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "war_rooms_passcode_key" ON "war_rooms"("passcode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_warRoomId_fkey" FOREIGN KEY ("warRoomId") REFERENCES "war_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
