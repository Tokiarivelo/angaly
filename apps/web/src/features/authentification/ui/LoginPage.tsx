import { AuthSplitLayout } from './AuthSplitLayout';
import { LoginForm } from './LoginForm';

export function LoginPage() {
  return (
    <AuthSplitLayout brandBaseline="L’élégance, créée pour vous.">
      <LoginForm />
    </AuthSplitLayout>
  );
}
