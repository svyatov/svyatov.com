import Image from 'next/image';

import ExternalLink from '@/components/ExternalLink';

export type HomepageIconLinkProps = Readonly<{
  href: string;
  src: string;
  alt: string;
}>;

export default function HomepageIconLink({ href, src, alt }: HomepageIconLinkProps) {
  return (
    <ExternalLink
      href={href}
      className="border-b-2 border-b-transparent px-2 pb-1 transition duration-300 hover:border-b-2 hover:border-b-white"
    >
      <Image src={src} alt={alt} width={32} height={32} className="h-8 w-8" />
    </ExternalLink>
  );
}
