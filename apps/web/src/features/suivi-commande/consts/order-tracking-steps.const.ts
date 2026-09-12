import { OrderStatus } from '@angaly/types';

export interface TrackingStepDef {
  key: string;
  label: string;
  description: string;
  mappedStatuses: OrderStatus[];
}

// Map the 8 mockup steps to the existing Prisma OrderStatus
export const TRACKING_STEPS: TrackingStepDef[] = [
  {
    key: 'confirmed',
    label: 'Commande confirmée',
    description: 'Votre commande a été reçue et payée.',
    mappedStatuses: [OrderStatus.CONFIRMED, OrderStatus.PAID],
  },
  {
    key: 'measurements',
    label: 'Mesures prises',
    description: 'Vos mensurations ont été validées.',
    mappedStatuses: [OrderStatus.IN_PRODUCTION],
  },
  {
    key: 'pattern',
    label: 'Patron créé',
    description: 'Le patron de votre pièce est généré.',
    mappedStatuses: [OrderStatus.IN_PRODUCTION],
  },
  {
    key: 'confection',
    label: 'Confection',
    description: 'Votre pièce est en cours de couture à l\'atelier.',
    mappedStatuses: [OrderStatus.IN_PRODUCTION],
  },
  {
    key: 'qc',
    label: 'Contrôle qualité',
    description: 'Vérification des finitions et détails.',
    mappedStatuses: [OrderStatus.READY],
  },
  {
    key: 'fitting',
    label: 'Essayage',
    description: 'Dernier essayage ou ajustement (si applicable).',
    mappedStatuses: [OrderStatus.READY],
  },
  {
    key: 'finished',
    label: 'Terminée',
    description: 'La pièce est prête à être expédiée ou récupérée.',
    mappedStatuses: [OrderStatus.READY],
  },
  {
    key: 'delivered',
    label: 'Livrée',
    description: 'Vous avez reçu votre commande.',
    mappedStatuses: [OrderStatus.DELIVERED],
  }
];
