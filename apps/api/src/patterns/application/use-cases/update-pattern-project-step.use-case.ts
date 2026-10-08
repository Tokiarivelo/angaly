import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { validatePatternExtParameters } from '@angaly/types';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { UpdatePatternProjectDto } from '../dtos/update-pattern-project.dto';

@Injectable()
export class UpdatePatternProjectStepUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
  ) {}

  async execute(
    projectId: string,
    customerId: string,
    dto: UpdatePatternProjectDto,
  ): Promise<PatternProjectEntity> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de patron introuvable: ${projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    // Strict: an out-of-range / mistyped extended parameter is rejected, never silently clamped.
    let parametersExtJson = project.parametersExtJson;
    if (dto.parametersExtJson !== undefined) {
      const { value, issues } = validatePatternExtParameters(dto.parametersExtJson);
      if (issues.length > 0) {
        throw new BadRequestException({
          message: 'Paramètres étendus invalides',
          errors: issues.map((issue) => issue.message),
        });
      }
      parametersExtJson = Object.keys(value).length > 0 ? value : null;
    }

    const updated = await this.projectRepository.update(projectId, {
      garmentType: dto.garmentType ?? project.garmentType,
      occasion: dto.occasion !== undefined ? dto.occasion : project.occasion,
      style: dto.style !== undefined ? dto.style : project.style,
      cutType: dto.cutType !== undefined ? dto.cutType : project.cutType,
      detailsJson: dto.detailsJson !== undefined ? dto.detailsJson : project.detailsJson,
      inspirationMediaId: dto.inspirationMediaId !== undefined ? dto.inspirationMediaId : project.inspirationMediaId,
      inspirationAnalysisJson:
        dto.inspirationAnalysisJson !== undefined
          ? dto.inspirationAnalysisJson
          : project.inspirationAnalysisJson,
      parametersExtJson,
      measurementProfileId: dto.measurementProfileId !== undefined ? dto.measurementProfileId : project.measurementProfileId,
    });

    return updated;
  }
}
