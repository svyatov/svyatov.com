import ExternalLink from './ExternalLink';

export type HeaderLinkProps = Readonly<{
  href: string;
  children: React.ReactNode;
}>;

export default function HeaderLink({ href, children }: HeaderLinkProps) {
  return (
    <ExternalLink
      className="border-x border-x-transparent px-2 text-xl text-amber-200 transition duration-300 hover:border-x-amber-200"
      href={href}
    >
      {children}
    </ExternalLink>
  );
}
