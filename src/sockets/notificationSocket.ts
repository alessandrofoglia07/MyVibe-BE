import { Server, Socket } from 'socket.io';

export const notificationSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {

        const userId = socket.handshake.query.userID as string;

        if (userId !== 'undefined') {
            socket.join(userId);
        } else {
            socket.disconnect();
        }
    });
};