import Image from "next/image";

type StandAloneLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** Shared brand mark for the landing page, workspace, and chain tools. */
export function StandAloneLogo({
  size = 36,
  className = "",
  priority = false,
}: StandAloneLogoProps) {
  const radius = size <= 22 ? 6 : size <= 36 ? 9 : 12;

  return (
    <span
      className={`standalone-logo-frame ${className}`.trim()}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <Image
        src="/standalone-agent-logo.png"
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="standalone-logo-image"
      />
    </span>
  );
}
