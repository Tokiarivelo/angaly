import { AuthSplitLayout } from './AuthSplitLayout';
import { SignupForm } from './SignupForm';

export function SignupPage() {
  return (
    <AuthSplitLayout brandBaseline="L’élégance, créée pour vous.">
      <SignupForm />
    </AuthSplitLayout>
  );
}
