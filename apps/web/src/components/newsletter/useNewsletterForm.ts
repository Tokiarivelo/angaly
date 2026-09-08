import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useNewsletterSubscribeMutation } from './newsletter.api';
import { newsletterSchema, type NewsletterFormValues } from './newsletter.schema';

export function useNewsletterForm(): {
  register: ReturnType<typeof useForm<NewsletterFormValues>>['register'];
  handleSubmit: ReturnType<typeof useForm<NewsletterFormValues>>['handleSubmit'];
  errors: ReturnType<typeof useForm<NewsletterFormValues>>['formState']['errors'];
  onSubmit: (values: NewsletterFormValues) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
} {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', consent: false },
  });

  const mutation = useNewsletterSubscribeMutation();

  const onSubmit = (values: NewsletterFormValues) => {
    mutation.mutate(values, { onSuccess: () => reset() });
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}
