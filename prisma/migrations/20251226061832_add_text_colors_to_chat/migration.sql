/*
  Warnings:

  - You are about to drop the column `startConversationText` on the `ChatSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "headerBgColor" TEXT NOT NULL DEFAULT '#111827',
    "heroBgColor" TEXT NOT NULL DEFAULT '#EEF2FF',
    "headerTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "heroTextColor" TEXT NOT NULL DEFAULT '#111827',
    "welcomeImg" TEXT NOT NULL DEFAULT 'https://ui-avatars.com/api/?name=Support&background=4F46E5&color=fff',
    "headerTitle" TEXT NOT NULL DEFAULT 'Customer Care',
    "headerSubtitle" TEXT NOT NULL DEFAULT 'Online & Ready',
    "welcomeText" TEXT NOT NULL DEFAULT 'How can we help?',
    "welcomeSubtext" TEXT NOT NULL DEFAULT 'Our team typically responds in under 5 minutes.',
    "replyTimeText" TEXT NOT NULL DEFAULT 'Replies instantly',
    "launcherIcon" TEXT NOT NULL DEFAULT 'bubble',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatSettings" ("createdAt", "headerBgColor", "headerSubtitle", "headerTitle", "heroBgColor", "id", "launcherIcon", "primaryColor", "replyTimeText", "shop", "updatedAt", "welcomeImg", "welcomeSubtext", "welcomeText") SELECT "createdAt", "headerBgColor", "headerSubtitle", "headerTitle", "heroBgColor", "id", "launcherIcon", "primaryColor", "replyTimeText", "shop", "updatedAt", "welcomeImg", "welcomeSubtext", "welcomeText" FROM "ChatSettings";
DROP TABLE "ChatSettings";
ALTER TABLE "new_ChatSettings" RENAME TO "ChatSettings";
CREATE UNIQUE INDEX "ChatSettings_shop_key" ON "ChatSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
