import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type {
  IRenderSourceReader,
  RenderSource,
} from '../../domain/repositories/render-source.reader';

/** The version's simulation input, if the customer owns its project (same rule as the other pattern endpoints). */
export async function loadOwnedSource(
  reader: IRenderSourceReader,
  versionId: string,
  customerId: string,
): Promise<RenderSource> {
  const source = await reader.findByVersionId(versionId);
  if (!source) {
    throw new NotFoundException(`Version de patron introuvable: ${versionId}`);
  }
  if (source.customerId !== customerId) {
    throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
  }
  return source;
}
