import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
  'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Mason', 'Harper', 'Ethan', 'Evelyn', 'Daniel', 'Abigail',
  'Michael', 'Emily', 'Aiden', 'Elizabeth', 'Logan', 'Mila', 'Jackson', 'Ella', 'Sebastian', 'Avery',
  'Owen', 'Sofia', 'Liam', 'Camila', 'Noah', 'Aria', 'Elijah', 'Scarlett', 'Carter', 'Victoria']

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']

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
  console.log('🌱 Seeding database...')

  // Clear existing data
  await db.sale.deleteMany()
  await db.payment.deleteMany()
  await db.expense.deleteMany()
  await db.deposit.deleteMany()
  await db.feeStructure.deleteMany()
  await db.student.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.class.deleteMany()

  // Create 10 classes
  const classData = [
    { name: 'Grade 1A', section: 'A', gradeLevel: '1', capacity: 30 },
    { name: 'Grade 1B', section: 'B', gradeLevel: '1', capacity: 30 },
    { name: 'Grade 2A', section: 'A', gradeLevel: '2', capacity: 35 },
    { name: 'Grade 2B', section: 'B', gradeLevel: '2', capacity: 35 },
    { name: 'Grade 3A', section: 'A', gradeLevel: '3', capacity: 35 },
    { name: 'Grade 4A', section: 'A', gradeLevel: '4', capacity: 40 },
    { name: 'Grade 5A', section: 'A', gradeLevel: '5', capacity: 40 },
    { name: 'Grade 6A', section: 'A', gradeLevel: '6', capacity: 40 },
    { name: 'Grade 7A', section: 'A', gradeLevel: '7', capacity: 35 },
    { name: 'Grade 8A', section: 'A', gradeLevel: '8', capacity: 35 },
  ]

  const classes = await Promise.all(
    classData.map(d => db.class.create({ data: d }))
  )
  console.log(`✅ Created ${classes.length} classes`)

  // Fee structures per class
  const feeAmounts = [150, 150, 175, 175, 200, 225, 250, 275, 300, 325]
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i]
    const base = feeAmounts[i]
    await db.feeStructure.createMany({
      data: [
        { classId: cls.id, name: 'Monthly Tuition', amount: base, period: 'monthly' },
        { classId: cls.id, name: 'Activity Fee', amount: 25, period: 'monthly' },
        { classId: cls.id, name: 'Annual Registration', amount: 200, period: 'annual' },
      ],
    })
  }
  console.log('✅ Created fee structures')

  // Create 155 students (15-17 per class)
  let rollCounter = 1001
  const allStudents: { id: string }[] = []

  for (const cls of classes) {
    const count = randInt(14, 17)
    for (let i = 0; i < count; i++) {
      const first = rand(firstNames)
      const last = rand(lastNames)
      const parentFirst = rand(firstNames)
      const s = await db.student.create({
        data: {
          name: `${first} ${last}`,
          rollNumber: String(rollCounter++),
          classId: cls.id,
          gender: Math.random() > 0.5 ? 'male' : 'female',
          parentName: `${parentFirst} ${last}`,
          parentPhone: `+1 ${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
          parentEmail: `${parentFirst.toLowerCase()}.${last.toLowerCase()}@email.com`,
          address: `${randInt(1, 999)} ${rand(['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'])} ${rand(['St', 'Ave', 'Blvd', 'Dr'])}`,
          isActive: Math.random() > 0.05,
        },
      })
      allStudents.push(s)
    }
  }
  console.log(`✅ Created ${allStudents.length} students`)

  // Create payments for students (last 90 days)
  let paymentCount = 0
  for (const s of allStudents) {
    const numPayments = randInt(1, 5)
    for (let i = 0; i < numPayments; i++) {
      const methods = ['cash', 'bank transfer', 'check', 'online']
      await db.payment.create({
        data: {
          studentId: s.id,
          amount: randInt(100, 400),
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
  console.log(`✅ Created ${paymentCount} payments`)

  // Inventory items
  const inventoryItems = await db.inventoryItem.createManyAndReturn({
    data: [
      { name: 'School Shirt (S)', type: 'uniform', price: 18, stock: 150 },
      { name: 'School Shirt (M)', type: 'uniform', price: 18, stock: 120 },
      { name: 'School Shirt (L)', type: 'uniform', price: 18, stock: 80 },
      { name: 'School Trousers (S)', type: 'uniform', price: 25, stock: 100 },
      { name: 'School Trousers (M)', type: 'uniform', price: 25, stock: 90 },
      { name: 'School Jacket', type: 'uniform', price: 45, stock: 60 },
      { name: 'School Tie', type: 'uniform', price: 12, stock: 200 },
      { name: 'PE Kit', type: 'uniform', price: 35, stock: 75 },
      { name: 'Mathematics Textbook Gr.1-3', type: 'book', price: 22, stock: 80 },
      { name: 'English Textbook Gr.1-3', type: 'book', price: 20, stock: 80 },
      { name: 'Science Textbook Gr.4-6', type: 'book', price: 28, stock: 60 },
      { name: 'History Textbook Gr.4-6', type: 'book', price: 24, stock: 55 },
      { name: 'Mathematics Workbook', type: 'book', price: 15, stock: 100 },
      { name: 'English Workbook', type: 'book', price: 14, stock: 100 },
      { name: 'School Bag', type: 'other', price: 35, stock: 50 },
      { name: 'Water Bottle', type: 'other', price: 8, stock: 120 },
    ],
  })
  console.log(`✅ Created ${inventoryItems.length} inventory items`)

  // Sales (last 60 days)
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
      // Update stock in memory for next iteration (not in DB for seeding speed)
      item.stock -= qty
      salesCount++
    }
  }
  console.log(`✅ Created ${salesCount} sales`)

  // Bank deposits
  const depositSources = ['Fee Collection', 'Government Grant', 'Donation', 'Sports Event', 'Annual Fund']
  for (let i = 0; i < 15; i++) {
    await db.deposit.create({
      data: {
        date: daysAgo(randInt(0, 90)),
        amount: randInt(500, 5000),
        source: rand(depositSources),
        bankName: rand(['First National Bank', 'City Bank', 'School Credit Union']),
        reference: `DEP-${randInt(10000, 99999)}`,
      },
    })
  }
  console.log('✅ Created deposits')

  // Expenses
  const expenseData = [
    { category: 'Salaries', min: 2000, max: 5000 },
    { category: 'Utilities', min: 200, max: 800 },
    { category: 'Maintenance', min: 100, max: 600 },
    { category: 'Supplies', min: 50, max: 300 },
    { category: 'Equipment', min: 500, max: 3000 },
    { category: 'Food', min: 100, max: 500 },
    { category: 'Transport', min: 150, max: 700 },
  ]
  for (let i = 0; i < 25; i++) {
    const cat = rand(expenseData)
    await db.expense.create({
      data: {
        date: daysAgo(randInt(0, 90)),
        amount: randInt(cat.min, cat.max),
        category: cat.category,
        description: `${cat.category} expense`,
        payee: rand(['Staff Payroll', 'City Utilities', 'Local Supplier', 'Tech Vendor', 'Vendor Co.']),
      },
    })
  }
  console.log('✅ Created expenses')

  console.log('\n🎉 Database seeded successfully!')
  console.log(`   Classes: ${classes.length}`)
  console.log(`   Students: ${allStudents.length}`)
  console.log(`   Payments: ${paymentCount}`)
  console.log(`   Sales: ${salesCount}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
