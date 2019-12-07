'use strict';

import * as http from 'http';
import * as WS   from 'ws';
import uuid      from 'uuid/v4';

import { SocketChannel } from './SocketChannel';
import { SocketClient }  from './SocketClient';

export class SocketServer{
    private INTERVAL: number = 5000; // 5 seconds

    private _server!: WS.Server;
    private _channels: { [key: string]: SocketChannel } = { };

    constructor(server: http.Server){
        this._server = new WS.Server({ server });

        this._server.on('connection', this.handleConnection);

        setInterval(this._pruneClients.bind(this), this.INTERVAL);

        return this;
    }

    messageClients(channel: string, type: string, data: any): void{
        
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

        const channel: string|null = url.searchParams.get('channel'),
                id:      string      = url.searchParams.get('id') || uuid();

        if(!(channel && id)) return ws.terminate();

        const socketClient = new SocketClient(id, ws);
        if(!this._channels[channel]){
            const socketChannel = this._channels[channel] = new SocketChannel();

            socketChannel.addClient(socketClient);
        }
        else{
            this._channels[channel].addClient(socketClient);
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
            this._channels[channel].removeClient(id);
        });
        ws.on('close', () => {
            this._channels[channel].removeClient(id);
        });

        ws.send(`{"type": "connection-accepted", "clientId": "${ id }"}`);


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