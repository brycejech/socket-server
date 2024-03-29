
import { SocketClient }   from './SocketClient';
import { ISocketMessage } from './interfaces';

export class SocketChannel{

    clients:  SocketClient[]   = [];
    messages: ISocketMessage[] = [];

    sendMessage(socketMessage: ISocketMessage): void{
        this.messages.push(socketMessage);

        for(let i = 0, len = this.clients.length; i < len; i++){
            const client: SocketClient = this.clients[i];

            client.sendMessage(socketMessage);

            client.lastMessageId = socketMessage.id;
        }
    }

    addClient(client: SocketClient): void{
        this.clients.push(client);

        if(client.lastMessageId){
            const messageIndex: number = this.getMessageIndex(client.lastMessageId);
            
            const messagesToSend: ISocketMessage[] = ~messageIndex
                ? this.messages.slice(messageIndex + 1)
                : this.messages;

            for(let i = 0, len = messagesToSend.length; i < len; i++){
                const message: ISocketMessage = messagesToSend[i];

                client.sendMessage(message);

                client.lastMessageId = message.id;
            }
        }
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

    getMessage(id: string): ISocketMessage|undefined{
        return this.messages.find(m => m.id === id);
    }

    getMessageIndex(id: string): number{
        return this.messages.findIndex(m => m.id === id);
    }
}