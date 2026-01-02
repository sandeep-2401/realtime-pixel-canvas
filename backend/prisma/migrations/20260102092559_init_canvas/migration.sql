-- CreateTable
CREATE TABLE "Pixel" (
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Pixel_pkey" PRIMARY KEY ("x","y")
);
