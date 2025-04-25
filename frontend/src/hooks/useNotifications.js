import { useNotification } from '../contexts/NotificationContext';

export const useNotifications = () => {
  const { addNotification, removeNotification, notifications } = useNotification();

  const showNotification = (message, type = 'info') => {
    addNotification({ message, type });
  };

  const clearNotification = (id) => {
    removeNotification(id);
  };

  return {
    notifications,
    showNotification,
    clearNotification
  };
};
