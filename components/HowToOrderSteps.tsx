const STEPS = [
  "اختار الأصناف اللي يعجبك",
  "أضفها للسلة",
  "أكمل بياناتك وأكد الطلب",
];

export function HowToOrderSteps() {
  return (
    <div
      role="list"
      aria-label="خطوات الطلب"
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:snap-none sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {STEPS.map((step, i) => (
        <div
          role="listitem"
          key={step}
          className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-ink/10 bg-paper py-1.5 pl-3 pr-1.5 sm:flex-1 sm:justify-center"
        >
          <span
            aria-hidden
            className="num-badge flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sauce text-xs leading-none text-paper"
          >
            {i + 1}
          </span>
          <span className="whitespace-nowrap font-sans text-xs font-semibold text-ink-soft sm:whitespace-normal">
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
