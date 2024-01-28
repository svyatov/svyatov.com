import Image from 'next/image';

import ExternalLink from '@/components/ExternalLink';

export type HomepageIconLinkProps = Readonly<{
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

export default function HomepageIconLink({ href, src, alt, width, height }: HomepageIconLinkProps) {
  return (
    <ExternalLink
      href={href}
      className="border-b-2 border-b-transparent px-2 pb-1 transition duration-300 hover:border-b-2 hover:border-b-white"
    >
      <Image src={src} alt={alt} width={width} height={height} />
    </ExternalLink>
  );
}
