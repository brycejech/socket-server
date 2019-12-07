
import * as http        from 'http';
import { SocketServer } from './socket-server';
import { ISocketMessage } from './socket-server/interfaces';

const httpServer   = http.createServer(requestHandler),
      socketServer = new SocketServer(httpServer);

function requestHandler(req: http.IncomingMessage, res: http.ServerResponse){
    let body: string = '';
    req.on('data', (chunk: any) => {
        body += chunk;
    });

    req.on('end', () => {
        let data: any;
        try{
            data = JSON.parse(body);
        }
        catch(e){
            return clientError('Error deserializing request', res);
        }

        const { channel, message }: { channel: string, message: any } = data;

        if(!(channel && message)){
            return clientError('Missing channel or message props', res);
        }

        socketServer.messageClients(channel, 'test', message);

        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(`{"message": "OK", "received": ${ JSON.stringify(data) }}`);
        res.end();
    });
}

function clientError(msg: string, res: http.ServerResponse){
    res.writeHead(400, {"Content-Type": "application/json"});
    res.write(`{"message": "${ msg }"}`);
    res.end();
}

httpServer.listen(9999, () => console.log('Node HTTP server listening on 9999'));