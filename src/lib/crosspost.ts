export const devtoTags = (tags: string[]) =>
  tags
    .slice(0, 4)
    .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .join(', ');
