
import { ISocketMessage } from './ISocketMessage';

export interface IClientSocketMessage extends ISocketMessage{
    clientId: string;
}