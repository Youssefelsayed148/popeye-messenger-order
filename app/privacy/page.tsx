export const metadata = {
  title: "سياسة الخصوصية — Popeye Restaurant",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl text-ink">سياسة الخصوصية</h1>
      <p className="mt-1 text-sm text-muted">آخر تحديث: سبتمبر 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            من نحن
          </h2>
          <p>
            مطعم باباي (Popeye Restaurant) — سيدي بشر بحري، 28 شارع 16 – جمال
            عبد الناصر. نستخدم صفحتنا على فيسبوك ماسنجر لاستقبال طلبات
            التوصيل من عملائنا.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            البيانات التي نجمعها
          </h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>معرّف حساب ماسنجر الخاص بيك (PSID) عشان نقدر نبعتلك تأكيد الطلب</li>
            <li>الاسم، رقم الهاتف، والعنوان اللي بتدخله عند إتمام الطلب</li>
            <li>تفاصيل الطلب نفسه (الأصناف، الكمية، السعر، طريقة الدفع)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            ليه بنجمع البيانات دي
          </h2>
          <p>
            بنستخدم البيانات دي فقط عشان نجهز طلبك، نوصله لعنوانك، ونبعتلك
            تأكيد وتحديثات عن حالة الطلب على نفس محادثة ماسنجر. مش بنستخدمها
            في أي غرض تاني، ومش بنبيعها أو نشاركها مع أي طرف تالت غير اللي
            يلزم لتوصيل طلبك (زي مندوب التوصيل).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            مين بيشوف بياناتك
          </h2>
          <p>
            فريق مطعم باباي فقط هو اللي بيشوف بيانات طلبك عشان يجهزه ويوصله.
            بياناتك متخزنة على خوادم Supabase الآمنة، ومش متاحة لأي حد تاني.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            التخزين المحلي على جهازك
          </h2>
          <p>
            بنستخدم localStorage عشان نحفظ محتوى السلة على جهازك لحد ما تكمل
            الطلب، وده بيفضل على جهازك بس ومش بيتبعت لينا إلا وقت التأكيد.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            حذف بياناتك
          </h2>
          <p>
            تقدر تطلب حذف بياناتك في أي وقت. التفاصيل والخطوات موجودة في صفحة{" "}
            <a href="/data-deletion" className="font-bold text-sauce underline">
              تعليمات حذف البيانات
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-sans text-base font-black text-ink">
            تواصل معانا
          </h2>
          <p>
            لأي استفسار عن الخصوصية أو البيانات، تقدر تتواصل معانا على:
          </p>
          <ul className="mt-2 list-disc space-y-1 pr-5" dir="ltr">
            <li className="text-right" dir="rtl">
              📞 035710277 — 01111470550
            </li>
            <li className="text-right" dir="rtl">
              ✉️ youssefelsayed1480@gmail.com
            </li>
          </ul>
        </section>
      </div>

      <hr className="my-8 border-ink/10" />

      <div dir="ltr" className="space-y-6 text-left text-sm leading-relaxed text-ink-soft">
        <h2 className="font-display text-2xl text-ink">Privacy Policy (English)</h2>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">Who we are</h3>
          <p>
            Popeye Restaurant, Sidi Bishr Bahari, 28 Street 16 – Gamal Abdel
            Nasser, Alexandria, Egypt. We use our Facebook Messenger Page to
            take delivery orders from customers.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Data we collect
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your Messenger Page-Scoped ID (PSID), used to send you order confirmations</li>
            <li>Name, phone number, and delivery address you provide at checkout</li>
            <li>Order details (items, quantities, prices, payment method)</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Why we collect it
          </h3>
          <p>
            Solely to prepare and deliver your order, and to send you order
            confirmations and status updates in the same Messenger
            conversation. We do not use it for any other purpose, and we do
            not sell or share it with third parties beyond what is necessary
            to fulfil your order (e.g. a delivery rider).
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Who can see your data
          </h3>
          <p>
            Only the Popeye Restaurant team can see your order data, to
            prepare and deliver it. Your data is stored on secure Supabase
            servers and is not accessible to anyone else.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Local storage on your device
          </h3>
          <p>
            We use your browser&apos;s localStorage to keep your cart contents on
            your device until you check out. This data stays on your device
            and is only sent to us when you confirm an order.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Deleting your data
          </h3>
          <p>
            You can request deletion of your data at any time. See our{" "}
            <a href="/data-deletion" className="font-bold text-sauce underline">
              Data Deletion Instructions
            </a>{" "}
            page for details.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-base font-black text-ink">
            Contact us
          </h3>
          <p>For any privacy or data questions, reach us at:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>📞 035710277 — 01111470550</li>
            <li>✉️ youssefelsayed1480@gmail.com</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
