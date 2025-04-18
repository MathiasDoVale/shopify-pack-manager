-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "discount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RelationPackProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "RelationPackProduct_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RelationPackProduct_packId_productId_key" ON "RelationPackProduct"("packId", "productId");
