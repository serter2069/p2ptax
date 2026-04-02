import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface ChatMessage {
  room: string;
  text: string;
  from?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`[Chat] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    client.join(room);
    client.emit('joinedRoom', { room });
    console.log(`[Chat] ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ChatMessage) {
    this.server.to(data.room).emit('message', {
      from: data.from ?? client.id,
      text: data.text,
      room: data.room,
      ts: new Date().toISOString(),
    });
  }
}
