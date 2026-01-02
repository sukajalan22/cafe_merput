import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const alertStyles = {
  warning: {
    container: 'bg-orange-50 border-l-4 border-orange-400',
    icon: 'text-orange-400',
    title: 'text-orange-800',
    description: 'text-orange-700'
  },
  info: {
    container: 'bg-blue-50 border-l-4 border-blue-400',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    description: 'text-blue-700'
  },
  success: {
    container: 'bg-green-50 border-l-4 border-green-400',
    icon: 'text-green-400',
    title: 'text-green-800',
    description: 'text-green-700'
  },
  error: {
    container: 'bg-red-50 border-l-4 border-red-400',
    icon: 'text-red-400',
    title: 'text-red-800',
    description: 'text-red-700'
  }
};

const icons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle
};

export function Alert({ type = 'info', title, description, children, className = '' }: AlertProps) {
  const styles = alertStyles[type];
  const IconComponent = icons[type];

  return (
    <div className={`p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {title}
          </h3>
          {description && (
            <div className={`mt-2 text-sm ${styles.description}`}>
              <p>{description}</p>
            </div>
          )}
          {children && (
            <div className={`mt-2 text-sm ${styles.description}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}