import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(
        @MessageBody() userId: string,
        @ConnectedSocket() client: Socket,
    ) {
        if (userId) {
            client.join(userId);
            console.log(`Client ${client.id} joined room ${userId}`);
        }
    }

    // Method to be called by other services to emit events to a specific user
    emitToUser(userId: string, event: string, data: any) {
        this.server.to(userId).emit(event, data);
    }
}
