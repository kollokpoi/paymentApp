const { SUBSCRIPTION_STATUS, PERIOD_VALUES } = require("@payment-app/apiModels");
const ObjectUtils = require("../utils/ObjectUtils");

class SubscriptionAutoCheck {
    constructor(models) {
        this.Subscription = models.Subscription;
        this.Tariff = models.Tariff;
        this.Portal = models.Portal;
        this.isRunning = false;
        this.timeoutId = null;
        this.checkInterval = 1 * 60 * 1000; // 5 минут (исправил комментарий)
    }

    start() {
        if (this.isRunning) {
            console.log('Проверка подписок уже запущена');
            return;
        }

        this.isRunning = true;
        console.log('Запуск автоматической проверки подписок');

        this.runCheck();
        this.scheduleNextCheck();
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.isRunning = false;
        console.log('Автоматическая проверка остановлена');
    }

    scheduleNextCheck() {
        if (!this.isRunning) return;

        this.timeoutId = setTimeout(async () => {
            try {
                await this.runCheck();
            } catch (error) {
                console.error('❌ Ошибка в автоматической проверке:', error);
            } finally {
                this.scheduleNextCheck();
            }
        }, this.checkInterval);
    }

    async runCheck() {
        const startTime = Date.now();
        console.log(`[${new Date().toISOString()}] Запуск проверки подписок...`);

        try {
            const now = new Date();

            const subscriptions = await this.Subscription.findAll({
                where: {
                    status: [SUBSCRIPTION_STATUS.TRIAL, SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.SUSPENDED]
                },
                include: [
                    {
                        model: this.Tariff,
                        as: 'tariff',
                        required: true
                    },
                    {
                        model: this.Portal,
                        as: 'portal',
                        required: true
                    }
                ]
            });

            console.log(`Найдено ${subscriptions.length} подписок для обработки`);

            let processed = 0;
            for (const subscription of subscriptions) {
                await this.processSubscription(subscription, now);
                processed++;
            }

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Проверка завершена. Обработано: ${processed} подписок. Время: ${duration}ms`);
        } catch (error) {
            console.error('❌ Ошибка при проверке подписок:', error);
            throw error;
        }
    }

    async processSubscription(subscription, now) {
        const renewDate = new Date(now);
        renewDate.setDate(renewDate.getDate() + 1); // Завтра

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        try {
            if (subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
                await this.processTrialSubscription(subscription, now, tomorrow);
            }
            else if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
                await this.processActiveSubscription(subscription, now, tomorrow);
            }
            else if (subscription.status === SUBSCRIPTION_STATUS.SUSPENDED) {
                await this.processSuspendedSubscription(subscription, now, tomorrow);
            }

            // Обновляем лимиты для всех активных статусов
            if ([SUBSCRIPTION_STATUS.TRIAL, SUBSCRIPTION_STATUS.ACTIVE].includes(subscription.status)) {
                await this.updateSubscriptionLimits(subscription, now);
            }
        } catch (error) {
            console.error(`❌ Ошибка обработки подписки ${subscription.id}:`, error);
            // Продолжаем обработку других подписок
        }
    }

    async processTrialSubscription(subscription, now, tomorrow) {
        const tariff = subscription.tariff;
        const portal = subscription.portal;

        // Проверяем, закончился ли триальный период
        if (subscription.trial_end_date && subscription.trial_end_date < tomorrow) {
            if (subscription.auto_renew) {
                // Пытаемся перевести на платную подписку
                if (portal.balance >= tariff.price) {
                    await this.chargeAndRenewSubscription(subscription, portal, tariff, now);
                } else {
                    // Недостаточно средств - приостанавливаем
                    await subscription.update({
                        status: SUBSCRIPTION_STATUS.SUSPENDED,
                        valid_until: tomorrow
                    });
                    console.log(`📴 Подписка ${subscription.id} приостановлена (недостаточно средств после триала)`);
                }
            } else {
                // Автопродление выключено - приостанавливаем
                await subscription.update({
                    status: SUBSCRIPTION_STATUS.SUSPENDED,
                    valid_until: tomorrow
                });
                console.log(`📴 Подписка ${subscription.id} приостановлена (автопродление выключено после триала)`);
            }
        }
    }

    async processActiveSubscription(subscription, now, tomorrow) {
        const tariff = subscription.tariff;
        const portal = subscription.portal;

        // Проверяем, не истекла ли подписка
        if (subscription.valid_until < tomorrow) {
            if (subscription.auto_renew) {
                if (portal.balance >= tariff.price) {
                    await this.chargeAndRenewSubscription(subscription, portal, tariff, now);
                } else {
                    // Недостаточно средств - приостанавливаем
                    await subscription.update({
                        status: SUBSCRIPTION_STATUS.SUSPENDED,
                        valid_until: tomorrow
                    });
                    console.log(`📴 Подписка ${subscription.id} приостановлена (недостаточно средств)`);
                }
            } else {
                // Автопродление выключено - приостанавливаем
                await subscription.update({
                    status: SUBSCRIPTION_STATUS.SUSPENDED,
                    valid_until: tomorrow
                });
                console.log(`📴 Подписка ${subscription.id} приостановлена (автопродление выключено)`);
            }
        }
    }

    async processSuspendedSubscription(subscription, now, tomorrow) {
        const tariff = subscription.tariff;
        const portal = subscription.portal;

        // Проверяем, может быть пользователь пополнил баланс
        if (subscription.auto_renew && portal.balance >= tariff.price) {
            // Если есть деньги и включено автопродление - возобновляем
            await this.chargeAndRenewSubscription(subscription, portal, tariff, now);
            console.log(`✅ Подписка ${subscription.id} возобновлена после приостановки`);
        }
        // Если подписка приостановлена и прошло много времени (например, 30 дней), можно отменить
        else if (subscription.valid_until < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
            await subscription.update({
                status: SUBSCRIPTION_STATUS.CANCELLED
            });
            console.log(`🚫 Подписка ${subscription.id} отменена (длительная приостановка)`);
        }
    }

    async chargeAndRenewSubscription(subscription, portal, tariff, now) {
        // Списываем средства
        const newBalance = parseFloat(portal.balance) - parseFloat(tariff.price);
        await portal.update({
            balance: newBalance
        });

        // Обновляем подписку
        const newValidUntil = getDateByPeriod(now, tariff.period);
        await subscription.update({
            status: SUBSCRIPTION_STATUS.ACTIVE,
            used_limits: {}, // Сбрасываем лимиты на новый период
            valid_from: now,
            valid_until: newValidUntil,
            trial_end_date: null // Убираем триал, если был
        });

        console.log(`✅ Подписка ${subscription.id} продлена до ${newValidUntil.toISOString()}. Списано: ${tariff.price}, новый баланс: ${newBalance}`);
    }

    async updateSubscriptionLimits(subscription, now) {
        if (!subscription.tariff?.limits) return;

        const usedLimits = JSON.parse(JSON.stringify(subscription.used_limits || {}));
        const metadata = JSON.parse(JSON.stringify(subscription.metadata || {}));

        let limitsUpdated = false;
        let metadataUpdated = false;

        for (const [path, currentValue] of Object.entries(usedLimits)) {
            const limitConfig = ObjectUtils.get(subscription.tariff.limits, path);
            if (!limitConfig?.period) continue;

            const resetKey = `limit_reset_${path}`;

            let lastReset = metadata[resetKey]
                ? new Date(metadata[resetKey])
                : subscription.valid_from;

            const nextReset = this.calculateNextReset(lastReset, limitConfig.period);

            if (now >= nextReset) {
                if (currentValue !== 0) {
                    usedLimits[path] = {};
                    limitsUpdated = true;
                }
                metadata[resetKey] = now.toISOString();
                metadataUpdated = true;
            }
        }

        const updates = {};
        if (limitsUpdated) {
            updates.used_limits = usedLimits;
        }
        if (metadataUpdated) {
            updates.metadata = metadata;
        }

        if (Object.keys(updates).length > 0) {
            await subscription.update(updates);
        }
    }

    calculateNextReset(lastReset, period) {
        const next = new Date(lastReset);

        switch (period) {
            case PERIOD_VALUES.DAY:
                next.setDate(next.getDate() + 1);
                break;
            case PERIOD_VALUES.WEEK:
                next.setDate(next.getDate() + 7);
                break;
            case PERIOD_VALUES.MONTH:
                next.setMonth(next.getMonth() + 1);
                break;
            case PERIOD_VALUES.YEAR:
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                next.setDate(next.getDate() + 30); // месяц по умолчанию
        }

        return next;
    }
}

function getDateByPeriod(startDate, period) {
    const endDate = new Date(startDate);
    switch (period) {
        case PERIOD_VALUES.DAY:
            endDate.setDate(endDate.getDate() + 1);
            break;
        case PERIOD_VALUES.WEEK:
            endDate.setDate(endDate.getDate() + 7);
            break;
        case PERIOD_VALUES.YEAR:
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        default: // MONTH
            endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
}

function findAllPeriods(obj, results = [], path = '') {
    if (!obj || typeof obj !== 'object') return results;

    for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (key === 'period' && PERIOD_VALUES[value.toUpperCase()]) {
            results.push({
                path: currentPath,
                value: value,
                parent: path
            });
        }

        if (value && typeof value === 'object') {
            findAllPeriods(value, results, currentPath);
        }
    }
    return results;
}

module.exports = SubscriptionAutoCheck;