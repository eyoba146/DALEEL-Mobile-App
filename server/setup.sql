DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserType') THEN
    CREATE TYPE "UserType" AS ENUM ('diaspora', 'foreign_resident');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Language') THEN
    CREATE TYPE "Language" AS ENUM ('en', 'am');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FavoriteType') THEN
    CREATE TYPE "FavoriteType" AS ENUM ('destination', 'service', 'event');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, "passwordHash" TEXT NOT NULL, "userType" "UserType" NOT NULL, country TEXT NOT NULL, language "Language" NOT NULL DEFAULT 'en', "isAdmin" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "Destination" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, name TEXT NOT NULL, region TEXT NOT NULL, blurb TEXT NOT NULL, image TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "Service" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, name TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL, verified BOOLEAN NOT NULL DEFAULT false, blurb TEXT NOT NULL, image TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "EventItem" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, title TEXT NOT NULL, date TIMESTAMP NOT NULL, city TEXT NOT NULL, category TEXT NOT NULL, image TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "Favorite" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "itemType" "FavoriteType" NOT NULL, "itemId" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), UNIQUE("userId", "itemType", "itemId"));
