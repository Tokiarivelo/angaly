'use client';

import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm';
import { AuthSplitLayout } from './AuthSplitLayout';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { PasswordResetSentCard } from './PasswordResetSentCard';

export function ForgotPasswordPage() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isSuccess, isError } = useForgotPasswordForm();

  return (
    <AuthSplitLayout brandBaseline="L’excellence de la haute couture, façonnée à Madagascar.">
      {isSuccess ? (
        <PasswordResetSentCard />
      ) : (
        <ForgotPasswordForm
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isError={isError}
        />
      )}
    </AuthSplitLayout>
  );
}
