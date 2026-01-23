const Database = require('../src/database');
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
    const Payment = db.getModel('Payment'); // ← Добавляем модель платежей
    
    // 1. Получаем существующие данные для создания платежей
    console.log('Fetching existing data for payments...');
    const existingSubscriptions = await Subscription.findAll({
      include: [
        {
          model: db.getModel('Portal'),
          as: 'portal'
        },
        {
          model: db.getModel('Tariff'),
          as: 'tariff'
        }
      ],
      limit: 20 // Берем первые 20 подписок для демо
    });
    
    const existingPortals = await Portal.findAll({ limit: 5 });
    const existingTariffs = await Tariff.findAll({ limit: 10 });
    
    // 2. Создаем демо-платежи
    console.log('Creating demo payments...');
    const payments = [];
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    // Массив статусов платежей
    const paymentStatuses = ['completed', 'pending', 'failed', 'refunded'];
    const paymentMethods = ['bank_card', 'sbp', 'yookassa', 'cloudpayments', 'tinkoff'];
    
    // Создаем по несколько платежей для каждой подписки
    for (const subscription of existingSubscriptions) {
      // Определяем количество платежей для этой подписки (1-3)
      const numPayments = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numPayments; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // От 0 до 30 дней назад
        const paymentDate = new Date(oneMonthAgo);
        paymentDate.setDate(paymentDate.getDate() + daysAgo);
        
        // Определяем сумму платежа (обычно цена тарифа)
        const amount = subscription.tariff ? subscription.tariff.price : 
                      (Math.floor(Math.random() * 5) + 1) * 1000; // 1000-5000 если нет тарифа
        
        const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        const paymentData = {
          subscription_id: subscription.id,
          external_id: `ext_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount,
          status: status,
          payment_method: method,
          description: `Оплата подписки ${subscription.portal?.company_name || subscription.portal?.b24_domain || 'Портал'}`,
          metadata: {
            subscription_status: subscription.status,
            portal_id: subscription.portal_id,
            tariff_price: subscription.tariff?.price || 0,
            created_via: 'demo_seeder'
          },
          created_at: paymentDate,
          updated_at: paymentDate
        };
        
        // Для возвращенных платежей добавляем дату возврата
        if (status === 'refunded') {
          const refundDate = new Date(paymentDate);
          refundDate.setDate(refundDate.getDate() + Math.floor(Math.random() * 7) + 1);
          paymentData.refund_date = refundDate;
          paymentData.refund_reason = 'По запросу клиента';
        }
        
        // Для успешных платежей - добавляем детали
        if (status === 'completed') {
          paymentData.metadata.payment_details = {
            card_last4: Math.floor(Math.random() * 9000) + 1000,
            auth_code: `AUTH${Math.floor(Math.random() * 1000000)}`,
            provider_transaction_id: `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`
          };
        }
        
        // Для неудачных платежей - добавляем причину
        if (status === 'failed') {
          paymentData.metadata.failure_reason = ['Недостаточно средств', 'Карта заблокирована', 'Превышен лимит'][Math.floor(Math.random() * 3)];
        }
        
        try {
          const payment = await Payment.create(paymentData);
          payments.push(payment);
          console.log(`Created payment ${payments.length}: ${amount} RUB - ${status}`);
        } catch (error) {
          console.warn(`Failed to create payment for subscription ${subscription.id}:`, error.message);
        }
      }
    }
    
    // 3. Создаем несколько разовых платежей без подписки (например, тестовые)
    console.log('Creating standalone demo payments...');
    for (let i = 0; i < 5; i++) {
      const portal = existingPortals[Math.floor(Math.random() * existingPortals.length)];
      const tariff = existingTariffs[Math.floor(Math.random() * existingTariffs.length)];
      
      const paymentDate = new Date(now);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 15));
      
      const paymentData = {
        subscription_id: null,
        external_id: `standalone_${Date.now()}_${i}`,
        amount: tariff ? tariff.price : 1990,
        status: 'completed',
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        description: `Тестовый платеж для ${portal?.company_name || 'портала'}`,
        metadata: {
          portal_id: portal?.id,
          is_test: true,
          created_via: 'demo_seeder_standalone'
        },
        created_at: paymentDate,
        updated_at: paymentDate
      };
      
      try {
        const payment = await Payment.create(paymentData);
        payments.push(payment);
        console.log(`Created standalone payment: ${paymentData.amount} RUB`);
      } catch (error) {
        console.warn(`Failed to create standalone payment:`, error.message);
      }
    }
    
    // 4. Создаем платежи для разных статусов для демонстрации фильтров
    console.log('Creating payments for filter demonstration...');
    const filterDemoPayments = [
      {
        amount: 2990,
        status: 'pending',
        description: 'Платеж в обработке',
        payment_method: 'bank_card',
        created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      },
      {
        amount: 4990,
        status: 'failed',
        description: 'Ошибка оплаты',
        payment_method: 'sbp',
        created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
      },
      {
        amount: 3990,
        status: 'refunded',
        description: 'Возврат средств',
        payment_method: 'yookassa',
        created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      },
      {
        amount: 5990,
        status: 'canceled',
        description: 'Отмененный платеж',
        payment_method: 'tinkoff',
        created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)
      }
    ];
    
    for (const demoPayment of filterDemoPayments) {
      const subscription = existingSubscriptions[Math.floor(Math.random() * existingSubscriptions.length)];
      
      const paymentData = {
        subscription_id: subscription?.id || null,
        external_id: `demo_filter_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        amount: demoPayment.amount,
        status: demoPayment.status,
        payment_method: demoPayment.payment_method,
        description: demoPayment.description,
        metadata: {
          is_demo: true,
          filter_example: true,
          created_via: 'demo_seeder_filter'
        },
        created_at: demoPayment.created_at,
        updated_at: demoPayment.created_at
      };
      
      try {
        const payment = await Payment.create(paymentData);
        payments.push(payment);
        console.log(`Created filter demo payment: ${demoPayment.status} - ${demoPayment.amount} RUB`);
      } catch (error) {
        console.warn(`Failed to create filter demo payment:`, error.message);
      }
    }
    
    console.log(`\n✅ Created ${payments.length} demo payments`);
    
    // 5. Статистика по созданным платежам
    const statusCount = {};
    const methodCount = {};
    
    for (const payment of payments) {
      statusCount[payment.status] = (statusCount[payment.status] || 0) + 1;
      methodCount[payment.payment_method] = (methodCount[payment.payment_method] || 0) + 1;
    }
    
    console.log('\n📊 Payment statistics:');
    console.log('Statuses:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} payments`);
    });
    
    console.log('\nPayment methods:');
    Object.entries(methodCount).forEach(([method, count]) => {
      console.log(`  - ${method}: ${count} payments`);
    });
    
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    console.log(`\n💰 Total amount: ${totalAmount.toLocaleString('ru-RU')} RUB`);
    
    console.log('\n✅ Demo payments seeded successfully!');
    
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