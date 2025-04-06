-- CreateTable
CREATE TABLE "UpscaleJob" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "originalImage" TEXT NOT NULL,
    "upscaledImage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpscaleJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UpscaleJob" ADD CONSTRAINT "UpscaleJob_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
