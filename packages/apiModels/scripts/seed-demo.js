const  Database  = require('../src/database');
require('dotenv').config();
async function seedDemoData() {
  let db;
  
  try {
    // Инициализируем базу данных
    db = new Database({
      database: process.env.DB_NAME || 'bitrix_admin',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306
    });
    
    await db.connect();
    console.log('Database connected for seeding demo data');
    
    // Получаем модели из db
    const Application = db.getModel('Application');
    const Tariff = db.getModel('Tariff');
    const Portal = db.getModel('Portal');
    const Subscription = db.getModel('Subscription');
    const AdminUser = db.getModel('AdminUser');
    
    // 1. Создаем демо-приложения
    console.log('Creating demo applications...');
    const apps = await Application.bulkCreate([
      {
        code: 'crm_automation',
        name: 'CRM Automation Pro',
        description: 'Расширенная автоматизация CRM процессов',
        version: '1.0.0',
        is_active: true,
        icon_url: 'https://example.com/icons/crm.svg'
      },
      {
        code: 'task_manager',
        name: 'Advanced Task Manager',
        description: 'Продвинутый менеджер задач для команд',
        version: '2.1.0',
        is_active: true,
        icon_url: 'https://example.com/icons/tasks.svg'
      },
      {
        code: 'analytics_dashboard',
        name: 'Business Analytics Dashboard',
        description: 'Панель аналитики бизнес-показателей',
        version: '1.5.0',
        is_active: true,
        icon_url: 'https://example.com/icons/analytics.svg'
      }
    ]);
    
    console.log(`Created ${apps.length} applications`);
    
    // 2. Создаем тарифы для каждого приложения
    console.log('Creating tariffs...');
    const tariffs = [];
    
    for (const app of apps) {
      const appTariffs = await Tariff.bulkCreate([
        {
          app_id: app.id,
          code: 'free',
          name: 'Бесплатный',
          description: 'Базовый функционал',
          price: 0,
          period: 'month',
          trial_days: 0,
          is_active: true,
          is_default: true,
          limits: { users: 3, projects: 1, storage_mb: 100 },
          features: ['basic_tasks', 'email_notifications'],
          sort_order: 1
        },
        {
          app_id: app.id,
          code: 'basic',
          name: 'Базовый',
          description: 'Для малых команд',
          price: 990,
          period: 'month',
          trial_days: 14,
          is_active: true,
          limits: { users: 10, projects: 5, storage_mb: 1024 },
          features: ['advanced_tasks', 'reports', 'api_access'],
          sort_order: 2
        },
        {
          app_id: app.id,
          code: 'pro',
          name: 'Профессиональный',
          description: 'Для средних и крупных команд',
          price: 2990,
          period: 'month',
          trial_days: 30,
          is_active: true,
          limits: { users: 50, projects: 50, storage_mb: 5120 },
          features: ['all_features', 'priority_support', 'custom_integrations'],
          sort_order: 3
        },
        {
          app_id: app.id,
          code: 'enterprise',
          name: 'Корпоративный',
          description: 'Индивидуальные решения',
          price: 9990,
          period: 'month',
          trial_days: 60,
          is_active: true,
          limits: { users: 999, projects: 999, storage_mb: 10240 },
          features: ['all_features', 'dedicated_support', 'custom_development'],
          sort_order: 4
        }
      ]);
      
      tariffs.push(...appTariffs);
    }
    
    console.log(`Created ${tariffs.length} tariffs`);
    
    // 3. Создаем демо-порталы
    console.log('Creating demo portals...');
    const portals = await Portal.bulkCreate([
      {
        b24_member_id: 'demo_portal_001',
        b24_domain: 'demo1.bitrix24.ru',
        company_name: 'ООО "Демо Компания 1"',
        admin_email: 'admin@demo1.ru',
        is_active: true
      },
      {
        b24_member_id: 'demo_portal_002',
        b24_domain: 'demo2.bitrix24.com',
        company_name: 'Demo Company 2 Inc.',
        admin_email: 'admin@demo2.com',
        is_active: true
      },
      {
        b24_member_id: 'demo_portal_003',
        b24_domain: 'startup.bitrix24.ru',
        company_name: 'Стартап "Инновации"',
        admin_email: 'ceo@startup.ru',
        is_active: true
      }
    ]);
    
    console.log(`Created ${portals.length} portals`);
    
    // 4. Создаем демо-подписки
    console.log('Creating demo subscriptions...');
    const subscriptions = [];
    const now = new Date();
    
    // Для каждого портала создаем подписки на разные приложения
    for (const portal of portals) {
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        const tariff = tariffs.find(t => t.app_id === app.id && t.code === (i === 0 ? 'pro' : 'basic'));
        
        if (tariff) {
          const validUntil = new Date(now);
          validUntil.setMonth(validUntil.getMonth() + 1);
          
          const subscription = await Subscription.create({
            portal_id: portal.id,
            app_id: app.id,
            tariff_id: tariff.id,
            status: i === 0 ? 'trial' : 'active',
            valid_from: now,
            valid_until: validUntil,
            auto_renew: true,
            trial_end_date: i === 0 ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null
          });
          
          subscriptions.push(subscription);
        }
      }
    }
    
    console.log(`Created ${subscriptions.length} subscriptions`);
    
    // 5. Создаем администраторов, если их нет
    const adminCount = await AdminUser.count();
    if (adminCount === 0) {
      console.log('Creating admin users...');
      await AdminUser.bulkCreate([
        {
          email: 'superadmin@example.com',
          password: 'superadmin123',
          name: 'Главный Администратор',
          role: 'superadmin'
        },
        {
          email: 'admin@example.com',
          password: 'admin123',
          name: 'Администратор Системы',
          role: 'admin'
        },
        {
          email: 'support@example.com',
          password: 'support123',
          name: 'Техподдержка',
          role: 'support'
        }
      ]);
      console.log('Created 3 admin users');
    }
    
    console.log('Demo data seeded successfully!');
    console.log('\n=== Демо-данные загружены ===');
    console.log('Администраторы:');
    console.log('- superadmin@example.com / superadmin123 (суперадмин)');
    console.log('- admin@example.com / admin123 (админ)');
    console.log('- support@example.com / support123 (поддержка)');
    console.log('\nПорталы:');
    portals.forEach(p => console.log(`- ${p.b24_domain} (${p.company_name})`));
    console.log('\nПриложения:');
    apps.forEach(a => console.log(`- ${a.name} (${a.code})`));
    console.log('\nТарифы:');
    tariffs.forEach(t => console.log(`- ${t.name} (${t.code}) - ${t.price} руб./мес`));
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    if (db) await db.close();
    process.exit(1);
  }
}

// Запускаем сиды
seedDemoData();