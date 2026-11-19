import "dotenv/config";
import { PrismaClient, MasteryLevel, AssignmentType } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL est manquant dans .env");
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_USER_EMAIL || "monssef@studentos.fr";
  const password = process.env.SEED_USER_PASSWORD || "StudentOS2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Monssef",
    },
  });

  await prisma.subject.deleteMany({ where: { userId: user.id } });

  const subjectsData = [
    {
      name: "Thermodynamique",
      color: "#3B82F6",
      driveUrl: "https://drive.google.com",
      notes: "Revoir systématiquement les conventions de signe des transferts thermiques.",
      chapters: [
        { number: 1, title: "Premier principe de la thermodynamique", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: true },
        { number: 2, title: "Second principe et entropie", masteryLevel: MasteryLevel.TD_IN_PROGRESS, isPriority: true, courseReviewed: true, summaryDone: true, exercisesDone: false, pastExamsDone: false, quickNotes: "Bilan entropique sur systèmes ouverts à revoir." },
        { number: 3, title: "Machines thermiques et cycles", masteryLevel: MasteryLevel.COURSE_SEEN, isPriority: false, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Électrostatique",
      color: "#8B5CF6",
      driveUrl: "https://drive.google.com",
      notes: "Toujours préciser les invariances et symétries avant d'appliquer Gauss.",
      chapters: [
        { number: 1, title: "Champ et potentiel électrostatique", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: true, obsidianUrl: "obsidian://open?vault=STPI2&file=Electrostatique-Ch1" },
        { number: 2, title: "Théorème de Gauss", masteryLevel: MasteryLevel.TD_IN_PROGRESS, isPriority: true, courseReviewed: true, summaryDone: true, exercisesDone: false, pastExamsDone: false, quickNotes: "Revoir le calcul du flux pour un cylindre infini. Attention aux signes des normales." },
        { number: 3, title: "Dipôle électrostatique", masteryLevel: MasteryLevel.COURSE_SEEN, isPriority: false, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
        { number: 4, title: "Conducteurs en équilibre", masteryLevel: MasteryLevel.NOT_STARTED, isPriority: false, courseReviewed: false, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Analyse",
      color: "#10B981",
      driveUrl: "https://drive.google.com",
      chapters: [
        { number: 1, title: "Intégrales généralisées", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: true },
        { number: 2, title: "Séries numériques", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: false },
        { number: 3, title: "Développements limités & Taylor", masteryLevel: MasteryLevel.TD_IN_PROGRESS, isPriority: true, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Probabilités",
      color: "#EAB308",
      driveUrl: "https://drive.google.com",
      chapters: [
        { number: 1, title: "Espaces probabilisés finis et dénombrables", masteryLevel: MasteryLevel.TD_IN_PROGRESS, isPriority: true, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
        { number: 2, title: "Variables aléatoires discrètes", masteryLevel: MasteryLevel.NOT_STARTED, isPriority: false, courseReviewed: false, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Chimie des solutions",
      color: "#EF4444",
      driveUrl: "https://drive.google.com",
      chapters: [
        { number: 1, title: "Réactions acido-basiques et pH", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: true },
        { number: 2, title: "Précipitation et solubilité", masteryLevel: MasteryLevel.TD_IN_PROGRESS, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Optique géométrique",
      color: "#F97316",
      driveUrl: "https://drive.google.com",
      chapters: [
        { number: 1, title: "Lois de Snell-Descartes & stigmatisme", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: false },
        { number: 2, title: "Lentilles minces et instruments", masteryLevel: MasteryLevel.COURSE_SEEN, isPriority: false, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
    {
      name: "Programmation Pascal",
      color: "#06B6D4",
      driveUrl: "https://drive.google.com",
      chapters: [
        { number: 1, title: "Structures de contrôle et types", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: true },
        { number: 2, title: "Tableaux, pointeurs et récursivité", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: false },
      ],
    },
    {
      name: "Anglais",
      color: "#EC4899",
      chapters: [
        { number: 1, title: "Scientific Presentation & Vocabulary", masteryLevel: MasteryLevel.MASTERED, isPriority: false, courseReviewed: true, summaryDone: true, exercisesDone: true, pastExamsDone: false },
      ],
    },
    {
      name: "Espagnol",
      color: "#6366F1",
      chapters: [
        { number: 1, title: "Comprensión y expresión escrita", masteryLevel: MasteryLevel.COURSE_SEEN, isPriority: false, courseReviewed: true, summaryDone: false, exercisesDone: false, pastExamsDone: false },
      ],
    },
  ];

  const createdSubjects: Record<string, string> = {};

  for (let i = 0; i < subjectsData.length; i++) {
    const s = subjectsData[i];
    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: s.name,
        color: s.color,
        driveUrl: s.driveUrl ?? null,
        notes: s.notes ?? null,
        sortOrder: i,
        chapters: {
          create: s.chapters.map((c) => ({
            userId: user.id,
            number: c.number,
            title: c.title,
            masteryLevel: c.masteryLevel,
            isPriority: c.isPriority,
            courseReviewed: c.courseReviewed,
            summaryDone: c.summaryDone,
            exercisesDone: c.exercisesDone,
            pastExamsDone: c.pastExamsDone,
            obsidianUrl: (c as { obsidianUrl?: string }).obsidianUrl ?? null,
            quickNotes: (c as { quickNotes?: string }).quickNotes ?? null,
          })),
        },
        resources: {
          create: [
            {
              userId: user.id,
              label: "Dossier Drive principal",
              url: "https://drive.google.com",
              category: "Drive",
            },
            {
              userId: user.id,
              label: "Annales corrigées STPI2",
              url: "https://drive.google.com",
              category: "Annales",
            },
          ],
        },
      },
    });
    createdSubjects[s.name] = subject.id;
  }

  const now = new Date();
  const inDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(14, 0, 0, 0);
    return d;
  };

  await prisma.assignment.createMany({
    data: [
      {
        userId: user.id,
        subjectId: createdSubjects["Électrostatique"],
        title: "DS Électrostatique (Gauss & Dipôle)",
        type: AssignmentType.DS,
        dueDate: inDays(2),
        isCompleted: false,
      },
      {
        userId: user.id,
        subjectId: createdSubjects["Analyse"],
        title: "DM Analyse — Intégrales généralisées",
        type: AssignmentType.DM,
        dueDate: inDays(5),
        isCompleted: false,
      },
      {
        userId: user.id,
        subjectId: createdSubjects["Programmation Pascal"],
        title: "Rendu Projet Pascal (Tic Tac Foot)",
        type: AssignmentType.PROJET,
        dueDate: inDays(6),
        isCompleted: false,
      },
      {
        userId: user.id,
        subjectId: createdSubjects["Chimie des solutions"],
        title: "TP Chimie des solutions — Titrage pH-métrique",
        type: AssignmentType.TP,
        dueDate: inDays(9),
        isCompleted: false,
      },
      {
        userId: user.id,
        subjectId: createdSubjects["Thermodynamique"],
        title: "DS Thermodynamique",
        type: AssignmentType.DS,
        dueDate: inDays(12),
        isCompleted: false,
      },
    ],
  });

  console.log(`Seed terminé avec succès pour ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });