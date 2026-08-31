PRAGMA foreign_keys=OFF;

-- CreateTable
CREATE TABLE "UserStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'NORMAL',
    "score" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserStat_userId_difficulty_key" ON "UserStat"("userId", "difficulty");

INSERT INTO "UserStat" ("id", "userId", "difficulty", "score", "wins", "losses", "draws", "winStreak")
SELECT lower(hex(randomblob(16))), "id", 'NORMAL', "score", "wins", "losses", "draws", "winStreak"
FROM "User";

-- Recreate User without score fields
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name", "email", "emailVerified", "role", "createdAt", "updatedAt")
SELECT "id", "name", "email", "emailVerified", "role", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Recreate Game with difficulty
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'NORMAL',
    "result" TEXT NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "bonusScore" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("id", "userId", "difficulty", "result", "scoreChange", "bonusScore", "winStreak", "createdAt")
SELECT "id", "userId", 'NORMAL', "result", "scoreChange", "bonusScore", "winStreak", "createdAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";

-- Recreate ActiveGame with difficulty
CREATE TABLE "new_ActiveGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLAYING',
    "difficulty" TEXT NOT NULL DEFAULT 'NORMAL',
    "playerSymbol" TEXT NOT NULL DEFAULT 'X',
    "botSymbol" TEXT NOT NULL DEFAULT 'O',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActiveGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActiveGame" ("id", "userId", "board", "status", "difficulty", "playerSymbol", "botSymbol", "createdAt", "updatedAt")
SELECT "id", "userId", "board", "status", 'NORMAL', "playerSymbol", "botSymbol", "createdAt", "updatedAt" FROM "ActiveGame";
DROP TABLE "ActiveGame";
ALTER TABLE "new_ActiveGame" RENAME TO "ActiveGame";
CREATE UNIQUE INDEX "ActiveGame_userId_key" ON "ActiveGame"("userId");

-- Recreate Account FK
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state")
SELECT "id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Recreate Session FK
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("id", "sessionToken", "userId", "expires")
SELECT "id", "sessionToken", "userId", "expires" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

PRAGMA foreign_keys=ON;
