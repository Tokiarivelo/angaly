'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Scissors,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import {
  CREATION_PROJECT_STAGES_ORDER,
  CreationProjectStage,
} from '@angaly/types';
import { ROUTES } from '@/lib/routes';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';
import {
  BUDGET_RANGE_OPTIONS,
  GARMENT_TYPE_OPTIONS,
  OCCASION_OPTIONS,
  useAdminNewCreationProject,
} from '../hooks/useAdminNewCreationProject';

export const AdminNewCreationProjectPage: React.FC = () => {
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    isCreatingNewCustomer,
    setIsCreatingNewCustomer,
    newCustomer,
    setNewCustomer,
    title,
    setTitle,
    garmentType,
    setGarmentType,
    occasion,
    setOccasion,
    eventDate,
    setEventDate,
    description,
    setDescription,
    budgetRange,
    setBudgetRange,
    selectedQuoteId,
    setSelectedQuoteId,
    assignedToId,
    setAssignedToId,
    initialStage,
    setInitialStage,
    inspirationPhotos,
    removeInspirationPhoto,
    addInspirationPhotos,

    customers,
    quotes,
    assignees,

    errors,
    isSubmitting,
    submitError,
    handleSubmit,

    summaryClientName,
    summaryGarment,
    summaryEvent,
    summaryBudget,
    summaryAssigneeName,
    currentStageIndex,
  } = useAdminNewCreationProject();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Breadcrumb & Navigation */}
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <ol className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#5C697A]">
          <li>
            <Link
              href={ROUTES.adminCreationProjects}
              className="hover:text-[#061938] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              Projets de création
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[#061938] font-medium" aria-current="page">
            Nouveau projet
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D9D4CA] pb-6">
        <div>
          <h1 className="font-heading font-normal text-3xl md:text-4xl text-[#061938] tracking-tight mb-2">
            Nouveau Projet Sur Mesure
          </h1>
          <p className="text-[#5C697A] text-sm md:text-base font-light">
            Ouvrez un dossier de création pour une cliente et lancez le suivi de l&apos;atelier.
          </p>
        </div>
        <div>
          <Link
            href={ROUTES.adminCreationProjects}
            className="px-5 py-2.5 text-xs uppercase tracking-widest font-headline text-[#061938] border border-[#061938] hover:bg-[#061938] hover:text-white transition-colors rounded-sm inline-flex items-center gap-2"
          >
            Annuler
          </Link>
        </div>
      </header>

      {/* Submit Error alert */}
      {submitError && (
        <div
          role="alert"
          className="mb-6 p-4 bg-[#A64A43]/10 border border-[#A64A43]/30 text-[#A64A43] text-sm rounded-sm"
        >
          {submitError instanceof Error ? submitError.message : 'Une erreur est survenue lors de la création du projet.'}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Stacked Form Cards (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: CLIENTE */}
          <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#D9D4CA]/50 pb-3">
              <h2 className="font-heading text-xl text-[#061938] flex items-center gap-2">
                <User size={18} className="text-[#936C3E]" />
                Cliente
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewCustomer(!isCreatingNewCustomer);
                  setSelectedCustomerId('');
                }}
                className="text-xs text-[#936C3E] hover:text-[#061938] transition-colors font-medium underline underline-offset-2"
              >
                {isCreatingNewCustomer ? '← Sélectionner une cliente existante' : '+ Créer une nouvelle cliente'}
              </button>
            </div>

            {!isCreatingNewCustomer ? (
              <div className="space-y-3">
                <label
                  htmlFor="customer-select"
                  className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium"
                >
                  Rechercher une cliente existante
                </label>
                <div className="relative">
                  <select
                    id="customer-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E] appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionnez une cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C697A]"
                  />
                </div>

                {/* Display selected client card info */}
                {selectedCustomer && (
                  <div className="mt-4 p-3 bg-[#F6F2E9]/60 border border-[#D9D4CA] rounded-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#061938] text-[#C5B190] font-headline text-sm font-semibold flex items-center justify-center shrink-0">
                      {selectedCustomer.firstName.charAt(0)}
                      {selectedCustomer.lastName.charAt(0)}
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-[#061938] text-sm">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-[#5C697A]">{selectedCustomer.email}</p>
                      {selectedCustomer.phone && <p className="text-[#8A877F]">{selectedCustomer.phone}</p>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Inline new customer fields */
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="new-customer-firstname"
                      className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5"
                    >
                      Prénom *
                    </label>
                    <input
                      id="new-customer-firstname"
                      type="text"
                      value={newCustomer.firstName}
                      onChange={(e) => setNewCustomer((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Hanitra"
                      className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3 py-2 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-customer-lastname"
                      className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5"
                    >
                      Nom *
                    </label>
                    <input
                      id="new-customer-lastname"
                      type="text"
                      value={newCustomer.lastName}
                      onChange={(e) => setNewCustomer((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Rakoto"
                      className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3 py-2 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="new-customer-email"
                      className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5"
                    >
                      Email *
                    </label>
                    <input
                      id="new-customer-email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="hanitra.rakoto@example.mg"
                      className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3 py-2 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-customer-phone"
                      className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5"
                    >
                      Téléphone
                    </label>
                    <input
                      id="new-customer-phone"
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+261 34 00 123 45"
                      className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3 py-2 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {errors.customer && (
              <p className="mt-2 text-xs text-[#A64A43] font-medium">{errors.customer}</p>
            )}
          </section>

          {/* CARD 2: CRÉATION */}
          <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9D4CA]/50 pb-3">
              <h2 className="font-heading text-xl text-[#061938] flex items-center gap-2">
                <Scissors size={18} className="text-[#936C3E]" />
                Création
              </h2>
            </div>

            {/* Titre du projet */}
            <div>
              <label htmlFor="project-title" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                Titre du projet *
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Robe de mariée — Mme Rakoto"
                className={`w-full bg-white border rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:ring-1 ${
                  errors.title
                    ? 'border-[#A64A43] focus:border-[#A64A43] focus:ring-[#A64A43]'
                    : 'border-[#D9D4CA] focus:border-[#936C3E] focus:ring-[#936C3E]'
                }`}
              />
              {errors.title && <p className="mt-1.5 text-xs text-[#A64A43] font-medium">{errors.title}</p>}
            </div>

            {/* Type de vêtement chip selector */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-2">
                Type de vêtement
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de vêtement">
                {GARMENT_TYPE_OPTIONS.map((type) => {
                  const isSelected = garmentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setGarmentType(type)}
                      className={`px-3.5 py-2 text-xs tracking-wider uppercase font-medium rounded-sm border transition-colors ${
                        isSelected
                          ? 'bg-[#061938] text-white border-[#061938]'
                          : 'bg-white text-[#061938] border-[#D9D4CA] hover:border-[#936C3E]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Événement & Date de l'événement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-occasion" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                  Événement
                </label>
                <div className="relative">
                  <select
                    id="project-occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E] appearance-none cursor-pointer"
                  >
                    {OCCASION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C697A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-event-date" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                  Date de l&apos;événement
                </label>
                <div className="relative">
                  <input
                    id="project-event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
                  />
                </div>
              </div>
            </div>

            {/* Description / notes de consultation */}
            <div>
              <label htmlFor="project-description" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                Description / notes de consultation
              </label>
              <textarea
                id="project-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails du style souhaité, tissus envisagés, exigences de coupe, mensurations spécifiques..."
                className="w-full bg-white border border-[#D9D4CA] rounded-sm p-3 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E]"
              />
            </div>
          </section>

          {/* CARD 3: BUDGET & DEVIS */}
          <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9D4CA]/50 pb-3">
              <h2 className="font-heading text-xl text-[#061938] flex items-center gap-2">
                <FileText size={18} className="text-[#936C3E]" />
                Budget &amp; devis
              </h2>
            </div>

            {/* Budget indicatif segmented chips */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-2">
                Budget indicatif
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Budget indicatif">
                {BUDGET_RANGE_OPTIONS.map((range) => {
                  const isSelected = budgetRange === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setBudgetRange(range)}
                      className={`px-3 py-2 text-xs tracking-wider uppercase font-medium rounded-sm border text-center transition-colors ${
                        isSelected
                          ? 'bg-[#061938] text-white border-[#061938]'
                          : 'bg-white text-[#061938] border-[#D9D4CA] hover:border-[#936C3E]'
                      }`}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Devis associé select (optional) */}
            <div>
              <label htmlFor="associated-quote" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                Devis associé
              </label>
              <div className="relative">
                <select
                  id="associated-quote"
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E] appearance-none cursor-pointer"
                >
                  <option value="">Aucun devis associé</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quoteNumber} — {Number(q.total).toLocaleString('fr-FR')} Ar {q.customerName ? `(${q.customerName})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C697A]"
                />
              </div>
              <p className="mt-1.5 text-xs text-[#5C697A]">
                Facultatif — peut être rattaché plus tard.
              </p>
            </div>
          </section>

          {/* CARD 4: ATELIER */}
          <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9D4CA]/50 pb-3">
              <h2 className="font-heading text-xl text-[#061938] flex items-center gap-2">
                <Users size={18} className="text-[#936C3E]" />
                Atelier
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Couturière assignée */}
              <div>
                <label htmlFor="assigned-staff" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                  Couturière assignée
                </label>
                <div className="relative">
                  <select
                    id="assigned-staff"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E] appearance-none cursor-pointer"
                  >
                    <option value="">Non assignée</option>
                    {assignees.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.email} ({staff.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C697A]"
                  />
                </div>
              </div>

              {/* Étape initiale */}
              <div>
                <label htmlFor="initial-stage" className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-1.5">
                  Étape initiale
                </label>
                <div className="relative">
                  <select
                    id="initial-stage"
                    value={initialStage}
                    onChange={(e) => setInitialStage(e.target.value as CreationProjectStage)}
                    className="w-full bg-white border border-[#D9D4CA] rounded-sm px-3.5 py-2.5 text-sm text-[#061938] focus:outline-none focus:border-[#936C3E] focus:ring-1 focus:ring-[#936C3E] appearance-none cursor-pointer"
                  >
                    {CREATION_PROJECT_STAGES_ORDER.map((stage) => (
                      <option key={stage} value={stage}>
                        {ADMIN_CREATION_STAGE_LABELS[stage]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C697A]"
                  />
                </div>
              </div>
            </div>

            {/* Photos d'inspiration dropzone */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-[#5C697A] font-medium mb-2">
                Photos d&apos;inspiration
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    addInspirationPhotos(e.target.files);
                  }
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Ajouter des photos d'inspiration"
                className="border-2 border-dashed border-[#D9D4CA] rounded-sm p-6 text-center cursor-pointer hover:border-[#936C3E] hover:bg-[#F6F2E9]/40 transition-colors"
              >
                <Upload size={24} className="mx-auto text-[#936C3E] mb-2" />
                <p className="text-sm text-[#061938] font-medium">
                  Cliquez ou déposez vos images ici
                </p>
                <p className="text-xs text-[#5C697A] mt-1">
                  JPG, PNG — jusqu&apos;à 5 photos
                </p>
              </div>

              {/* Photos preview list */}
              {inspirationPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {inspirationPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group border border-[#D9D4CA] rounded-sm overflow-hidden bg-[#F6F2E9] aspect-square flex items-center justify-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeInspirationPhoto(photo.id);
                        }}
                        aria-label={`Supprimer ${photo.name}`}
                        className="absolute top-1 right-1 p-1 bg-white/90 text-[#A64A43] rounded-sm hover:bg-[#A64A43] hover:text-white transition-colors shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky Summary Column (4/12) */}
        <aside className="lg:col-span-4 sticky top-6 space-y-6">
          <div className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm">
            <h2 className="font-heading text-xl text-[#061938] border-b border-[#D9D4CA]/50 pb-3 mb-4">
              Récapitulatif
            </h2>

            <dl className="space-y-3.5 text-xs">
              <div className="flex justify-between items-start gap-2">
                <dt className="text-[#5C697A] uppercase tracking-wider font-medium">Cliente</dt>
                <dd className="font-semibold text-[#061938] text-right">{summaryClientName}</dd>
              </div>

              <div className="flex justify-between items-start gap-2">
                <dt className="text-[#5C697A] uppercase tracking-wider font-medium">Type</dt>
                <dd className="font-semibold text-[#061938] text-right">{summaryGarment}</dd>
              </div>

              <div className="flex justify-between items-start gap-2">
                <dt className="text-[#5C697A] uppercase tracking-wider font-medium">Événement &amp; date</dt>
                <dd className="font-semibold text-[#061938] text-right">{summaryEvent}</dd>
              </div>

              <div className="flex justify-between items-start gap-2">
                <dt className="text-[#5C697A] uppercase tracking-wider font-medium">Budget</dt>
                <dd className="font-semibold text-[#061938] text-right">{summaryBudget}</dd>
              </div>

              <div className="flex justify-between items-start gap-2">
                <dt className="text-[#5C697A] uppercase tracking-wider font-medium">Couturière</dt>
                <dd className="font-semibold text-[#061938] text-right">{summaryAssigneeName}</dd>
              </div>
            </dl>

            {/* Mini 6-step pipeline preview */}
            <div className="mt-6 pt-5 border-t border-[#D9D4CA]">
              <h3 className="text-xs uppercase tracking-wider text-[#5C697A] font-headline font-semibold mb-3">
                Parcours du projet
              </h3>
              <ol className="space-y-2">
                {CREATION_PROJECT_STAGES_ORDER.map((stage, idx) => {
                  const isCurrent = idx === currentStageIndex;
                  const isPassed = idx < currentStageIndex;
                  return (
                    <li
                      key={stage}
                      className={`flex items-center gap-2.5 text-xs py-1 px-2 rounded-sm transition-colors ${
                        isCurrent
                          ? 'bg-[#F6F2E9] text-[#936C3E] font-semibold border-l-2 border-[#936C3E]'
                          : isPassed
                            ? 'text-[#46745A]'
                            : 'text-[#8A877F]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-headline ${
                          isCurrent
                            ? 'bg-[#936C3E] text-white'
                            : isPassed
                              ? 'bg-[#46745A] text-white'
                              : 'bg-[#D8D3C8] text-[#5C697A]'
                        }`}
                      >
                        {isPassed ? <Check size={10} /> : idx + 1}
                      </span>
                      <span>{ADMIN_CREATION_STAGE_LABELS[stage]}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Action buttons */}
            <div className="mt-6 pt-5 border-t border-[#D9D4CA] space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="w-full bg-[#061938] text-white hover:bg-[#0C2650] disabled:bg-[#061938]/60 py-3 text-xs uppercase tracking-widest font-headline font-medium rounded-sm shadow-sm transition-colors text-center"
              >
                {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="w-full text-center text-xs text-[#5C697A] hover:text-[#061938] underline underline-offset-2 transition-colors py-1"
              >
                Enregistrer comme brouillon
              </button>

              <p className="text-[11px] text-[#5C697A] text-center italic mt-2">
                La référence CRP-… sera générée à la création.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
