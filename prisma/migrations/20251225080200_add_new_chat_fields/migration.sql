-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "headerBgColor" TEXT NOT NULL DEFAULT '#384959',
    "heroBgColor" TEXT NOT NULL DEFAULT '#bdddfc',
    "welcomeImg" TEXT NOT NULL DEFAULT 'https://ui-avatars.com/api/?name=Support',
    "headerTitle" TEXT NOT NULL DEFAULT 'Live Support',
    "headerSubtitle" TEXT NOT NULL DEFAULT 'Online now',
    "welcomeText" TEXT NOT NULL DEFAULT 'Hi there 👋',
    "welcomeSubtext" TEXT NOT NULL DEFAULT 'We are here to help you!',
    "replyTimeText" TEXT NOT NULL DEFAULT 'Typically replies in 5 minutes',
    "startConversationText" TEXT NOT NULL DEFAULT 'Start a conversation',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatSettings" ("createdAt", "headerBgColor", "headerSubtitle", "headerTitle", "id", "primaryColor", "shop", "startConversationText", "updatedAt", "welcomeImg", "welcomeSubtext", "welcomeText") SELECT "createdAt", "headerBgColor", "headerSubtitle", "headerTitle", "id", "primaryColor", "shop", "startConversationText", "updatedAt", "welcomeImg", "welcomeSubtext", "welcomeText" FROM "ChatSettings";
DROP TABLE "ChatSettings";
ALTER TABLE "new_ChatSettings" RENAME TO "ChatSettings";
CREATE UNIQUE INDEX "ChatSettings_shop_key" ON "ChatSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
