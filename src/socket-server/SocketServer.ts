'use strict';

import * as http from 'http';
import * as WS   from 'ws';
import uuid      from 'uuid/v4';

import { SocketChannel }  from './SocketChannel';
import { SocketClient }   from './SocketClient';
import { ISocketMessage } from './interfaces';

export class SocketServer{
    private INTERVAL: number = 5000; // 5 seconds
    private PATH:     string = 'websocket';

    private _server!: WS.Server;
    private _channels: { [key: string]: SocketChannel|null } = { };

    constructor(server: http.Server, path?: string){
        path && (this.PATH = path);

        this._server = new WS.Server({ server });

        this._server.on('connection', this.handleConnection.bind(this));

        setInterval(this._pruneClients.bind(this), this.INTERVAL);

        return this;
    }

    messageClients(channel: string, type: string, data: any): void{
        if(!this._channels[channel]) return;

        const socketChannel: SocketChannel = <SocketChannel>this._channels[channel];

        const socketMessage: ISocketMessage = {
            id:   uuid(),
            type: type,
            data: data
        }

        socketChannel.sendMessage(socketMessage);
    }

    getClientCount(): number{
        return this._server.clients.size;
    }

    handleConnection(ws: WS, req: Request): void{
        const exp = new RegExp(`^\/${ this.PATH }`, 'i');
        if(!exp.test(req.url)) return ws.close();

        const urlString = `http://localhost${ req.url }`;

        let url: URL;
        try{
            url = new URL(urlString);
        }
        catch(e){
            return ws.terminate();
        }

        const channel:       string|null = url.searchParams.get('channel'),
              clientId:      string      = url.searchParams.get('clientId')      || uuid(),
              lastMessageId: string      = url.searchParams.get('lastMessageId') || '';

        if(!(channel && clientId)) return ws.terminate();

        ws.send(`{"type": "connection-accepted", "clientId": "${ clientId }", "channel": ${ channel }}`);

        (<any>ws).id      = clientId;
        (<any>ws).channel = channel;

        const socketClient = new SocketClient(clientId, lastMessageId, ws);

        let socketChannel: SocketChannel;
        if(this._channels[channel]){
            socketChannel = <SocketChannel>this._channels[channel];
        }
        else{
            socketChannel = this._channels[channel] = new SocketChannel();
        }

        socketChannel.addClient(socketClient);


        /*
            =============
            CLIENT EVENTS
            =============
        */
        ws.on('message', (msg) => {
            ws.send(`{ "received": "${ msg }" }`);
        });
        ws.on('error', () => {
            socketChannel.removeClient(clientId);

            if(!socketChannel.clients.length){
                this._channels[channel] = null;
            }
        });
        ws.on('close', () => {
            socketChannel.removeClient(clientId);

            if(!socketChannel.clients.length){
                this._channels[channel] = null;
            }
        });

        /*
            =========
            HEARTBEAT
            =========
        */
        (<any>ws).isAlive = true;

        ws.on('pong', () => (<any>ws).isAlive = true);
    }
    

    /*
        ===============
        PRIVATE METHODS
        ===============
    */
    private _pruneClients(): void{
        this._server.clients.forEach(c => {
            if(!(<any>c).isAlive){
                return c.terminate();
            }

            (<any>c).isAlive = false;
            
            c.ping(null, false);
        });
    }
}