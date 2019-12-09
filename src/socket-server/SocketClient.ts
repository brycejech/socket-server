
import * as WS from 'ws';
import { ISocketMessage, IClientSocketMessage } from './interfaces';

export class SocketClient{
    id:            string;
    lastMessageId: string;

    private _client: WS;

    constructor(id: string, lastMessageId: string, client: WS){
        this.id            = id;
        this.lastMessageId = lastMessageId || '';
        this._client       = client;
    }
    
    sendMessage(socketMessage: ISocketMessage){
        const clientMessage: IClientSocketMessage = {
            id:       socketMessage.id,
            clientId: this.id,
            channel:  socketMessage.channel,
            type:     socketMessage.type,
            data:     socketMessage.data
        }

        try{
            const messageString = JSON.stringify(clientMessage);

            this._client.send(messageString);
        }
        catch(e){
            console.error('Error serializing socket message');
            console.error(e.message);
        }
    }
}