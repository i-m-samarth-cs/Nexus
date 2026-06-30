const globalSessions = {}; // { [warRoomId]: { [userId]: sessionData } }

export function setupWarRoomSockets(io) {
  io.on('connection', (socket) => {
    
    socket.on('join_war_room', (warRoomId) => {
      socket.join(warRoomId);
      
      // Sync existing active sessions to the newly joined user
      if (globalSessions[warRoomId]) {
        for (const sessionData of Object.values(globalSessions[warRoomId])) {
          socket.emit('session_started', sessionData);
        }
      }
    });

    socket.on('leave_war_room', (warRoomId) => {
      socket.leave(warRoomId);
    });

    // sessionData should include userId, subjectName, duration, startTime
    socket.on('start_session', ({ warRoomId, sessionData }) => {
      if (!globalSessions[warRoomId]) globalSessions[warRoomId] = {};
      globalSessions[warRoomId][sessionData.userId] = sessionData;
      
      socket.to(warRoomId).emit('session_started', sessionData);
    });

    socket.on('session_tick', ({ warRoomId, sessionData }) => {
      if (globalSessions[warRoomId] && globalSessions[warRoomId][sessionData.userId]) {
        globalSessions[warRoomId][sessionData.userId] = sessionData;
      }
      socket.to(warRoomId).emit('session_ticked', sessionData);
    });

    socket.on('end_session', ({ warRoomId, userId }) => {
      if (globalSessions[warRoomId]) {
        delete globalSessions[warRoomId][userId];
      }
      socket.to(warRoomId).emit('session_ended', { userId });
    });
  });
}
