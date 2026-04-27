import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ href, size = 'md', className = '' }: LogoProps) {
  const sizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  const content = (
    <span className={`font-black tracking-tighter ${sizeClass} ${className}`}>
      <span className="text-orange-500">Nemo</span>
      <span className="text-white">Claw</span>
      <span className="text-orange-500 ml-0.5">·</span>
      <span className="text-slate-300 font-semibold text-sm ml-1">Culture</span>
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
