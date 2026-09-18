export const metadata = {
  title: "تعليمات حذف البيانات — Popeye Restaurant",
};

export default function DataDeletionPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink">تعليمات حذف البيانات</h1>
      <p className="mt-1 text-sm text-muted">آخر تحديث: سبتمبر 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <p>
            لو عايز تحذف البيانات اللي عندنا عنك (الاسم، رقم الهاتف، العنوان،
            سجل الطلبات، ومعرّف حساب ماسنجر)، اتبع أي طريقة من دول:
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            الطريقة 1: ابعتلنا رسالة على ماسنجر
          </h2>
          <p>
            ابعت رسالة لصفحة &quot;Popeye Restaurant&quot; على ماسنجر واكتب
            &quot;احذف بياناتي&quot;، مع ذكر رقم الهاتف اللي طلبت بيه. هنأكد
            الحذف خلال 7 أيام عمل.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            الطريقة 2: تواصل معانا مباشرة
          </h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>📞 اتصل بينا على: 035710277 — 01111470550</li>
            <li>✉️ ابعتلنا إيميل على: youssefelsayed1480@gmail.com</li>
          </ul>
          <p className="mt-2">
            اذكر رقم الهاتف أو رقم الطلب اللي عندك عشان نقدر نلاقي بياناتك
            ونحذفها.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            هيتم حذف إيه بالظبط
          </h2>
          <p>
            هنحذف اسمك، رقم هاتفك، عنوانك، وسجل طلباتك بالكامل من قاعدة
            بياناتنا. لو عندك طلب لسه قيد التوصيل، هنكمله الأول قبل ما نحذف
            البيانات المرتبطة بيه.
          </p>
        </section>
      </div>

      <hr className="my-8 border-ink/10" />

      <div dir="ltr" className="space-y-6 text-left text-sm leading-relaxed text-ink-soft">
        <h2 className="font-display text-2xl text-ink">
          Data Deletion Instructions (English)
        </h2>

        <section>
          <p>
            If you&apos;d like us to delete the data we hold about you (name,
            phone number, address, order history, and Messenger identifier),
            use any of the following methods:
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Option 1: Message us on Messenger
          </h3>
          <p>
            Send a message to the &quot;Popeye Restaurant&quot; Page on
            Messenger saying &quot;Delete my data&quot;, including the phone
            number you ordered with. We will confirm deletion within 7
            business days.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Option 2: Contact us directly
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>📞 Call us at: 035710277 — 01111470550</li>
            <li>✉️ Email us at: youssefelsayed1480@gmail.com</li>
          </ul>
          <p className="mt-2">
            Please include your phone number or order number so we can
            locate and delete your data.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            What gets deleted
          </h3>
          <p>
            We will permanently delete your name, phone number, address, and
            full order history from our database. If you have an order
            currently being delivered, we will complete it first before
            deleting the data associated with it.
          </p>
        </section>
      </div>
    </main>
  );
}
