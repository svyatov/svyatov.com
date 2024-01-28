export type ExternalLinkProps = Readonly<{
  href: string;
  children: React.ReactNode;
  className?: string;
}>;

export default function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a className={className} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}
