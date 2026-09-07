import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useSendContactMessageMutation } from '../api/contact.api';
import { contactFormSchema, type ContactFormValues } from '../schemas/contact-form.schema';

export function useContactForm(): {
  register: ReturnType<typeof useForm<ContactFormValues>>['register'];
  handleSubmit: ReturnType<typeof useForm<ContactFormValues>>['handleSubmit'];
  errors: ReturnType<typeof useForm<ContactFormValues>>['formState']['errors'];
  onSubmit: (values: ContactFormValues) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
} {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { prenom: '', nom: '', email: '', telephone: '', message: '' },
  });

  const mutation = useSendContactMessageMutation();

  const onSubmit = (values: ContactFormValues) => {
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
