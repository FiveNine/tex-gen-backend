-- CreateTable
CREATE TABLE "modification_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "size" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modification_jobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "modification_jobs" ADD CONSTRAINT "modification_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
