import { LoginForm } from '@/features/authentification/ui/LoginForm';
import { Modal } from '@/components/ui/Modal';
import { Suspense } from 'react';

export default function ConnexionModal() {
  return (
    <Modal>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </Modal>
  );
}
