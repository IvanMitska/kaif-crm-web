import { PrismaClient, UserRole, ContactSource, TaskPriority, TaskStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем администратора
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kaifcrm.ru' },
    update: {},
    create: {
      email: 'admin@kaifcrm.ru',
      password: adminPassword,
      firstName: 'Админ',
      lastName: 'Системы',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Создан администратор:', admin.email);

  // Создаем менеджера
  const managerPassword = await argon2.hash('manager123');
  const manager = await prisma.user.upsert({
    where: { email: 'manager@kaifcrm.ru' },
    update: {},
    create: {
      email: 'manager@kaifcrm.ru',
      password: managerPassword,
      firstName: 'Иван',
      lastName: 'Менеджеров',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  console.log('✅ Создан менеджер:', manager.email);

  // Создаем теги
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'VIP' },
      update: {},
      create: { name: 'VIP', color: '#FFD700' },
    }),
    prisma.tag.upsert({
      where: { name: 'Новый' },
      update: {},
      create: { name: 'Новый', color: '#10B981' },
    }),
    prisma.tag.upsert({
      where: { name: 'Важный' },
      update: {},
      create: { name: 'Важный', color: '#EF4444' },
    }),
  ]);

  console.log('✅ Создано тегов:', tags.length);

  // Создаем дефолтную воронку продаж
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Основная воронка',
      description: 'Воронка продаж по умолчанию',
      isDefault: true,
      stages: {
        create: [
          { name: 'Первичный контакт', color: '#3B82F6', order: 0 },
          { name: 'Квалификация', color: '#8B5CF6', order: 1 },
          { name: 'Предложение', color: '#EC4899', order: 2 },
          { name: 'Переговоры', color: '#F59E0B', order: 3 },
          { name: 'Договор', color: '#10B981', order: 4 },
          { name: 'Оплата', color: '#06B6D4', order: 5 },
          { name: 'Успешно', color: '#22C55E', order: 6 },
        ],
      },
    },
    include: { stages: true },
  });

  console.log('✅ Создана воронка с', pipeline.stages.length, 'этапами');

  // Создаем тестовые компании
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'ООО "Технологии Будущего"',
        inn: '7701234567',
        email: 'info@techfuture.ru',
        phone: '+74951234567',
        website: 'https://techfuture.ru',
        industry: 'IT',
        size: '50-100',
        ownerId: manager.id,
        createdById: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: 'АО "Инновации"',
        inn: '7702345678',
        email: 'contact@innovations.ru',
        phone: '+74952345678',
        industry: 'Производство',
        size: '100-500',
        ownerId: manager.id,
        createdById: admin.id,
      },
    }),
  ]);

  console.log('✅ Создано компаний:', companies.length);

  // Создаем тестовые контакты
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'Петр',
        lastName: 'Петров',
        email: 'petrov@techfuture.ru',
        phone: '+79161234567',
        position: 'Генеральный директор',
        source: ContactSource.WEBSITE,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
        tags: {
          connect: [{ id: tags[0].id }], // VIP
        },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Мария',
        lastName: 'Иванова',
        email: 'ivanova@innovations.ru',
        phone: '+79162345678',
        position: 'Менеджер по закупкам',
        source: ContactSource.REFERRAL,
        companyId: companies[1].id,
        ownerId: manager.id,
        createdById: manager.id,
        tags: {
          connect: [{ id: tags[1].id }], // Новый
        },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Алексей',
        lastName: 'Сидоров',
        email: 'sidorov@example.com',
        phone: '+79163456789',
        position: 'IT директор',
        source: ContactSource.EMAIL,
        ownerId: manager.id,
        createdById: manager.id,
      },
    }),
  ]);

  console.log('✅ Создано контактов:', contacts.length);

  // Создаем тестовые сделки
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Внедрение CRM системы',
        amount: 500000,
        currency: 'RUB',
        probability: 70,
        expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
        description: 'Внедрение CRM системы для автоматизации продаж',
        stageId: pipeline.stages[2].id, // Предложение
        contactId: contacts[0].id,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Поставка оборудования',
        amount: 750000,
        currency: 'RUB',
        probability: 50,
        expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // +45 дней
        stageId: pipeline.stages[1].id, // Квалификация
        contactId: contacts[1].id,
        companyId: companies[1].id,
        ownerId: manager.id,
        createdById: manager.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Консалтинговые услуги',
        amount: 300000,
        currency: 'RUB',
        probability: 90,
        expectedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 дней
        stageId: pipeline.stages[4].id, // Договор
        contactId: contacts[2].id,
        ownerId: manager.id,
        createdById: manager.id,
      },
    }),
  ]);

  console.log('✅ Создано сделок:', deals.length);

  // Создаем тестовые задачи
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Позвонить клиенту по поводу предложения',
        description: 'Обсудить детали коммерческого предложения',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 дня
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        assigneeId: manager.id,
        createdById: admin.id,
        contactId: contacts[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Подготовить презентацию',
        description: 'Подготовить презентацию для встречи с клиентом',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 дней
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: manager.id,
        createdById: manager.id,
        dealId: deals[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Отправить договор на согласование',
        description: 'Отправить финальную версию договора клиенту',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 день
        priority: TaskPriority.URGENT,
        status: TaskStatus.PENDING,
        assigneeId: manager.id,
        createdById: admin.id,
        contactId: contacts[2].id,
        dealId: deals[2].id,
      },
    }),
  ]);

  console.log('✅ Создано задач:', tasks.length);

  // Создаем активности
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: 'contact_created',
        description: 'Контакт создан',
        userId: manager.id,
        contactId: contacts[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'deal_created',
        description: 'Сделка создана',
        userId: manager.id,
        dealId: deals[0].id,
      },
    }),
  ]);

  console.log('✅ Создано активностей:', activities.length);

  console.log('🎉 База данных успешно заполнена!');
  console.log('\n📋 Данные для входа:');
  console.log('Администратор: admin@kaifcrm.ru / admin123');
  console.log('Менеджер: manager@kaifcrm.ru / manager123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });