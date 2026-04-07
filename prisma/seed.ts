import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as XLSX from 'xlsx'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

// ─── Excel Parsing ────────────────────────────────────────────────────────────

type ColLayout = 'mat_livres_15k' | 'mat_livres_24k' | 'ecofo_carnet' | 'ecofo_no_carnet'

interface StudentRow {
  name: string
  totalPayee: number   // amount already paid
  totalAPayer: number  // total expected (= class fee for T1)
}

interface ClassSection {
  className: string
  gradeLevel: string
  colLayout: ColLayout
  standardFee: number
  students: StudentRow[]
}

function getTotalPayee(row: unknown[], layout: ColLayout): number {
  // Indices are 0-based from the raw row array
  // row[0]=misc, row[1]=student#, row[2]=name, row[3]=arrPayer, row[4]=arrPaye, ...
  switch (layout) {
    case 'mat_livres_15k':
    case 'mat_livres_24k':
      return Number(row[9]) || 0   // TOTAL PAYEE at index 9
    case 'ecofo_carnet':
      return Number(row[8]) || 0   // TOTAL PAYEE at index 8
    case 'ecofo_no_carnet':
      return Number(row[7]) || 0   // TOTAL PAYEE at index 7
  }
}

function getTotalAPayer(row: unknown[], layout: ColLayout): number {
  switch (layout) {
    case 'mat_livres_15k':
    case 'mat_livres_24k':
      return Number(row[10]) || 0
    case 'ecofo_carnet':
      return Number(row[9]) || 0
    case 'ecofo_no_carnet':
      return Number(row[8]) || 0
  }
}

function isStudentRow(row: unknown[]): boolean {
  return (
    row.length >= 3 &&
    row[0] == null &&           // undefined or null (empty cell)
    typeof row[1] === 'number' &&
    row[1] > 0 &&
    typeof row[2] === 'string' &&
    row[2].trim().length > 0
  )
}

function parseExcel(): ClassSection[] {
  const filePath = path.join(process.cwd(), 'Seed inforation.xlsx')
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })

  // Each entry: [startRow, className, gradeLevel, colLayout, standardFee]
  const sectionDefs: [number, string, string, ColLayout, number][] = [
    [2,   'I Maternelle',   'Mat 1',  'mat_livres_15k',  99500],
    [50,  'II Maternelle',  'Mat 2',  'mat_livres_15k',  99500],
    [106, 'III Maternelle', 'Mat 3',  'mat_livres_24k', 108500],
    [164, '1 ECOFO',        '1',      'ecofo_carnet',    94500],
    [207, '2 ECOFO',        '2',      'ecofo_carnet',    94500],
    [252, '3 ECOFO',        '3',      'ecofo_carnet',    94500],
    [305, '4 ECOFO',        '4',      'ecofo_carnet',    94500],
    [353, '5 ECOFO',        '5',      'ecofo_carnet',    94500],
    [401, '6 ECOFO',        '6',      'ecofo_carnet',    94500],
    [440, '7 ECOFO',        '7',      'ecofo_no_carnet', 101500],
    [498, '8ème Année',     '8',      'ecofo_no_carnet', 101500],
    [545, '9ème Année',     '9',      'ecofo_no_carnet', 101500],
  ]

  const sections: ClassSection[] = []

  for (let s = 0; s < sectionDefs.length; s++) {
    const [startRow, className, gradeLevel, colLayout, standardFee] = sectionDefs[s]
    const endRow = s + 1 < sectionDefs.length ? sectionDefs[s + 1][0] : rawData.length

    const students: StudentRow[] = []
    for (let i = startRow; i < endRow; i++) {
      const row = rawData[i] as unknown[]
      if (!row || !isStudentRow(row)) continue
      const name = String(row[2]).trim()
      if (!name) continue
      students.push({
        name,
        totalPayee: getTotalPayee(row, colLayout),
        totalAPayer: getTotalAPayer(row, colLayout),
      })
    }

    sections.push({ className, gradeLevel, colLayout, standardFee, students })
  }

  return sections
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function randomPaymentDate(): Date {
  // Random date between 2025-09-01 and 2025-12-19
  const start = new Date('2025-09-01').getTime()
  const end   = new Date('2025-12-19').getTime()
  return new Date(start + Math.random() * (end - start))
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Initialisation de la base de données depuis le fichier Excel...')

  // ── 1. Clear all existing data ─────────────────────────────────────────────
  console.log('🗑️  Suppression des données existantes...')
  await db.salaryPayment.deleteMany()
  await db.salaryDebitLetter.deleteMany()
  await db.iNSSPayment.deleteMany()
  await db.mutuellePayment.deleteMany()
  await db.staffMember.deleteMany()
  await db.schoolSettings.deleteMany()
  await db.user.deleteMany()
  await db.sale.deleteMany()
  await db.payment.deleteMany()
  await db.extraFee.deleteMany()
  await db.expense.deleteMany()
  await db.deposit.deleteMany()
  await db.studentEnrollment.deleteMany()
  await db.yearFeeStructure.deleteMany()
  await db.feeStructure.deleteMany()
  await db.student.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.class.deleteMany()
  await db.term.deleteMany()
  await db.schoolYear.deleteMany()
  console.log('✅ Données existantes supprimées')

  // ── 2. Admin user ──────────────────────────────────────────────────────────
  await db.user.create({
    data: {
      email: 'spoidanid4454@gmail.com',
      name: 'Spoid Admin',
      role: 'admin',
      isSetup: false,
      isActive: true,
    },
  })
  console.log('✅ Utilisateur admin créé')

  // ── 3. School Settings ─────────────────────────────────────────────────────
  await db.schoolSettings.create({
    data: {
      schoolName: 'École Primaire Modèle',
      address: "Avenue de l'Indépendance, Bujumbura",
      phone: '+257 22 22 22 22',
      email: 'ecole@exemple.bi',
      directorName: 'M. Jean Hakizimana',
    },
  })
  console.log('✅ Paramètres de l\'école créés')

  // ── 4. School Year 2025-2026 ───────────────────────────────────────────────
  const schoolYear = await db.schoolYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  })

  const term1 = await db.term.create({
    data: {
      schoolYearId: schoolYear.id,
      name: 'Trimestre 1',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-20'),
      isActive: false,
    },
  })
  await db.term.createMany({
    data: [
      { schoolYearId: schoolYear.id, name: 'Trimestre 2', startDate: new Date('2026-01-05'), endDate: new Date('2026-03-31'), isActive: true },
      { schoolYearId: schoolYear.id, name: 'Trimestre 3', startDate: new Date('2026-04-13'), endDate: new Date('2026-06-30'), isActive: false },
    ],
  })
  console.log(`✅ Année scolaire 2025-2026 créée avec 3 trimestres (Trimestre 1: ${term1.startDate.toISOString().slice(0,10)} → ${term1.endDate.toISOString().slice(0,10)})`)

  // ── 5. Parse Excel ─────────────────────────────────────────────────────────
  const sections = parseExcel()
  console.log(`✅ Fichier Excel parsé — ${sections.length} classes trouvées`)

  // ── 6. Seed classes, fee structures, students, payments ────────────────────
  let totalStudents = 0
  let totalPayments = 0
  let rollCounter = 1001

  for (const section of sections) {
    // Create class
    const cls = await db.class.create({
      data: {
        name: section.className,
        gradeLevel: section.gradeLevel,
        capacity: section.students.length + 5,
      },
    })

    // Year fee structure (per_trimester, T1 amount = standardFee)
    await db.yearFeeStructure.create({
      data: {
        schoolYearId: schoolYear.id,
        classId: cls.id,
        amount: section.standardFee,
        description: `Frais Trimestre 1 — ${section.className}`,
        paymentFrequency: 'per_trimester',
        amountT1: section.standardFee,
        specificTrimester: 1,
      },
    })

    // Fee structure breakdown
    const feeBreakdowns = getFeeBreakdown(section.colLayout, section.className)
    await db.feeStructure.createMany({
      data: feeBreakdowns.map(f => ({ ...f, classId: cls.id })),
    })

    // Students + enrollments + payments
    for (const studentData of section.students) {
      const student = await db.student.create({
        data: {
          name: studentData.name,
          rollNumber: String(rollCounter++),
          classId: cls.id,
          isActive: true,
        },
      })

      await db.studentEnrollment.create({
        data: {
          studentId: student.id,
          schoolYearId: schoolYear.id,
          classId: cls.id,
          enrollmentDate: new Date('2025-09-01'),
          status: 'active',
        },
      })

      // Create payment if student has paid something
      if (studentData.totalPayee > 0) {
        await db.payment.create({
          data: {
            studentId: student.id,
            amount: studentData.totalPayee,
            date: randomPaymentDate(),
            method: 'espèces',
            notes: `Paiement T1 2025-2026 — ${section.className}`,
            month: null,
            year: 2025,
          },
        })
        totalPayments++
      }

      totalStudents++
    }

    console.log(`  ✅ ${section.className}: ${section.students.length} élèves`)
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  console.log('\n🎉 Base de données initialisée avec succès !')
  console.log(`   Classes:    ${sections.length}`)
  console.log(`   Élèves:     ${totalStudents}`)
  console.log(`   Paiements:  ${totalPayments}`)
}

function getFeeBreakdown(layout: ColLayout, className: string) {
  switch (layout) {
    case 'mat_livres_15k':
      return [
        { name: 'Minerval', amount: 80000, period: 'trimester', description: 'Minerval T1' },
        { name: 'Carnet', amount: 3000, period: 'annual', description: 'Frais carnet' },
        { name: 'Assurance', amount: 1500, period: 'annual', description: 'Assurance élève' },
        { name: 'Livres', amount: 15000, period: 'annual', description: 'Fournitures scolaires' },
      ]
    case 'mat_livres_24k':
      return [
        { name: 'Minerval', amount: 80000, period: 'trimester', description: 'Minerval T1' },
        { name: 'Carnet', amount: 3000, period: 'annual', description: 'Frais carnet' },
        { name: 'Assurance', amount: 1500, period: 'annual', description: 'Assurance élève' },
        { name: 'Livres', amount: 24000, period: 'annual', description: 'Fournitures scolaires' },
      ]
    case 'ecofo_carnet':
      return [
        { name: 'Minerval', amount: 90000, period: 'trimester', description: 'Minerval T1' },
        { name: 'Carnet', amount: 3000, period: 'annual', description: 'Frais carnet' },
        { name: 'Assurance', amount: 1500, period: 'annual', description: 'Assurance élève' },
      ]
    case 'ecofo_no_carnet':
      return [
        { name: 'Minerval', amount: 100000, period: 'trimester', description: 'Minerval T1' },
        { name: 'Assurance', amount: 1500, period: 'annual', description: 'Assurance élève' },
      ]
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
