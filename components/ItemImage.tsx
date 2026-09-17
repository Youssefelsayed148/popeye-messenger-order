import Image from "next/image";

type ItemImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

export function ItemImage({
  src,
  alt,
  className = "",
  sizes,
  priority,
  fill = true,
  width,
  height,
}: ItemImageProps) {
  if (!src) {
    return <BrandedFallback className={className} alt={alt} />;
  }
  if (fill) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 0}
      height={height ?? 0}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}

function BrandedFallback({ className = "", alt }: { className?: string; alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 overflow-hidden bg-cream ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(244,185,66,0.28) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(220,31,38,0.16) 0%, transparent 60%)",
        }}
      />
      <Image
        src="/logo.png"
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-contain p-6 opacity-25"
        priority={false}
      />
    </div>
  );
}
