import WebSocket from 'ws';
import { EventEmitter } from 'events';

class WSClient extends EventEmitter {
    private static instance: WSClient | null = null;
    private ws: WebSocket | null = null;
    private serverAddress: string;
    private clientId: string;
    private timer: NodeJS.Timeout | null = null;

    private constructor(serverAddress: string, clientId: string) {
        super();
        this.serverAddress = serverAddress;
        this.clientId = clientId;
        this.timer = null;
    }

    public static getInstance(serverAddress: string, clientId: string): WSClient {
        if (!WSClient.instance) {
            WSClient.instance = new WSClient(serverAddress, clientId);
            WSClient.instance.connect()
              .then(() => {
                WSClient.instance!.timer = setInterval(() => {
                  WSClient.instance!.ping();
                }, 15000);
              });
        }
        return WSClient.instance;
    }

    public async connect(): Promise<void> {
        if (this.ws) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                const url = `ws://${this.serverAddress}/ws?clientId=${this.clientId}`;
                console.log(url, 'url')
                this.ws = new WebSocket(url, {
                  handshakeTimeout: 20000,
                });

                this.ws.on('open', () => {
                    console.log('WebSocket connected');
                    resolve();
                });

                this.ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    this.clearTimer()
                    this.close();
                    reject(error);
                });

                this.ws.on('close', () => {
                    console.log('WebSocket disconnected');
                    this.ws = null;
                    this.clearTimer()
                });

                this.ws.on('message', (data) => {
                    console.log('Received message:', data.toString());
                    // 在这里处理接收到的消息
                    this.emit('message', data.toString());
                });

                this.ws.on('pong', () => {
                    console.log('WebSocket pong received');
                });

            } catch (error) {
                console.error('Failed to connect:', error);
                this.clearTimer();
                reject(error);
            }
        });
    }

    public send(message: string): void {
        if (!this.ws) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(message);
    }

    clearTimer() {
        this.timer && clearInterval(this.timer!);
        this.timer = null;
    }
    public close(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.clearTimer();
    }
    public ping(): void {
        if (!this.ws) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.ping();
    }
}

// 导出一个获取实例的函数
export const getWSClient = () => {
    return WSClient.getInstance('34.67.156.195:12580', crypto.randomUUID());
};
