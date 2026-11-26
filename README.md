# منظفات الإيمان

متجر إلكتروني عربي بتصميم RTL مبني باستخدام TanStack Start وReact، ويقرأ بيانات المنتجات والأقسام من Supabase.

## التشغيل المحلي

يتطلب المشروع Node.js 22.12 أو أحدث. ثبّت الاعتماديات وشغّل خادم التطوير:

```sh
npm install
npm run dev
```

انسخ `.dev.vars.example` إلى `.dev.vars` وأضف عنوان مشروع Supabase ومفتاح `anon` العام ومفتاح الخدمة الخاص. لا تضف ملف `.dev.vars` إلى Git. للإنتاج، أضف `SUPABASE_URL` و`SUPABASE_ANON_KEY` كمتغيري Worker في Cloudflare، وأضف `SUPABASE_SERVICE_ROLE_KEY` سرًا في إعدادات Worker. يستخدمه إنشاء الطلبات على الخادم فقط؛ لا تضعه في شيفرة المتصفح.

بعد إنشاء مستخدم المالك في Supabase Auth، اربطه بصلاحيات الكتابة مرة واحدة من SQL Editor، مع استبدال UUID بمعرّف المستخدم من لوحة Auth:

```sql
insert into private.shop_owner (singleton, user_id)
values (true, '00000000-0000-0000-0000-000000000000');
```

لفحص المشروع محليًا:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## النشر على Cloudflare Workers

يتطلب النشر حساب Cloudflare ونطاق `workers.dev` مفعّلًا. سجّل الدخول مرة واحدة باستخدام Wrangler، ثم انشر:

```sh
npx wrangler login
npm run deploy
```

لمعاينة إعدادات النشر دون نشر التطبيق:

```sh
npx wrangler deploy --dry-run
```

اسم Worker وإعداداته موجودة في `wrangler.jsonc`. ملفات خط Thmanyah محلية فقط داخل `public/fonts/`، وهذا المجلد مستثنى من Git؛ عند غيابها يستخدم الموقع خط Cairo الاحتياطي.
