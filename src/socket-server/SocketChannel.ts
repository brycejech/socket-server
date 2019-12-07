
import { SocketClient } from './SocketClient';

export class SocketChannel{

    clients: SocketClient[];

    constructor(){
        this.clients = [];
    }

    sendMessage(msg: string): void{
        this.clients.forEach((c: SocketClient) => {
            c.sendMessage(msg);
        });
    }

    addClient(client: SocketClient): void{
        const existingClient: SocketClient|undefined = this.getClient(client.id);

        if(existingClient) return;

        this.clients.push(client);
    }

    removeClient(id: string): void{
        const idx = this.clients.findIndex(c => c.id === id);
        if(~idx){
            this.clients.splice(idx, 1);
        }
    }

    getClient(id: string): SocketClient|undefined{
        return this.clients.find(c => c.id === id);
    }
}