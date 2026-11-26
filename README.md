# منظفات الإيمان

متجر إلكتروني عربي بتصميم RTL مبني باستخدام TanStack Start وReact، ويستخدم ملفات البيانات المحلية في `src/data/`.

## التشغيل المحلي

يتطلب المشروع Node.js 22.12 أو أحدث. ثبّت الاعتماديات وشغّل خادم التطوير:

```sh
npm install
npm run dev
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
