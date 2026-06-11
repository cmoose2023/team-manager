import Image from 'next/image';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 40, className = '' }: AppLogoProps) {
  return (
    <Image
      src="/INV_CircleLogo.svg"
      alt="Invaluable"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
