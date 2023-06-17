export const notificationSocket = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userID;
        if (userId !== 'undefined') {
            socket.join(userId);
        }
        else {
            socket.disconnect();
        }
    });
};
