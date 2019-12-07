
import * as WS from 'ws';

export class SocketClient{
    id:            string;
    lastMessageId: string;

    private _client: WS;

    constructor(id: string, lastMessageId: string, client: WS){
        this.id            = id;
        this.lastMessageId = lastMessageId || '';
        this._client       = client;
    }
    
    sendMessage(msg: string){
        this._client.send(msg);
    }
}