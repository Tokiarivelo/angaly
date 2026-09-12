import { SignupForm } from '@/features/authentification/ui/SignupForm';
import { Modal } from '@/components/ui/Modal';
import { Suspense } from 'react';

export default function InscriptionModal() {
  return (
    <Modal>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </Modal>
  );
}
