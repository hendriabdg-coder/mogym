import { Equipment, MuscleGroup, PrismaClient } from '@prisma/client';

const db = new PrismaClient();
type Row = [string, string, MuscleGroup, Equipment, boolean, string[]];
const rows: Row[] = [
  ['Bench Press','Bench Press / Tekan Dada','CHEST','BARBELL',true,['cedera bahu','nyeri siku']],
  ['Incline Bench Press','Incline Bench Press / Tekan Dada Atas','CHEST','BARBELL',true,['cedera bahu']],
  ['Dumbbell Fly','Dumbbell Fly / Bukaan Dada','CHEST','DUMBBELL',false,['cedera bahu']],
  ['Cable Crossover','Cable Crossover / Silang Kabel Dada','CHEST','CABLE',false,['cedera bahu']],
  ['Push-Up','Push-Up / Push Up','CHEST','BODYWEIGHT',true,['cedera pergelangan tangan']],
  ['Machine Chest Press','Machine Chest Press / Tekan Dada Mesin','CHEST','MACHINE',true,['cedera bahu']],
  ['Decline Bench Press','Decline Bench Press / Tekan Dada Bawah','CHEST','BARBELL',true,['cedera bahu']],
  ['Dumbbell Pullover','Dumbbell Pullover / Tarik Dada','CHEST','DUMBBELL',false,['cedera bahu']],
  ['Deadlift','Deadlift / Angkat Beban dari Lantai','BACK','BARBELL',true,['cedera punggung bawah']],
  ['Barbell Row','Barbell Row / Tarik Barbel Membungkuk','BACK','BARBELL',true,['cedera punggung bawah']],
  ['Lat Pulldown','Lat Pulldown / Tarik Kabel Atas','BACK','CABLE',true,['cedera bahu']],
  ['Seated Cable Row','Seated Cable Row / Tarik Kabel Duduk','BACK','CABLE',true,['cedera punggung bawah']],
  ['Pull-Up','Pull-Up / Angkat Badan','BACK','BODYWEIGHT',true,['cedera bahu','nyeri siku']],
  ['Face Pull','Face Pull / Tarik Kabel ke Wajah','BACK','CABLE',false,['cedera bahu']],
  ['Dumbbell Row','Dumbbell Row / Tarik Dumbbell','BACK','DUMBBELL',true,['cedera punggung bawah']],
  ['Machine Row','Machine Row / Tarik Mesin','BACK','MACHINE',true,[]],
  ['Straight Arm Pulldown','Straight Arm Pulldown / Tarik Lengan Lurus','BACK','CABLE',false,['cedera bahu']],
  ['Overhead Press','Overhead Press / Tekan Barbel Atas','SHOULDERS','BARBELL',true,['cedera bahu','nyeri punggung bawah']],
  ['Dumbbell Shoulder Press','Dumbbell Shoulder Press / Tekan Bahu','SHOULDERS','DUMBBELL',true,['cedera bahu']],
  ['Lateral Raise','Lateral Raise / Angkat Samping','SHOULDERS','DUMBBELL',false,['cedera bahu']],
  ['Front Raise','Front Raise / Angkat Depan','SHOULDERS','DUMBBELL',false,['cedera bahu']],
  ['Rear Delt Fly','Rear Delt Fly / Bukaan Bahu Belakang','SHOULDERS','DUMBBELL',false,['cedera bahu']],
  ['Cable Lateral Raise','Cable Lateral Raise / Angkat Samping Kabel','SHOULDERS','CABLE',false,['cedera bahu']],
  ['Machine Shoulder Press','Machine Shoulder Press / Tekan Bahu Mesin','SHOULDERS','MACHINE',true,['cedera bahu']],
  ['Barbell Curl','Barbell Curl / Tekuk Barbel','BICEPS','BARBELL',false,['nyeri siku']],
  ['Dumbbell Curl','Dumbbell Curl / Tekuk Dumbbell','BICEPS','DUMBBELL',false,['nyeri siku']],
  ['Hammer Curl','Hammer Curl / Tekuk Palu','BICEPS','DUMBBELL',false,['nyeri siku']],
  ['Cable Curl','Cable Curl / Tekuk Kabel','BICEPS','CABLE',false,['nyeri siku']],
  ['Preacher Curl','Preacher Curl / Tekuk Bangku','BICEPS','BARBELL',false,['nyeri siku']],
  ['Incline Curl','Incline Curl / Tekuk Miring','BICEPS','DUMBBELL',false,['nyeri siku']],
  ['Tricep Pushdown','Tricep Pushdown / Tekan Trisep Kabel','TRICEPS','CABLE',false,['nyeri siku']],
  ['Overhead Tricep Extension','Overhead Tricep Extension / Ekstensi Trisep Atas','TRICEPS','DUMBBELL',false,['cedera bahu','nyeri siku']],
  ['Skull Crusher','Skull Crusher / Ekstensi Trisep Berbaring','TRICEPS','BARBELL',false,['nyeri siku']],
  ['Dips','Dips / Turun Angkat Badan','TRICEPS','BODYWEIGHT',true,['cedera bahu']],
  ['Cable Overhead Extension','Cable Overhead Extension / Ekstensi Kabel Atas','TRICEPS','CABLE',false,['cedera bahu']],
  ['Close Grip Bench Press','Close Grip Bench Press / Tekan Dada Pegangan Sempit','TRICEPS','BARBELL',true,['cedera bahu','nyeri siku']],
  ['Barbell Squat','Barbell Squat / Jongkok Barbel','LEGS','BARBELL',true,['cedera lutut','cedera punggung bawah']],
  ['Leg Press','Leg Press / Dorong Kaki Mesin','LEGS','MACHINE',true,['cedera lutut']],
  ['Romanian Deadlift','Romanian Deadlift / Angkat Rumania','LEGS','BARBELL',true,['cedera punggung bawah','cedera hamstring']],
  ['Leg Curl','Leg Curl / Tekuk Kaki Mesin','LEGS','MACHINE',false,['cedera lutut']],
  ['Leg Extension','Leg Extension / Luruskan Kaki Mesin','LEGS','MACHINE',false,['cedera lutut']],
  ['Goblet Squat','Goblet Squat / Jongkok Goblet','LEGS','DUMBBELL',true,['cedera lutut']],
  ['Walking Lunges','Walking Lunges / Langkah Menekuk','LEGS','DUMBBELL',true,['cedera lutut','gangguan keseimbangan']],
  ['Standing Calf Raise','Standing Calf Raise / Angkat Betis Berdiri','LEGS','MACHINE',false,['cedera pergelangan kaki']],
  ['Seated Calf Raise','Seated Calf Raise / Angkat Betis Duduk','LEGS','MACHINE',false,['cedera pergelangan kaki']],
  ['Step-Up','Step-Up / Naik Bangku','LEGS','DUMBBELL',true,['cedera lutut','gangguan keseimbangan']],
  ['Hip Thrust','Hip Thrust / Dorong Pinggul','GLUTES','BARBELL',true,['cedera punggung bawah']],
  ['Glute Bridge','Glute Bridge / Jembatan Bokong','GLUTES','BODYWEIGHT',true,['cedera punggung bawah']],
  ['Bulgarian Split Squat','Bulgarian Split Squat / Jongkok Satu Kaki','GLUTES','DUMBBELL',true,['cedera lutut','gangguan keseimbangan']],
  ['Cable Kickback','Cable Kickback / Tendang Kabel Belakang','GLUTES','CABLE',false,['cedera pinggul']],
  ['Band Side Walk','Band Side Walk / Jalan Samping Band','GLUTES','BAND',false,['cedera lutut']],
  ['Plank','Plank / Tahan Tubuh','CORE','BODYWEIGHT',true,['cedera bahu','cedera punggung bawah']],
  ['Crunch','Crunch / Tekuk Perut','CORE','BODYWEIGHT',false,['cedera leher','cedera punggung bawah']],
  ['Leg Raise','Leg Raise / Angkat Kaki','CORE','BODYWEIGHT',false,['cedera punggung bawah']],
  ['Russian Twist','Russian Twist / Putar Rusia','CORE','BODYWEIGHT',false,['cedera punggung bawah']],
  ['Dead Bug','Dead Bug / Serangga Terbalik','CORE','BODYWEIGHT',false,[]],
  ['Cable Woodchop','Cable Woodchop / Tebang Kayu Kabel','CORE','CABLE',true,['cedera punggung bawah']],
  ['Clean','Clean / Angkat Eksplosif','FULL_BODY','BARBELL',true,['cedera punggung bawah','cedera bahu']],
  ['Kettlebell Swing','Kettlebell Swing / Ayunan Kettlebell','FULL_BODY','DUMBBELL',true,['cedera punggung bawah']],
  ['Battle Rope','Battle Rope / Ayunan Tali','FULL_BODY','BODYWEIGHT',true,['cedera bahu']],
  ['Burpee','Burpee / Jongkok Lompat','FULL_BODY','BODYWEIGHT',true,['cedera lutut','gangguan jantung']],
  ['Thruster','Thruster / Jongkok dan Tekan','FULL_BODY','DUMBBELL',true,['cedera lutut','cedera bahu']],
];

async function main() {
  await Promise.all(rows.map(([name,nameId,muscleGroup,equipment,isCompound,contraindications]) =>
    db.exercise.upsert({
      where: { name },
      update: { nameId,muscleGroup,equipment,isCompound,contraindications },
      create: {
        name,nameId,muscleGroup,equipment,isCompound,contraindications,
        instructionShort: `Atur posisi tubuh stabil dan lakukan ${nameId} dengan rentang gerak yang nyaman. Kendalikan beban, bernapas teratur, dan hentikan jika muncul nyeri tajam.`,
      },
    })
  ));
  console.log(`Seed selesai: ${rows.length} latihan.`);
}
main().finally(() => db.$disconnect());
