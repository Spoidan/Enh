import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const prenomsM = ['Jean', 'Pierre', 'Paul', 'Michel', 'André', 'François', 'Jacques', 'Louis', 'Henri', 'Robert',
  'Emmanuel', 'Thierry', 'Gilles', 'Didier', 'Patrice', 'Clément', 'Olivier', 'Sébastien', 'Nicolas', 'Vincent']

const prenomsF = ['Marie', 'Anne', 'Sophie', 'Claire', 'Isabelle', 'Christine', 'Nathalie', 'Catherine', 'Sandrine',
  'Valérie', 'Céline', 'Audrey', 'Sylvie', 'Laure', 'Camille', 'Julie', 'Alice', 'Emma', 'Léa', 'Manon']

const noms = ['Nkurunziza', 'Ndayishimiye', 'Hakizimana', 'Ntahompagaze', 'Bizimana', 'Niyonzima',
  'Nshimirimana', 'Bucumi', 'Nzohabonayo', 'Bigirimana', 'Habonimana', 'Hatungimana',
  'Ndikumana', 'Nzeyimana', 'Bangirinama', 'Havyarimana', 'Ntirampeba', 'Barankiriza']

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log('🌱 Initialisation de la base de données...')

  // Clear existing data (order matters for FK constraints)
  await db.salaryPayment.deleteMany()
  await db.salaryDebitLetter.deleteMany()
  await db.iNSSPayment.deleteMany()
  await db.mutuellePayment.deleteMany()
  await db.staffMember.deleteMany()
  await db.schoolSettings.deleteMany()
  await db.user.deleteMany()
  await db.sale.deleteMany()
  await db.payment.deleteMany()
  await db.expense.deleteMany()
  await db.deposit.deleteMany()
  await db.yearFeeStructure.deleteMany()
  await db.feeStructure.deleteMany()
  await db.student.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.class.deleteMany()
  await db.term.deleteMany()
  await db.schoolYear.deleteMany()

  // ── Admin user ──────────────────────────────────────────────────────────────
  // Admin is seeded WITHOUT a password so on first login they go through "Complete Account" setup.
  // To bypass that for dev, set isSetup: true and provide a passwordHash.
  await db.user.create({
    data: {
      email: 'spoidanid4454@gmail.com',
      name: 'Spoid Admin',
      role: 'admin',
      isSetup: false,
      isActive: true,
    },
  })
  console.log('✅ Utilisateur admin créé (email: spoidanid4454@gmail.com) — configure votre mot de passe à la première connexion')

  // ── School Settings ─────────────────────────────────────────────────────────
  await db.schoolSettings.create({
    data: {
      schoolName: 'École Primaire Modèle',
      address: 'Avenue de l\'Indépendance, Bujumbura',
      phone: '+257 22 22 22 22',
      email: 'ecole@exemple.bi',
      directorName: 'M. Jean Hakizimana',
    },
  })
  console.log('✅ Paramètres de l\'école créés')

  // ── School Year ─────────────────────────────────────────────────────────────
  const schoolYear = await db.schoolYear.create({
    data: {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  })

  // Terms
  await db.term.createMany({
    data: [
      { schoolYearId: schoolYear.id, name: 'Trimestre 1', startDate: new Date('2025-09-01'), endDate: new Date('2025-11-30'), isActive: false },
      { schoolYearId: schoolYear.id, name: 'Trimestre 2', startDate: new Date('2026-01-05'), endDate: new Date('2026-03-31'), isActive: true },
      { schoolYearId: schoolYear.id, name: 'Trimestre 3', startDate: new Date('2026-04-13'), endDate: new Date('2026-06-30'), isActive: false },
    ],
  })
  console.log('✅ Année scolaire 2025-2026 créée avec 3 trimestres')

  // ── Classes ─────────────────────────────────────────────────────────────────
  const classData = [
    { name: '1ère Année A', section: 'A', gradeLevel: '1', capacity: 35 },
    { name: '1ère Année B', section: 'B', gradeLevel: '1', capacity: 35 },
    { name: '2ème Année A', section: 'A', gradeLevel: '2', capacity: 35 },
    { name: '2ème Année B', section: 'B', gradeLevel: '2', capacity: 35 },
    { name: '3ème Année A', section: 'A', gradeLevel: '3', capacity: 40 },
    { name: '4ème Année A', section: 'A', gradeLevel: '4', capacity: 40 },
    { name: '5ème Année A', section: 'A', gradeLevel: '5', capacity: 40 },
    { name: '6ème Année A', section: 'A', gradeLevel: '6', capacity: 40 },
    { name: '7ème Année A', section: 'A', gradeLevel: '7', capacity: 35 },
    { name: '8ème Année A', section: 'A', gradeLevel: '8', capacity: 35 },
  ]

  const classes = await Promise.all(
    classData.map(d => db.class.create({ data: d }))
  )
  console.log(`✅ ${classes.length} classes créées`)

  // ── Fee Structures (in BIF) ─────────────────────────────────────────────────
  const feeAmounts = [15000, 15000, 18000, 18000, 20000, 22000, 25000, 28000, 30000, 32000]
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i]
    const base = feeAmounts[i]
    await db.feeStructure.createMany({
      data: [
        { classId: cls.id, name: 'Frais de scolarité mensuel', amount: base, period: 'monthly' },
        { classId: cls.id, name: 'Frais d\'activités', amount: 2500, period: 'monthly' },
        { classId: cls.id, name: 'Inscription annuelle', amount: 20000, period: 'annual' },
      ],
    })
  }
  console.log('✅ Structures de frais créées')

  // ── Year Fee Structures (annual fee per class for 2025-2026) ────────────────
  const annualFees = [180000, 180000, 216000, 216000, 240000, 264000, 300000, 336000, 360000, 384000]
  await Promise.all(
    classes.map((cls, i) =>
      db.yearFeeStructure.create({
        data: {
          schoolYearId: schoolYear.id,
          classId: cls.id,
          amount: annualFees[i],
          description: `Frais annuels totaux — ${cls.name}`,
        },
      })
    )
  )
  console.log('✅ Structures de frais annuels par classe créées')

  // ── Students ────────────────────────────────────────────────────────────────
  let rollCounter = 1001
  const allStudents: { id: string }[] = []

  for (const cls of classes) {
    const count = randInt(14, 17)
    for (let i = 0; i < count; i++) {
      const isFemale = Math.random() > 0.5
      const prenom = isFemale ? rand(prenomsF) : rand(prenomsM)
      const nom = rand(noms)
      const prenomParent = isFemale ? rand(prenomsM) : rand(prenomsF)

      const s = await db.student.create({
        data: {
          name: `${prenom} ${nom}`,
          rollNumber: String(rollCounter++),
          classId: cls.id,
          gender: isFemale ? 'féminin' : 'masculin',
          parentName: `${prenomParent} ${nom}`,
          parentPhone: `+257 ${randInt(61, 79)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`,
          parentEmail: `${prenomParent.toLowerCase()}.${nom.toLowerCase()}@gmail.com`,
          address: `Quartier ${rand(['Rohero', 'Nyakabiga', 'Ngagara', 'Cibitoke', 'Mutanga', 'Kinama'])}, Bujumbura`,
          isActive: Math.random() > 0.05,
        },
      })
      allStudents.push(s)
    }
  }
  console.log(`✅ ${allStudents.length} élèves créés`)

  // ── Payments (in BIF) ───────────────────────────────────────────────────────
  let paymentCount = 0
  const methods = ['espèces', 'virement bancaire', 'mobile money', 'chèque']
  for (const s of allStudents) {
    const numPayments = randInt(1, 5)
    for (let i = 0; i < numPayments; i++) {
      await db.payment.create({
        data: {
          studentId: s.id,
          amount: randInt(10000, 40000),
          date: daysAgo(randInt(0, 90)),
          method: rand(methods),
          reference: Math.random() > 0.5 ? `REF-${randInt(10000, 99999)}` : null,
          month: randInt(1, 12),
          year: 2026,
        },
      })
      paymentCount++
    }
  }
  console.log(`✅ ${paymentCount} paiements créés`)

  // ── Inventory (in BIF) ──────────────────────────────────────────────────────
  const inventoryItems = await db.inventoryItem.createManyAndReturn({
    data: [
      { name: 'Chemise scolaire (S)', type: 'uniform', price: 8000, stock: 150 },
      { name: 'Chemise scolaire (M)', type: 'uniform', price: 8000, stock: 120 },
      { name: 'Chemise scolaire (L)', type: 'uniform', price: 8000, stock: 80 },
      { name: 'Pantalon scolaire (S)', type: 'uniform', price: 12000, stock: 100 },
      { name: 'Pantalon scolaire (M)', type: 'uniform', price: 12000, stock: 90 },
      { name: 'Veste scolaire', type: 'uniform', price: 22000, stock: 60 },
      { name: 'Cravate scolaire', type: 'uniform', price: 5000, stock: 200 },
      { name: 'Tenue de sport', type: 'uniform', price: 15000, stock: 75 },
      { name: 'Livre Mathématiques 1ère-3ème', type: 'book', price: 10000, stock: 80 },
      { name: 'Livre Français 1ère-3ème', type: 'book', price: 9000, stock: 80 },
      { name: 'Livre Sciences 4ème-6ème', type: 'book', price: 13000, stock: 60 },
      { name: 'Livre Histoire-Géo 4ème-6ème', type: 'book', price: 11000, stock: 55 },
      { name: 'Cahier d\'exercices Maths', type: 'book', price: 6000, stock: 100 },
      { name: 'Cahier d\'exercices Français', type: 'book', price: 6000, stock: 100 },
      { name: 'Sac scolaire', type: 'other', price: 18000, stock: 50 },
      { name: 'Bouteille d\'eau', type: 'other', price: 3500, stock: 120 },
    ],
  })
  console.log(`✅ ${inventoryItems.length} articles d'inventaire créés`)

  // ── Sales ───────────────────────────────────────────────────────────────────
  let salesCount = 0
  for (let i = 0; i < 80; i++) {
    const item = rand(inventoryItems)
    const qty = randInt(1, 3)
    const student = Math.random() > 0.3 ? rand(allStudents) : null

    if (item.stock >= qty) {
      await db.sale.create({
        data: {
          itemId: item.id,
          studentId: student?.id ?? null,
          quantity: qty,
          unitPrice: item.price,
          amount: item.price * qty,
          date: daysAgo(randInt(0, 60)),
        },
      })
      item.stock -= qty
      salesCount++
    }
  }
  console.log(`✅ ${salesCount} ventes créées`)

  // ── Deposits (in BIF) ───────────────────────────────────────────────────────
  const depositSources = ['Collecte de frais', 'Subvention gouvernementale', 'Don', 'Événement sportif', 'Fonds annuel']
  for (let i = 0; i < 15; i++) {
    await db.deposit.create({
      data: {
        date: daysAgo(randInt(0, 90)),
        amount: randInt(500000, 5000000),
        source: rand(depositSources),
        bankName: rand(['Banque de Crédit de Bujumbura', 'Ecobank Burundi', 'Banque Commerciale du Burundi']),
        reference: `DEP-${randInt(10000, 99999)}`,
      },
    })
  }
  console.log('✅ Dépôts bancaires créés')

  // ── Expenses (in BIF) ───────────────────────────────────────────────────────
  const expenseData = [
    { category: 'Salaires', min: 2000000, max: 5000000 },
    { category: 'Services publics', min: 200000, max: 800000 },
    { category: 'Maintenance', min: 100000, max: 600000 },
    { category: 'Fournitures', min: 50000, max: 300000 },
    { category: 'Équipements', min: 500000, max: 3000000 },
    { category: 'Alimentation', min: 100000, max: 500000 },
    { category: 'Transport', min: 150000, max: 700000 },
  ]
  for (let i = 0; i < 25; i++) {
    const cat = rand(expenseData)
    await db.expense.create({
      data: {
        date: daysAgo(randInt(0, 90)),
        amount: randInt(cat.min, cat.max),
        category: cat.category,
        description: `Dépense — ${cat.category}`,
        payee: rand(['Fournisseur Local', 'Régie des Services', 'Prestataire Tech', 'Fournitures Scolaires SA']),
      },
    })
  }
  console.log('✅ Dépenses créées')

  // ── Staff Members ───────────────────────────────────────────────────────────
  const staffData = [
    { name: 'Jean-Baptiste Nkurunziza', role: 'Directeur adjoint', monthlySalary: 350000 },
    { name: 'Marie-Claire Ndayishimiye', role: 'Enseignante — Français', monthlySalary: 280000 },
    { name: 'André Hakizimana', role: 'Enseignant — Mathématiques', monthlySalary: 280000 },
    { name: 'Sophie Bizimana', role: 'Enseignante — Sciences', monthlySalary: 280000 },
    { name: 'Pierre Ntahompagaze', role: 'Agent administratif', monthlySalary: 220000 },
    { name: 'Céline Niyonzima', role: 'Comptable', monthlySalary: 260000 },
  ]

  const staffMembers = await Promise.all(
    staffData.map(s => db.staffMember.create({ data: s }))
  )
  console.log(`✅ ${staffMembers.length} membres du personnel créés`)

  console.log('\n🎉 Base de données initialisée avec succès !')
  console.log(`   Classes: ${classes.length}`)
  console.log(`   Élèves: ${allStudents.length}`)
  console.log(`   Paiements: ${paymentCount}`)
  console.log(`   Ventes: ${salesCount}`)
  console.log(`   Personnel: ${staffMembers.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
