import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextAppointmentCard } from '../ui/NextAppointmentCard';
import { CurrentOrderCard } from '../ui/CurrentOrderCard';
import { PremiumProjectCard } from '../ui/PremiumProjectCard';
import { NotificationsPreviewCard } from '../ui/NotificationsPreviewCard';
import { QuickAccessTilesGrid } from '../ui/QuickAccessTilesGrid';
import { RecentActivityTimeline } from '../ui/RecentActivityTimeline';
import { OrderStatus, PatternStatus } from '@angaly/types';

describe('Dashboard Component Cards', () => {
  describe('NextAppointmentCard', () => {
    it('renders empty state correctly with booking CTA', () => {
      render(<NextAppointmentCard appointment={null} />);
      expect(screen.getByText('Aucun rendez-vous')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /prendre rendez-vous/i })).toHaveAttribute(
        'href',
        '/prendre-rendez-vous',
      );
    });

    it('renders appointment details when provided', () => {
      render(
        <NextAppointmentCard
          appointment={{
            id: 'apt-1',
            scheduledAt: '2026-10-15T11:00:00.000Z',
            atelierName: 'Atelier Antananarivo',
            atelierAddress: '12 Rue de l\'Artisanat',
          }}
        />,
      );
      expect(screen.getByText(/Atelier Antananarivo/i)).toBeInTheDocument();
      expect(screen.getByText('Confirmé')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voir les détails/i })).toHaveAttribute(
        'href',
        '/mes-rendez-vous',
      );
    });
  });

  describe('CurrentOrderCard', () => {
    it('renders empty state with creations link', () => {
      render(<CurrentOrderCard order={null} />);
      expect(screen.getByText('Aucune commande')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /découvrir nos créations/i })).toHaveAttribute(
        'href',
        '/creations',
      );
    });

    it('renders in-progress order details', () => {
      render(
        <CurrentOrderCard
          order={{
            id: 'ANG-2026-0099',
            status: OrderStatus.IN_PRODUCTION,
            createdAt: '2026-10-10T10:00:00.000Z',
          }}
        />,
      );
      expect(screen.getByText('Commande #ANG-2026-0099')).toBeInTheDocument();
      expect(screen.getByText('En confection')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /suivre ma commande/i })).toHaveAttribute(
        'href',
        '/suivi-commande/ANG-2026-0099',
      );
    });
  });

  describe('PremiumProjectCard', () => {
    it('renders default studio promotion when no active project exists', () => {
      render(<PremiumProjectCard project={null} />);
      expect(screen.getByText('Studio de patronage')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /créer un patron/i })).toHaveAttribute(
        'href',
        '/pattern-studio',
      );
    });

    it('renders active project with reference and status badge', () => {
      render(
        <PremiumProjectCard
          project={{
            id: 'ANG-PAT-2026-00001',
            name: 'Robe Solène Sur-Mesure',
            status: PatternStatus.GENERATED,
          }}
        />,
      );
      expect(screen.getByText('Robe Solène Sur-Mesure')).toBeInTheDocument();
      expect(screen.getByText('À vérifier')).toBeInTheDocument();
      expect(screen.getByText(/ANG-PAT-2026-00001/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voir détails/i })).toHaveAttribute(
        'href',
        '/pattern-studio',
      );
    });
  });

  describe('NotificationsPreviewCard', () => {
    it('renders empty message when notifications array is empty', () => {
      render(<NotificationsPreviewCard notifications={[]} />);
      expect(screen.getByText('Aucune nouvelle notification.')).toBeInTheDocument();
    });

    it('renders list of notifications with link', () => {
      render(
        <NotificationsPreviewCard
          notifications={[
            { id: '1', title: 'Nouveau message', message: 'Votre robe avance' },
            { id: '2', title: 'Facture prête', message: 'Consultez votre facture' },
          ]}
        />,
      );
      expect(screen.getByText('Nouveau message')).toBeInTheDocument();
      expect(screen.getByText('Facture prête')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /toutes les notifications/i })).toHaveAttribute(
        'href',
        '/mes-messages?tab=notifications',
      );
    });
  });

  describe('QuickAccessTilesGrid', () => {
    it('renders all 4 quick access tiles with correct links', () => {
      render(<QuickAccessTilesGrid />);
      expect(screen.getByRole('link', { name: /mes créations/i })).toHaveAttribute('href', '/mes-creations');
      expect(screen.getByRole('link', { name: /mes mesures/i })).toHaveAttribute('href', '/mes-mesures');
      expect(screen.getByRole('link', { name: /mes favoris/i })).toHaveAttribute('href', '/mes-favoris');
      expect(screen.getByRole('link', { name: /mes factures/i })).toHaveAttribute(
        'href',
        '/mes-messages?tab=factures',
      );
    });
  });

  describe('RecentActivityTimeline', () => {
    it('renders empty activity placeholder', () => {
      render(<RecentActivityTimeline activities={[]} />);
      expect(screen.getByText('Aucune activité récente.')).toBeInTheDocument();
    });

    it('renders activities and history link', () => {
      render(
        <RecentActivityTimeline
          activities={[
            { date: 'Hier', title: 'Mesures mises à jour', description: 'Tour de taille ajusté' },
          ]}
        />,
      );
      expect(screen.getByText('Mesures mises à jour')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voir tout l'historique/i })).toHaveAttribute(
        'href',
        '/mes-rendez-vous',
      );
    });
  });
});
