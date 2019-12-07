'use strict';

import * as http from 'http';
import * as WS   from 'ws';
import uuid      from 'uuid/v4';

import { SocketChannel } from './SocketChannel';
import { SocketClient }  from './SocketClient';
import { ISocketMessage } from './interfaces';

export class SocketServer{
    private INTERVAL: number = 5000; // 5 seconds

    private _server!: WS.Server;
    private _channels: { [key: string]: SocketChannel|null } = { };

    constructor(server: http.Server){
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
        // Socket clients must provide a client slug for channel notifications
        // if(!req.url.includes('/websocket/')) return ws.close();

        const urlString = `http://localhost${ req.url }`;

        let url: URL;
        try{
            url = new URL(urlString);
        }
        catch(e){
            return ws.terminate();
        }

        const channel:  string|null = url.searchParams.get('channel'),
              clientId: string      = url.searchParams.get('clientId') || uuid();

        if(!(channel && clientId)) return ws.terminate();

        (<any>ws).id      = clientId;
        (<any>ws).channel = channel;

        const socketClient = new SocketClient(clientId, ws);
        if(this._channels[channel]){
            (<SocketChannel>this._channels[channel]).addClient(socketClient);
        }
        else{
            const socketChannel = this._channels[channel] = new SocketChannel();
    
            socketChannel.addClient(socketClient);
        }


        /*
            =============
            CLIENT EVENTS
            =============
        */
        ws.on('message', (msg) => {
            ws.send(`{ "received": "${ msg }" }`);
        });
        ws.on('error', () => {
            const socketChannel: SocketChannel = <SocketChannel>this._channels[channel];

            socketChannel.removeClient(clientId);

            if(socketChannel.clients.length){
                this._channels[channel] = null;
            }
        });
        ws.on('close', () => {
            const socketChannel: SocketChannel = <SocketChannel>this._channels[channel];

            socketChannel.removeClient(clientId);

            if(socketChannel.clients.length){
                this._channels[channel] = null;
            }
        });

        ws.send(`{"type": "connection-accepted", "clientId": "${ clientId }"}`);

        console.log('Connection accepted');

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