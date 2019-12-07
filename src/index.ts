
import * as http        from 'http';
import { SocketServer } from './socket-server';

const httpServer   = http.createServer(),
      socketServer = new SocketServer(httpServer);

httpServer.listen(9999, () => console.log('Node HTTP server listening on 9999'));