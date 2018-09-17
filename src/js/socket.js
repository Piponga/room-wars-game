import io from 'socket.io-client';
const url = PRODUCTION ? 'https://arcane-lowlands-79462.herokuapp.com/' : 'http://localhost:5000';
const socket = io(url, {
    'reconnection': true,
    'reconnectionAttempts': 1,
    'reconnectionDelay': 1000,
    'timeout': 5000
});

export {socket};

