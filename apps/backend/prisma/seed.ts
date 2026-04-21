import {
  PrismaClient,
  UserRole,
  OrgRole,
  ContactSource,
  TaskPriority,
  TaskStatus,
  LeadSource,
  LeadStatus,
  BookingStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data (Thailand)...');

  // ── Пользователи ──
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sintara-crm.com' },
    update: { firstName: 'Somchai', lastName: 'Prasert' },
    create: {
      email: 'admin@sintara-crm.com',
      password: adminPassword,
      firstName: 'Somchai',
      lastName: 'Prasert',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const managerPassword = await argon2.hash('manager123');
  const manager = await prisma.user.upsert({
    where: { email: 'manager@sintara-crm.com' },
    update: { firstName: 'Niran', lastName: 'Wongsiri' },
    create: {
      email: 'manager@sintara-crm.com',
      password: managerPassword,
      firstName: 'Niran',
      lastName: 'Wongsiri',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  // ── Демо-организация ──
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    update: { name: 'Sintara Thailand', currency: 'THB' },
    create: {
      name: 'Sintara Thailand',
      slug: 'demo-organization',
      currency: 'THB',
    },
  });

  // ── Очистка существующих демо-данных ──
  // Порядок учитывает внешние ключи; каскады подчистят остальное
  await prisma.activity.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.message.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.task.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.dealProduct.deleteMany({ where: { deal: { organizationId: demoOrg.id } } });
  await prisma.deal.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.waitingListItem.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.booking.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.resourceService.deleteMany({
    where: { resource: { organizationId: demoOrg.id } },
  });
  await prisma.service.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.resource.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.lead.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.contact.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.company.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.tag.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.automation.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.stage.deleteMany({ where: { pipeline: { organizationId: demoOrg.id } } });
  await prisma.pipeline.deleteMany({ where: { organizationId: demoOrg.id } });
  console.log('🧹 Existing demo data cleared');

  // ── Членство в организации ──
  await prisma.orgMember.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: demoOrg.id } },
    update: {},
    create: {
      userId: admin.id,
      organizationId: demoOrg.id,
      role: OrgRole.OWNER,
      isActive: true,
    },
  });
  await prisma.orgMember.upsert({
    where: { userId_organizationId: { userId: manager.id, organizationId: demoOrg.id } },
    update: {},
    create: {
      userId: manager.id,
      organizationId: demoOrg.id,
      role: OrgRole.MANAGER,
      isActive: true,
    },
  });

  // ── Теги ──
  const [tagVip, tagNew, tagImportant, tagPartner] = await Promise.all([
    prisma.tag.create({ data: { name: 'VIP', color: '#FFD700', organizationId: demoOrg.id } }),
    prisma.tag.create({ data: { name: 'New', color: '#10B981', organizationId: demoOrg.id } }),
    prisma.tag.create({ data: { name: 'Priority', color: '#EF4444', organizationId: demoOrg.id } }),
    prisma.tag.create({ data: { name: 'Partner', color: '#3B82F6', organizationId: demoOrg.id } }),
  ]);

  // ── Воронка продаж ──
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Main pipeline',
      description: 'Default sales pipeline',
      isDefault: true,
      organizationId: demoOrg.id,
      stages: {
        create: [
          { name: 'Lead in', color: '#3B82F6', order: 0 },
          { name: 'Qualification', color: '#8B5CF6', order: 1 },
          { name: 'Proposal', color: '#EC4899', order: 2 },
          { name: 'Negotiation', color: '#F59E0B', order: 3 },
          { name: 'Contract', color: '#10B981', order: 4 },
          { name: 'Payment', color: '#06B6D4', order: 5 },
          { name: 'Won', color: '#22C55E', order: 6 },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  const stages = pipeline.stages;

  // ── Компании ──
  const orgId = demoOrg.id;

  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Siam Tech Co., Ltd.',
        inn: '0105556000111',
        email: 'info@siamtech.co.th',
        phone: '+6621234567',
        website: 'https://siamtech.co.th',
        industry: 'IT',
        size: '50-100',
        address: '123 Sukhumvit Road, Watthana, Bangkok 10110',
        description: 'Enterprise software development and integration',
        ownerId: manager.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Bangkok Innovations PCL',
        inn: '0107562000234',
        email: 'contact@bkkinno.co.th',
        phone: '+6622345678',
        industry: 'Manufacturing',
        size: '100-500',
        address: '88 Silom Road, Bang Rak, Bangkok 10500',
        description: 'Industrial equipment manufacturing',
        ownerId: manager.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Phuket Beauty & Wellness',
        inn: '0835556000345',
        email: 'hello@phuketbeauty.com',
        phone: '+6676345678',
        website: 'https://phuketbeauty.com',
        industry: 'Beauty & Wellness',
        size: '10-50',
        address: '45 Rat-U-Thit Road, Patong, Phuket 83150',
        description: 'Chain of premium spa & beauty studios',
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.company.create({
      data: {
        name: 'ThaiLogistic Express',
        inn: '0505557000456',
        email: 'info@thailogistic.co.th',
        phone: '+6653456789',
        website: 'https://thailogistic.co.th',
        industry: 'Logistics',
        size: '50-100',
        address: '77 Nimmanhaemin Road, Suthep, Chiang Mai 50200',
        description: 'Nationwide delivery and warehousing',
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Pattaya Financial Advisors',
        inn: '0205558000567',
        email: 'hello@pattayafin.co.th',
        phone: '+6638567890',
        industry: 'Finance',
        size: '10-50',
        address: '200 Beach Road, Bang Lamung, Chonburi 20150',
        description: 'Accounting and audit services',
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Companies:', companies.length);

  // ── Контакты ──
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'Somsak',
        lastName: 'Chaiyakul',
        email: 'somsak@siamtech.co.th',
        phone: '+66812345001',
        position: 'CEO',
        source: ContactSource.WEBSITE,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagVip.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Ploy',
        lastName: 'Srisawat',
        email: 'ploy@bkkinno.co.th',
        phone: '+66812345002',
        position: 'Procurement Manager',
        source: ContactSource.REFERRAL,
        companyId: companies[1].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagNew.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james@siamtech.co.th',
        phone: '+66812345003',
        position: 'CTO',
        source: ContactSource.EMAIL,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagImportant.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Anong',
        lastName: 'Pongsri',
        email: 'anong@phuketbeauty.com',
        phone: '+66812345004',
        position: 'Owner',
        source: ContactSource.PHONE,
        companyId: companies[2].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagVip.id }, { id: tagPartner.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Niran',
        lastName: 'Thongchai',
        email: 'niran@thailogistic.co.th',
        phone: '+66812345005',
        position: 'Commercial Director',
        source: ContactSource.WHATSAPP,
        companyId: companies[3].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Pranee',
        lastName: 'Sukkasem',
        email: 'pranee@pattayafin.co.th',
        phone: '+66812345006',
        position: 'Chief Accountant',
        source: ContactSource.TELEGRAM,
        companyId: companies[4].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagPartner.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Kittisak',
        lastName: 'Boonmee',
        email: 'kittisak@gmail.com',
        phone: '+66812345007',
        position: 'Freelance Designer',
        source: ContactSource.INSTAGRAM,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
        tags: { connect: [{ id: tagNew.id }] },
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Malee',
        lastName: 'Chaiyo',
        email: 'malee@bkkinno.co.th',
        phone: '+66812345008',
        position: 'HR Director',
        source: ContactSource.REFERRAL,
        companyId: companies[1].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Contacts:', contacts.length);

  // ── Сделки ──
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'CRM implementation',
        amount: 250000,
        currency: 'THB',
        probability: 70,
        expectedDate: new Date(now + 30 * day),
        description: 'CRM rollout for sales automation at Siam Tech',
        stageId: stages[2].id,
        contactId: contacts[0].id,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Industrial equipment supply',
        amount: 450000,
        currency: 'THB',
        probability: 50,
        expectedDate: new Date(now + 45 * day),
        stageId: stages[1].id,
        contactId: contacts[1].id,
        companyId: companies[1].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Consulting retainer',
        amount: 180000,
        currency: 'THB',
        probability: 90,
        expectedDate: new Date(now + 15 * day),
        stageId: stages[4].id,
        contactId: contacts[2].id,
        companyId: companies[0].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Annual service contract',
        amount: 720000,
        currency: 'THB',
        probability: 30,
        expectedDate: new Date(now + 60 * day),
        stageId: stages[0].id,
        contactId: contacts[3].id,
        companyId: companies[2].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Mobile app development',
        amount: 1500000,
        currency: 'THB',
        probability: 60,
        expectedDate: new Date(now + 90 * day),
        description: 'iOS & Android delivery tracking app',
        stageId: stages[3].id,
        contactId: contacts[4].id,
        companyId: companies[3].id,
        ownerId: manager.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Accounting automation',
        amount: 95000,
        currency: 'THB',
        probability: 80,
        expectedDate: new Date(now + 10 * day),
        stageId: stages[5].id,
        contactId: contacts[5].id,
        companyId: companies[4].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Brand identity design',
        amount: 55000,
        currency: 'THB',
        probability: 40,
        expectedDate: new Date(now + 20 * day),
        stageId: stages[1].id,
        contactId: contacts[6].id,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Staff training program',
        amount: 85000,
        currency: 'THB',
        probability: 95,
        expectedDate: new Date(now + 5 * day),
        stageId: stages[6].id,
        contactId: contacts[7].id,
        companyId: companies[1].id,
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Deals:', deals.length);

  // ── Задачи ──
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Call Somsak about the proposal',
        description: 'Walk through pricing and timeline for Siam Tech CRM',
        dueDate: new Date(now + 1 * day),
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        assigneeId: manager.id,
        createdById: admin.id,
        contactId: contacts[0].id,
        dealId: deals[0].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Prepare presentation for Bangkok Innovations',
        description: 'Slides with equipment specs and delivery timeline',
        dueDate: new Date(now + 3 * day),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: manager.id,
        createdById: manager.id,
        dealId: deals[1].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Send contract for signing',
        description: 'Final consulting retainer contract',
        dueDate: new Date(now + 0.5 * day),
        priority: TaskPriority.URGENT,
        status: TaskStatus.PENDING,
        assigneeId: manager.id,
        createdById: admin.id,
        contactId: contacts[2].id,
        dealId: deals[2].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Run product demo for Anong',
        description: 'Online demo of CRM for Phuket Beauty',
        dueDate: new Date(now + 2 * day),
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        assigneeId: admin.id,
        createdById: admin.id,
        contactId: contacts[3].id,
        dealId: deals[3].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Draft mobile app specification',
        description: 'Requirements doc based on client brief',
        dueDate: new Date(now + 7 * day),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: manager.id,
        createdById: admin.id,
        dealId: deals[4].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Issue invoice for training',
        description: 'Training program invoice for Bangkok Innovations',
        dueDate: new Date(now - 1 * day),
        priority: TaskPriority.LOW,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(now - 0.5 * day),
        assigneeId: admin.id,
        createdById: admin.id,
        contactId: contacts[7].id,
        dealId: deals[7].id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Refresh contact database',
        description: 'Verify phones and emails for all contacts',
        dueDate: new Date(now + 5 * day),
        priority: TaskPriority.LOW,
        status: TaskStatus.PENDING,
        assigneeId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Monthly sales report',
        description: 'Sales report for management review',
        dueDate: new Date(now + 2 * day),
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        assigneeId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Tasks:', tasks.length);

  // ── Лиды ──
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: 'Website enquiry — warehouse automation',
        email: 'warehouse@example.co.th',
        phone: '+66870001122',
        company: 'Chiang Rai Storage Co.',
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        description: 'Looking for warehouse management integration',
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Incoming call — accounting integration',
        phone: '+66870002233',
        company: 'SME Accounting Group',
        source: LeadSource.CALL,
        status: LeadStatus.IN_PROGRESS,
        description: 'Needs CRM ↔ accounting integration',
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Telegram — pricing question',
        email: 'prospect.tg@example.com',
        source: LeadSource.TELEGRAM,
        status: LeadStatus.NEW,
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Referral from Anong — Spa Luxury',
        email: 'contact@spaluxury.co.th',
        phone: '+66870004455',
        company: 'Spa Luxury Phuket',
        source: LeadSource.REFERRAL,
        status: LeadStatus.QUALIFIED,
        description: 'Referred by Phuket Beauty, spa chain',
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'WhatsApp — demo request',
        phone: '+66870005566',
        source: LeadSource.WHATSAPP,
        status: LeadStatus.IN_PROGRESS,
        description: 'Wants a live demo for their sales team',
        ownerId: manager.id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Email — enterprise licence',
        email: 'procurement@asiacorp.com',
        company: 'AsiaCorp International',
        source: LeadSource.EMAIL,
        status: LeadStatus.NEW,
        description: 'Enterprise licence request for 200+ users',
        ownerId: admin.id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Leads:', leads.length);

  // ── Активности ──
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'deal_created',
        description: 'Deal "CRM implementation" created',
        userId: manager.id,
        dealId: deals[0].id,
        organizationId: orgId,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'contact_created',
        description: 'Contact Somsak Chaiyakul added',
        userId: manager.id,
        contactId: contacts[0].id,
        organizationId: orgId,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'task_completed',
        description: 'Task "Issue invoice for training" completed',
        userId: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'deal_stage_changed',
        description: 'Deal "Accounting automation" moved to Payment',
        userId: admin.id,
        dealId: deals[5].id,
        organizationId: orgId,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'contact_created',
        description: 'Contact Anong Pongsri added',
        userId: admin.id,
        contactId: contacts[3].id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Activities: 5');

  // ── Сообщения ──
  await Promise.all([
    prisma.message.create({
      data: {
        channel: 'whatsapp',
        direction: 'inbound',
        content: 'Sawadee krub! Any update on our CRM deal?',
        contactId: contacts[0].id,
        userId: manager.id,
        organizationId: orgId,
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        channel: 'whatsapp',
        direction: 'outbound',
        content: 'Hi Somsak, proposal is ready — sending it over today.',
        contactId: contacts[0].id,
        userId: manager.id,
        organizationId: orgId,
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        channel: 'email',
        direction: 'inbound',
        content: 'Please send an updated quote with a 10% discount.',
        contactId: contacts[1].id,
        userId: manager.id,
        organizationId: orgId,
        isRead: false,
      },
    }),
    prisma.message.create({
      data: {
        channel: 'whatsapp',
        direction: 'inbound',
        content: 'When can we schedule a demo?',
        contactId: contacts[3].id,
        userId: admin.id,
        organizationId: orgId,
        isRead: false,
      },
    }),
    prisma.message.create({
      data: {
        channel: 'email',
        direction: 'outbound',
        content: 'Hi Anong! Would Thursday 14:00 work for the demo?',
        contactId: contacts[3].id,
        userId: admin.id,
        organizationId: orgId,
        isRead: true,
      },
    }),
  ]);
  console.log('✅ Messages: 5');

  // ── Booking: resources ──
  const resource1 = await prisma.resource.create({
    data: {
      name: 'Anong (Senior therapist)',
      type: 'SPECIALIST' as any,
      category: 'SERVICES' as any,
      color: '#EC4899',
      description: 'Thai massage & facial specialist',
      slotDuration: 60,
      workingHours: {
        mon: { start: '10:00', end: '19:00' },
        tue: { start: '10:00', end: '19:00' },
        wed: { start: '10:00', end: '19:00' },
        thu: { start: '10:00', end: '19:00' },
        fri: { start: '10:00', end: '19:00' },
        sat: { start: '10:00', end: '17:00' },
      },
      organizationId: orgId,
    },
  });
  const resource2 = await prisma.resource.create({
    data: {
      name: 'Consultation Room A',
      type: 'ROOM' as any,
      category: 'SERVICES' as any,
      color: '#3B82F6',
      description: 'Main consultation room, 20m²',
      slotDuration: 30,
      workingHours: {
        mon: { start: '09:00', end: '18:00' },
        tue: { start: '09:00', end: '18:00' },
        wed: { start: '09:00', end: '18:00' },
        thu: { start: '09:00', end: '18:00' },
        fri: { start: '09:00', end: '18:00' },
      },
      organizationId: orgId,
    },
  });

  // ── Booking: services ──
  const svc1 = await prisma.service.create({
    data: {
      name: 'Traditional Thai Massage (60 min)',
      description: 'Full-body traditional massage',
      duration: 60,
      price: 1200,
      currency: 'THB',
      color: '#EC4899',
      organizationId: orgId,
    },
  });
  const svc2 = await prisma.service.create({
    data: {
      name: 'Facial Treatment',
      description: 'Hydrating facial with serum',
      duration: 45,
      price: 1800,
      currency: 'THB',
      color: '#F59E0B',
      organizationId: orgId,
    },
  });
  const svc3 = await prisma.service.create({
    data: {
      name: 'Sales consultation',
      description: 'Free discovery call',
      duration: 30,
      price: 0,
      currency: 'THB',
      color: '#8B5CF6',
      organizationId: orgId,
    },
  });

  await Promise.all([
    prisma.resourceService.create({ data: { resourceId: resource1.id, serviceId: svc1.id } }),
    prisma.resourceService.create({ data: { resourceId: resource1.id, serviceId: svc2.id } }),
    prisma.resourceService.create({ data: { resourceId: resource2.id, serviceId: svc3.id } }),
  ]);

  // ── Bookings ──
  const bookingAt = (daysOffset: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  await Promise.all([
    prisma.booking.create({
      data: {
        title: 'Thai massage — Ploy',
        startTime: bookingAt(1, 11),
        endTime: bookingAt(1, 12),
        status: BookingStatus.CONFIRMED,
        resourceId: resource1.id,
        serviceId: svc1.id,
        contactId: contacts[1].id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
    prisma.booking.create({
      data: {
        title: 'Facial — Malee',
        startTime: bookingAt(2, 14),
        endTime: bookingAt(2, 15),
        status: BookingStatus.PENDING,
        resourceId: resource1.id,
        serviceId: svc2.id,
        contactId: contacts[7].id,
        createdById: manager.id,
        organizationId: orgId,
      },
    }),
    prisma.booking.create({
      data: {
        title: 'Discovery call — Kittisak',
        startTime: bookingAt(3, 10, 0),
        endTime: bookingAt(3, 10, 30),
        status: BookingStatus.CONFIRMED,
        resourceId: resource2.id,
        serviceId: svc3.id,
        contactId: contacts[6].id,
        createdById: admin.id,
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Booking: 2 resources, 3 services, 3 bookings');

  // ── Автоматизации ──
  await Promise.all([
    prisma.automation.create({
      data: {
        name: 'Follow-up task after new deal',
        description: 'Create a follow-up task 2 days after a deal is created',
        isActive: true,
        trigger: { type: 'deal_created' },
        actions: [
          {
            type: 'create_task',
            config: {
              taskTitle: 'Follow up with {{dealTitle}}',
              taskDescription: 'Initial follow-up after deal creation',
              taskDueDays: 2,
              taskPriority: 'MEDIUM',
              assignToOwner: true,
            },
          },
        ],
        organizationId: orgId,
      },
    }),
    prisma.automation.create({
      data: {
        name: 'Notify manager on new lead',
        description: 'Send a notification whenever a new lead appears',
        isActive: true,
        trigger: { type: 'lead_created' },
        actions: [
          {
            type: 'send_notification',
            config: {
              notificationTitle: 'New lead',
              notificationContent: 'A new lead has arrived: {{leadName}}',
              notifyOwner: true,
            },
          },
        ],
        organizationId: orgId,
      },
    }),
    prisma.automation.create({
      data: {
        name: 'Tag won deals',
        description: 'Automatically tag deals as VIP when they reach Won stage',
        isActive: false,
        trigger: { type: 'deal_won' },
        actions: [
          { type: 'add_tag', config: { tagId: tagVip.id } },
        ],
        organizationId: orgId,
      },
    }),
  ]);
  console.log('✅ Automations: 3');

  console.log('\n🎉 Database seeded!\n');
  console.log('📋 Credentials:');
  console.log('  Admin:    admin@sintara-crm.com / admin123');
  console.log('  Manager:  manager@sintara-crm.com / manager123');
  console.log('  Org:      Sintara Thailand (currency: THB)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
