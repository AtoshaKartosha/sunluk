# Sunluk Commerce Development Roadmap

## Введение (Overview)
**Sunluk Commerce** — это e-commerce платформа для продажи аксессуаров для очков премиум-класса, построенная на базе монорепозитория MedusaJS v2 (commerce-бэкенд) и Next.js 16 (кастомный фронтенд).

Интерфейс выполнен в минималистичном бруталистском стиле (строгие прямые углы, строгое отсутствие скруглений: `rounded-none`, контрастная типографика, приглушенные землистые цвета, монохромная палитра с редкими акцентными элементами).

Локализация реализована через полные префиксные маршруты (`next-intl`), по умолчанию используется русский язык (`/ru`).

## Технологический стек (Tech Stack)
* **Frontend Storefront**: Next.js 16 (React 19), Tailwind CSS v4, shadcn/ui, next-intl.
* **Commerce Backend**: MedusaJS v2 (React 18), PostgreSQL, Redis, Medusa JS SDK.
* **Database & Infrastructure**: PostgreSQL (authoritative commerce state), Redis (caching/jobs), Docker Compose, WSL/Windows local env scripts.

## Архитектура процессов разработки (Flow-First Development)
Все нетривиальные задачи проходят через 4-этапный жизненный цикл Flow-First (согласно `AGENTS.md`):
1. **Design**: Создание flow-документа главным агентом (`flow-first`).
2. **Review**: Проверка соответствия архитектурным границам (`flows/ARCHITECTURE.md`). Должен быть получен статус "Approved".
3. **Implement**: Разработка кода исполнителями (sub-agents) без запуска линтеров и форматеров во время итераций.
4. **Sync**: Финальная валидация отсутствия дрейфа (drift) между кодом и документацией (запуск `sync-flows`).

---

## Текущий статус проекта (Flow Status Matrix)

| Название Flow | Статус | Реализованный функционал | Файлы реализации | Планируемые доработки |
|---|---|---|---|---|
| **Catalog Browsing**<br>(Просмотр каталога) | **Реализован** | Базовый флоу перехода от списка к деталям (PDP). Выбор вариантов, галерея товаров, вывод цен с поддержкой НДС, адаптивная верстка, локализация, динамические характеристики, связанные товары и разметка JSON-LD. | `storefront/src/app/[locale]/products/page.tsx`<br>`storefront/src/app/[locale]/products/[handle]/page.tsx`<br>`storefront/src/components/product/ProductInfoBlock.tsx`<br>`storefront/src/components/product/ProductFacts.tsx`<br>`storefront/src/components/product/ProductRelatedProducts.tsx`<br>`storefront/src/components/product/ProductJsonLd.tsx` | Умный поиск (Typesense/Meilisearch), персональные рекомендации. |
| **Catalog Localization**<br>(Локализация каталога) | **Реализован** | Локализованные URL-маршруты (`/ru`, `/en`), переключатель языков (`LocaleSwitcher.tsx`). Словари `en.json`, `ru.json`. Синхронизация запросов с BCP 47 (`ru-RU`, `en-US`). | `storefront/src/middleware.ts`<br>`storefront/src/i18n/routing.ts`<br>`storefront/src/i18n/request.ts`<br>`storefront/messages/ru.json`<br>`storefront/messages/en.json`<br>`storefront/src/components/product/LocaleSwitcher.tsx` | Кастомный интерфейс перевода в Medusa Admin. |
| **Cart & Checkout**<br>(Корзина и Оформление) | **Реализован** | Провайдер `CartContext` (cookie storage), Brutalist Drawer UI, кастомный checkout-процесс (контактные данные -> доставка -> оплата) с авто-расчетом сумм на бэкенде Medusa. Страница успешного заказа. | `storefront/src/components/cart/CartContext.tsx`<br>`storefront/src/components/cart/CartDrawer.tsx`<br>`storefront/src/app/[locale]/checkout/page.tsx`<br>`storefront/src/app/[locale]/checkout/success/page.tsx`<br>`storefront/src/lib/medusa/cart.ts` | Интеграция реальных платежных шлюзов (YooKassa, CloudPayments, Stripe), интеграция служб доставки (СДЭК/DHL). |
| **Product Add-ons**<br>(Дополнения к продуктам) | **Реализован** | Выбор подарочной упаковки на PDP. Двухэтапное добавление в корзину (сначала изделие, затем упаковка). Связывание упаковок с украшениями через `parent_line_item_id` в метаданных. Синхронное удаление и обновление количества. Защита от отсутствия в наличии. | `storefront/src/lib/medusa/products.ts` (`listPackagingProducts`)`storefront/src/components/product/ProductInfoBlock.tsx`<br>`storefront/src/components/cart/CartContext.tsx`<br>`storefront/src/components/cart/CartDrawer.tsx` | Масштабирование на другие типы дополнений. |
| **Customer Cabinet**<br>(Личный кабинет) | **Реализован** | JWT cookie-based авторизация, формы логина (`/login`) и регистрации (`/register`), профиль пользователя, история заказов со статусами, детальная страница заказа. Защита от истечения сессии, скелетон загрузки. | `storefront/src/app/[locale]/cabinet/page.tsx`<br>`storefront/src/app/[locale]/cabinet/loading.tsx`<br>`storefront/src/app/[locale]/cabinet/orders/[id]/page.tsx`<br>`storefront/src/lib/medusa/customer-server.ts`<br>`storefront/src/lib/medusa/customer.ts` | Форма изменения личных данных, сброс пароля, привязка гостевых заказов к созданному аккаунту. |
| **Admin Operations**<br>(Администрирование) | **В процессе** | Стандартная панель Medusa Admin, скрипт начального импорта категорий, товаров и цен. Заглушки кастомных роутов. | `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`<br>`backend/apps/backend/src/api/admin/custom/route.ts` | Реализация кастомных отчетов, управление переводами товаров и мультивалютностью. |

---

## План фаз разработки (Phased Roadmap)

### Фаза 1: Базовый фронтенд и каталог (Выполнено)
* [x] Настройка локализованного роутинга Next.js (`next-intl`, префиксы `/ru`, `/en`)
* [x] Разработка бруталистского UI лендинга и основных секций (Hero, Editorial, About и др.)
* [x] Реализация флоу просмотра товаров и PDP (v0, выбор вариантов, галерея)
* [x] Интеграция мультиязычных словарей (`ru.json`, `en.json`)
* [x] Сид-скрипт начального импорта товаров, категорий и цен

### Фаза 2: Корзина и Оформление заказа (Выполнено)
* [x] Провайдер `CartContext` и сохранение ID корзины в куках
* [x] Разработка бруталистского Cart Drawer (список позиций, изменение количества, удаление)
* [x] Верстка и логика одностраничного Checkout (контакты -> адрес доставки -> выбор доставки -> выбор оплаты)
* [x] Добавление сопутствующих товаров (Product Add-ons) с синхронизацией количества и удаления с родительским товаром
* [x] Страница успешного оформления заказа `/checkout/success`

### Фаза 3: Авторизация и Личный кабинет (Выполнено)
* [x] JWT cookie-based сессии покупателя (интеграция со `/store/customers/me`)
* [x] Страницы логина `/login` и регистрации `/register` с клиентской валидацией
* [x] Раздел `/cabinet` с профилем покупателя и таблицей истории заказов
* [x] Детальная страница заказа `/cabinet/orders/[id]` с выводом адресов, цен и статусов

### Фаза 4: Стабилизация и PDP-блоки (Выполнено)
* [x] Переименование `storefront/src/proxy.ts` в `storefront/src/middleware.ts` для поддержки встроенного роутинга Next.js
* [x] Реализация `ProductFacts.tsx` (динамические характеристики на PDP)
* [x] Реализация `ProductRelatedProducts.tsx` (блок похожих товаров)
* [x] Реализация разметки `ProductJsonLd.tsx` для SEO-оптимизации PDP
* [x] Обработка 401 ошибок сессии с автоматическим редиректом на страницу входа `/login`
* [x] Добавление плавных скелетонов загрузки в кабинете покупателя для предотвращения CLS
* [x] Обработка отсутствия остатков конкретного типа подарочной упаковки (graceful fallback)

### Фаза 5: Интеграция платежей и логистики (Планируется)
* [ ] Разработка кастомного платежного провайдера для YooKassa / CloudPayments для РФ
* [ ] Подключение Stripe / Mollie в `medusa-config.ts` для европейских регионов
* [ ] Интеграция с API служб доставки (СДЭК/DHL/Boxberry) для динамического расчета стоимости на этапе Checkout
* [ ] Настройка правил налогообложения (VAT для DE, без НДС для РФ) и валютных прайс-листов (EUR/RUB)

### Фаза 6: Тестирование и Безопасность (Планируется)
* [ ] Покрытие тестами `CartContext` и логики Add-ons метаданных (`parent_line_item_id`)
* [ ] Тесты роутинга локалей и fallback-контента
* [ ] Проверка httpOnly secure cookie-защиты сессий покупателей
* [ ] Оптимизация верстки по Lighthouse (целевой балл 95+)

### Фаза 7: Развитие панели управления (Планируется)
* [ ] Кастомный виджет для удобного перевода товаров в Medusa Admin
* [ ] Настройка воркфлоу обработки заказов (Fulfillment Workflows)
* [ ] Интеграция почтовых рассылок и уведомлений клиентов (Email/Telegram) через Medusa Subscribers
* [ ] Панель аналитики продаж в Medusa Admin
---

## Незыблемые правила разработки (Non-Negotiable Guardrails)
1. **Commerce Boundary**: Все расчеты стоимости заказа, корзины, применения скидок и валидация остатков производятся *строго* на бэкенде MedusaJS. Storefront не производит математических вычислений цен, а только выводит готовые данные от Medusa.
2. **Brutalist Style Constraints**: Никаких скруглений границ (`rounded-none` для кнопок, инпутов, карточек, диалоговых окон). Четкие линии, монохромный стиль с редким использованием акцентного цвета.
3. **Type Safety**: Полная типизация через TypeScript на фронтенде и бэкенде. Использование автогенерируемых типов Medusa SDK.
4. **Environment Isolation**: Все зависимости устанавливаются локально в `node_modules` проекта. Запрещены глобальные установки инструментов.
