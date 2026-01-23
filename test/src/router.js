import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@payment-app/authSdk';

const page1 = () => import("./views/page1.vue");
const page2 = () => import("./views/page2.vue");
const page3 = () => import("./views/page3.vue");
const page4 = () => import("./views/page4.vue");
const Registration = () => import("./views/Registration.vue");

const routes = [
    {
        path: '/forbidden',
        name: 'forbidden',
        component: () => import('@/views/ForbiddenPage.vue'),
        meta: { alwaysAvailable: true }
    },
    {
        path: "/",
        name: "page1",
        component: page1,
        meta: {
            title: "page1",
            alwaysAvailable: true
        },
    },
    {
        path: "/page2",
        name: "page2",
        component: page2,
        meta: {
            title: "Поиск дел",
            alwaysAvailable: true
        },
    },
    {
        path: "/page3",
        name: "page3",
        component: page3,
        meta: {
            title: "Настройки",
        },
    },
    {
        path: "/page4",
        name: "page4",
        component: page4,
        meta: {
            title: "Настройки",
        },
    },
    {
        path: "/registration",
        name: "registration",
        component: Registration,
        meta: {
            title: "регистрация",
            alwaysAvailable: true
        },
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    },
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Устанавливаем заголовок
    if (to.meta.title) {
        document.title = `${to.meta.title} | Приложение`;
    }

    // 1. Если страница всегда доступна - пропускаем ВСЕ проверки
    if (to.meta.alwaysAvailable) {
        console.log(`✅ Страница "${to.name}" всегда доступна`);
        next();
        return;
    }

    if (!authStore.isAuthenticated) {
        console.warn('Пользователь не авторизован, но пытается получить доступ к защищенной странице');
    }

    if (!authStore.currentTariff) {
        console.log(`🚫 Нет тарифа для доступа к "${to.name}"`);
        next({
            name: 'registration',
            query: {
                message: 'tariff_required',
                redirect: to.fullPath,
                requiredPage: to.name
            }
        });
        return;
    }


    let hasAccess = authStore.canAccessPage(to.name);


    if (!hasAccess) {
        console.log(`🚫 Нет доступа к "${to.name}"`);
        next({
            name: 'forbidden',
            query: {
                requiredFeature: to.name,
                page: to.meta.title || to.name,
            }
        });
        return;
    }

    next();
});


export default router;
