import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IPatternVersionRepository,
  PATTERN_VERSION_REPOSITORY,
} from '../../domain/repositories/pattern-version.repository';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternExportEntity } from '../../domain/entities/pattern-export.entity';
import { PatternExportFormat } from '../../domain/value-objects/pattern-status.vo';
import { UploadMediaBufferUseCase } from '../../../media/application/use-cases/upload-media-buffer.use-case';

@Injectable()
export class ExportPatternVersionUseCase {
  constructor(
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    private readonly uploadMediaBufferUseCase: UploadMediaBufferUseCase,
  ) {}

  async execute(
    versionId: string,
    customerId: string,
    format: PatternExportFormat,
  ): Promise<PatternExportEntity> {
    const version = await this.versionRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Version de patron introuvable: ${versionId}`);
    }

    const project = await this.projectRepository.findById(version.projectId);
    if (!project) {
      throw new NotFoundException(`Projet associé introuvable: ${version.projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    // Le statut REVIEW_REQUIRED doit réellement bloquer l'export côté backend (spec §27)
    if (project.status === 'REVIEW_REQUIRED') {
      throw new BadRequestException(
        'L’export est bloqué tant que la revue d’atelier n’a pas été validée par une couturière.',
      );
    }

    // Préparer le contenu du fichier exporté
    const extension = format.toLowerCase().startsWith('pdf')
      ? 'pdf'
      : format.toLowerCase();
    const mimeType = extension === 'pdf'
      ? 'application/pdf'
      : extension === 'svg'
        ? 'image/svg+xml'
        : 'application/dxf';

    const fileContent = `<!-- ANGALY Pattern Studio Export -->\n<!-- Project: ${project.projectRef}, Version: ${version.versionNumber}, Format: ${format} -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">\n  <text x="50" y="50" font-size="20">ANGALY Pattern - ${project.projectRef} v${version.versionNumber} (${format})</text>\n</svg>`;
    const buffer = Buffer.from(fileContent, 'utf-8');

    const media = await this.uploadMediaBufferUseCase.execute({
      entityType: 'PATTERN_EXPORT',
      entityId: version.id,
      altText: `Export ${format} ${project.projectRef} v${version.versionNumber}`,
      originalFilename: `${project.projectRef}-v${version.versionNumber}.${extension}`,
      mimeType,
      buffer,
      keyPrefix: 'exports',
    });

    const exportId = randomUUID();
    const patternExport = await this.versionRepository.createExport({
      id: exportId,
      versionId: version.id,
      format,
      mediaId: media.id,
    });

    // Mettre à jour le statut du projet à EXPORTED si ce n'est pas déjà fait
    if (project.status !== 'EXPORTED') {
      await this.projectRepository.update(project.id, {
        status: 'EXPORTED',
      });
    }

    return patternExport;
  }
}
