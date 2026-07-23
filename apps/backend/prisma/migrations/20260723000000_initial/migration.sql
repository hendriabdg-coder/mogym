-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('WEIGHT', 'BODY_FAT');

-- CreateEnum
CREATE TYPE "WeeklyPattern" AS ENUM ('P3_4', 'P4_3', 'P5_2', 'P6_1');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('FULL_BODY_A', 'FULL_BODY_B', 'FULL_BODY_C', 'UPPER_A', 'UPPER_B', 'LOWER_A', 'LOWER_B', 'PUSH_A', 'PUSH_B', 'PULL_A', 'PULL_B', 'LEGS_A', 'LEGS_B');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CORE', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'BAND');

-- CreateEnum
CREATE TYPE "ExercisePhase" AS ENUM ('WARMUP', 'MAIN', 'ACCESSORY', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('ON_TRACK', 'AHEAD', 'BEHIND', 'STAGNANT', 'LOW_COMPLIANCE', 'INSUFFICIENT_DATA', 'PERFORMANCE_DROP', 'FATIGUE', 'CONSIDER_RECOVERY', 'CONSIDER_CALORIC_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "EvaluationAction" AS ENUM ('APPLY', 'IGNORE', 'REMIND_LATER');

-- CreateEnum
CREATE TYPE "PhotoAngle" AS ENUM ('FRONT', 'SIDE', 'BACK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORKOUT_REMINDER', 'POST_WORKOUT', 'WEIGH_REMINDER', 'FOOD_CHECKLIST', 'EVALUATION', 'MISSED_SESSION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "appleId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "heightCm" DOUBLE PRECISION,
    "onboardingWeightKg" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel",
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Makassar',
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuttingProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetType" "TargetType" NOT NULL,
    "startWeight" DOUBLE PRECISION NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "startBodyFat" DOUBLE PRECISION,
    "targetBodyFat" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "weeklyPattern" "WeeklyPattern" NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL,
    "unavailableDays" INTEGER[],
    "caloricTarget" INTEGER NOT NULL,
    "proteinGrams" INTEGER NOT NULL,
    "carbsGrams" INTEGER NOT NULL,
    "fatGrams" INTEGER NOT NULL,
    "progressiveOverloadEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyWeightTargetEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyWeightTargetKg" DOUBLE PRECISION,
    "foodChecklistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuttingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSplit" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "splitType" "SplitType" NOT NULL,
    "sessionOrder" INTEGER NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,

    CONSTRAINT "WorkoutSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "equipment" "Equipment" NOT NULL,
    "isCompound" BOOLEAN NOT NULL,
    "instructionShort" TEXT NOT NULL,
    "contraindications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSplitExercise" (
    "id" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "targetRepsMin" INTEGER NOT NULL,
    "targetRepsMax" INTEGER NOT NULL,
    "restSeconds" INTEGER NOT NULL,
    "phase" "ExercisePhase" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "WorkoutSplitExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "durationMinutes" INTEGER,
    "averageRpe" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionExerciseLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sets" JSONB NOT NULL,
    "rpe" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyWeight" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weighDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bodyFatPercent" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyEvaluation" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "completedSessions" INTEGER NOT NULL,
    "plannedSessions" INTEGER NOT NULL,
    "missedSessions" INTEGER NOT NULL,
    "compliancePercent" DOUBLE PRECISION NOT NULL,
    "averageRpe" DOUBLE PRECISION,
    "weightChange" DOUBLE PRECISION,
    "recommendations" JSONB NOT NULL,
    "userAction" "EvaluationAction",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodChecklist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "angle" "PhotoAngle" NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutReminder" BOOLEAN NOT NULL DEFAULT true,
    "workoutReminderHour" INTEGER NOT NULL DEFAULT 17,
    "workoutReminderMinute" INTEGER NOT NULL DEFAULT 0,
    "postWorkoutReminder" BOOLEAN NOT NULL DEFAULT true,
    "weighReminder" BOOLEAN NOT NULL DEFAULT true,
    "weighReminderHour" INTEGER NOT NULL DEFAULT 7,
    "weighReminderMinute" INTEGER NOT NULL DEFAULT 0,
    "foodChecklistReminder" BOOLEAN NOT NULL DEFAULT false,
    "evaluationReminder" BOOLEAN NOT NULL DEFAULT true,
    "missedSessionReminder" BOOLEAN NOT NULL DEFAULT true,
    "quietDays" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "CuttingProgram_userId_status_idx" ON "CuttingProgram"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkoutSplit_programId_weekNumber_idx" ON "WorkoutSplit"("programId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_equipment_idx" ON "Exercise"("muscleGroup", "equipment");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSplitExercise_splitId_orderIndex_key" ON "WorkoutSplitExercise"("splitId", "orderIndex");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_scheduledDate_idx" ON "WorkoutSession"("userId", "scheduledDate");

-- CreateIndex
CREATE INDEX "WorkoutSession_programId_scheduledDate_idx" ON "WorkoutSession"("programId", "scheduledDate");

-- CreateIndex
CREATE INDEX "SessionExerciseLog_sessionId_idx" ON "SessionExerciseLog"("sessionId");

-- CreateIndex
CREATE INDEX "WeeklyWeight_programId_weekNumber_idx" ON "WeeklyWeight"("programId", "weekNumber");

-- CreateIndex
CREATE INDEX "WeeklyWeight_userId_weighDate_idx" ON "WeeklyWeight"("userId", "weighDate");

-- CreateIndex
CREATE INDEX "WeeklyEvaluation_userId_weekNumber_idx" ON "WeeklyEvaluation"("userId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyEvaluation_programId_weekNumber_key" ON "WeeklyEvaluation"("programId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FoodChecklist_userId_date_key" ON "FoodChecklist"("userId", "date");

-- CreateIndex
CREATE INDEX "ProgressPhoto_programId_weekNumber_idx" ON "ProgressPhoto"("programId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_scheduledAt_idx" ON "NotificationLog"("userId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuttingProgram" ADD CONSTRAINT "CuttingProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSplit" ADD CONSTRAINT "WorkoutSplit_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSplitExercise" ADD CONSTRAINT "WorkoutSplitExercise_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "WorkoutSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSplitExercise" ADD CONSTRAINT "WorkoutSplitExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "WorkoutSplit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExerciseLog" ADD CONSTRAINT "SessionExerciseLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExerciseLog" ADD CONSTRAINT "SessionExerciseLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyWeight" ADD CONSTRAINT "WeeklyWeight_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyWeight" ADD CONSTRAINT "WeeklyWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyEvaluation" ADD CONSTRAINT "WeeklyEvaluation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyEvaluation" ADD CONSTRAINT "WeeklyEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodChecklist" ADD CONSTRAINT "FoodChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodChecklist" ADD CONSTRAINT "FoodChecklist_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CuttingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
