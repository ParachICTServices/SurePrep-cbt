import React from 'react';

type Props = {
  title?: string;
  description?: string;
};

export default function ComingSoon({ title = 'Coming Soon', description = 'This feature is coming soon.' }: Props) {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
      <div className="mt-6">
        <span className="inline-block px-4 py-2 bg-amber-500 text-white rounded-full font-bold">Premium — Coming Soon</span>
      </div>
    </div>
  );
}
