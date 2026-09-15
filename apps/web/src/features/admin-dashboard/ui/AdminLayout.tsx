'use client';

import React from 'react';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 bg-ivory p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
};
