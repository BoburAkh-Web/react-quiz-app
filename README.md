# The Happy Quiz

JavaScript bo'yicha testlar platformasi. O'quvchilar test ishlaydi va natijasini kuzatadi;
o'qituvchi testlar va savollarni boshqaradi (qo'lda yoki AI yordamida) va natijalarni tahlil qiladi.

## Imkoniyatlar

**O'quvchi:** ro'yxatdan o'tish va kirish · testlar ro'yxati · har safar aralashtirilgan savol va
variantlar · taymer · sahifa yopilsa davom ettirish · natija, javoblar tahlili va tushuntirishlar.

**Admin:** testlar (yaratish, tahrirlash, ochish/yopish) · savollar (qo'lda yoki Gemini AI bilan) ·
har bir savol statistikasi · natijalar va o'quvchi tarixi · o'quvchi parolini tiklash.

## Texnologiyalar

React 19, Vite, Tailwind CSS v4 + daisyUI v5, TanStack Query, React Router, Motion ·
Supabase (Postgres + RPC funksiyalar) · Netlify (hosting + Functions) · Gemini API.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:5173 — AI generatorsiz
npm run dev:netlify  # http://localhost:8888 — AI generator bilan
```

AI generator uchun loyiha ildizida `.env` fayl: `GEMINI_API_KEY=...` (git'ga tushmaydi).

## Baza (Supabase)

1. Supabase → **SQL Editor** → `supabase/migrations/` dagi fayllarni tartib bilan (001, 002, ...)
   ishga tushiring.
2. Admin parolini o'rnating (bu qatorni hech qayerga saqlamang):

   ```sql
   select quiz.set_admin_password('yangi-kuchli-parol');
   ```

Migratsiya eski jadvallarni o'chirmaydi, yopiq `quiz_legacy` sxemasiga ko'chiradi.
Qayta ishga tushirish xavfsiz.

## Xavfsizlik modeli

- Jadvallar API'dan yashirin `quiz` sxemasida; brauzer faqat `public` sxemadagi RPC funksiyalarni chaqiradi.
- Parollar bcrypt bilan, sessiya tokenlari bazada faqat sha256 xeshi bilan saqlanadi.
- To'g'ri javob o'quvchiga faqat javob bergandan keyin yuboriladi; ball serverda hisoblanadi.
- Admin 5 marta xato parol kiritsa, 5 daqiqaga bloklanadi.
- AI funksiyasi faqat amaldagi admin sessiyasi bilan ishlaydi.

## Buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm test` | Unit, UI va baza testlari (baza testlari PGlite'da, haqiqiy Postgres) |
| `npm run lint` | ESLint |
| `npm run build` | Production build (`build/`) |

## Deploy (Netlify)

Sozlamalar `netlify.toml` da. Netlify environment variables: `GEMINI_API_KEY` (secret),
ixtiyoriy `GEMINI_MODEL` (standart: `gemini-flash-lite-latest`).

## Tuzilma

```
src/
  pages/            sahifalar (o'quvchi va admin/)
  components/       ui/, layout/, auth/, student/, quiz/, admin/
  hooks/            ma'lumot va test jarayoni hook'lari
  lib/              API qatlami, sessiya, yordamchi funksiyalar
  context/          o'quvchi va admin sessiyalari
supabase/
  migrations/       baza sxemasi va RPC funksiyalar
  tests/            migratsiya testlari
netlify/functions/  AI savol generatori
```
