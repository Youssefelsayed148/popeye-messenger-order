import Link from "next/link";

type Props = {
  title?: string;
  message?: string;
  showBackLink?: boolean;
};

export function EmptyState({
  title = "قريباً",
  message = "بنحضّر المنيو دلوقتي، ارجع تاني شوية.",
  showBackLink = false,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        aria-hidden
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sauce/15"
      >
        <span className="font-display text-3xl text-sauce">!</span>
      </div>
      <h3 className="mb-2 font-sans text-xl font-semibold text-ink">{title}</h3>
      <p className="max-w-xs text-sm text-muted">{message}</p>
      {showBackLink && (
        <Link
          href="/menu"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-sauce px-6 font-sans text-sm font-semibold text-paper transition active:scale-95"
        >
          ارجع للمنيو
        </Link>
      )}
    </div>
  );
}
