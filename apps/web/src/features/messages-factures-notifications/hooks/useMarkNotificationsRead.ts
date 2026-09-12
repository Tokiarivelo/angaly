export const useMarkNotificationsRead = () => {
  const markAllRead = async () => {
    console.log('Marking all notifications as read');
    return new Promise(resolve => setTimeout(resolve, 300));
  };

  return { markAllRead };
};
