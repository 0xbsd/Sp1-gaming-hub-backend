import { Server, Socket } from 'socket.io';
import { notificationService } from '../../services/notification.service';
import { SOCKET_EVENTS } from '../events';

export function notificationHandlers(io: Server, socket: Socket) {
  // Send pending notifications on connect
  socket.on('notifications:get', async () => {
    const notifications = await notificationService.getUnreadNotifications(
      socket.data.user.id
    );
    
    socket.emit('notifications:list', notifications);
  });
  
  // Mark notifications as read
  socket.on('notifications:markRead', async (notificationIds: string[]) => {
    await notificationService.markAsRead(socket.data.user.id, notificationIds);
    socket.emit('notifications:marked', { ids: notificationIds });
  });
  
  // Subscribe to specific notification types
  socket.on('notifications:subscribe', (types: string[]) => {
    types.forEach(type => {
      socket.join(`notify:${type}`);
    });
  });
}