"use client";

import { motion } from "framer-motion";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-bold font-display">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </motion.div>
      {actions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}
