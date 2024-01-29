import cslx from 'clsx';

export type AProps = Readonly<{
  className?: string;
  href: string;
  rel?: string;
  target?: string;
  children: React.ReactNode;
}>;

export default function A({ className, href, rel, target, children }: AProps) {
  return (
    <a className={cslx('no-underline', className)} href={href} rel={rel} target={target}>
      {children}
    </a>
  );
}
