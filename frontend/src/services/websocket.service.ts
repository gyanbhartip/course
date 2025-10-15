/**
 * WebSocket service for real-time features
 * Handles WebSocket connections, reconnection, and message routing
 */

// Simple EventEmitter implementation for browser
class EventEmitter {
    private events: { [key: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listener: Function) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event: string, ...args: any[]) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}
import type {
    WebSocketMessage,
    NotificationMessage,
    ProgressUpdateMessage,
} from '../src/types';

export type WebSocketConnectionState =
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error';

export interface WebSocketServiceConfig {
    baseUrl: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    pingInterval: number;
}

class WebSocketService extends EventEmitter {
    private ws: WebSocket | null = null;
    private config: WebSocketServiceConfig;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pingTimer: NodeJS.Timeout | null = null;
    private state: WebSocketConnectionState = 'disconnected';
    private token: string | null = null;

    constructor(config: WebSocketServiceConfig) {
        super();
        this.config = config;
    }

    /**
     * Connect to WebSocket with authentication token
     */
    connect(token: string): void {
        if (this.state === 'connected' || this.state === 'connecting') {
            return;
        }

        this.token = token;
        this.state = 'connecting';
        this.emit('stateChange', this.state);

        try {
            const wsUrl = `${
                this.config.baseUrl
            }/notifications?token=${encodeURIComponent(token)}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
        } catch (error) {
            this.state = 'error';
            this.emit('stateChange', this.state);
            this.emit('error', error);
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        this.clearTimers();
        this.reconnectAttempts = 0;

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.state = 'disconnected';
        this.emit('stateChange', this.state);
    }

    /**
     * Send message to WebSocket
     */
    send(message: Record<string, unknown>): void {
        if (this.ws && this.state === 'connected') {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn(
                'WebSocket not connected, cannot send message:',
                message,
            );
        }
    }

    /**
     * Subscribe to course-specific updates
     */
    subscribeToCourse(courseId: string): void {
        this.send({
            type: 'subscribe_course',
            course_id: courseId,
        });
    }

    /**
     * Unsubscribe from course-specific updates
     */
    unsubscribeFromCourse(courseId: string): void {
        this.send({
            type: 'unsubscribe_course',
            course_id: courseId,
        });
    }

    /**
     * Send ping to keep connection alive
     */
    ping(): void {
        this.send({
            type: 'ping',
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get current connection state
     */
    getState(): WebSocketConnectionState {
        return this.state;
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.state === 'connected';
    }

    private handleOpen(): void {
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.emit('stateChange', this.state);
        this.emit('connected');

        // Start ping interval
        this.pingTimer = setInterval(() => {
            this.ping();
        }, this.config.pingInterval);
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            // Handle different message types
            switch (message.type) {
                case 'connection':
                    this.emit('connection', message);
                    break;
                case 'pong':
                    this.emit('pong', message);
                    break;
                case 'notification':
                case 'course_notification':
                case 'progress_notification':
                    this.emit('notification', message as NotificationMessage);
                    break;
                case 'progress_updated':
                    this.emit(
                        'progressUpdate',
                        message as ProgressUpdateMessage,
                    );
                    break;
                case 'subscription_confirmed':
                    this.emit('subscriptionConfirmed', message);
                    break;
                case 'unsubscription_confirmed':
                    this.emit('unsubscriptionConfirmed', message);
                    break;
                case 'error':
                    this.emit('error', message);
                    break;
                default:
                    this.emit('message', message);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.emit('error', error);
        }
    }

    private handleClose(event: CloseEvent): void {
        this.clearTimers();
        this.state = 'disconnected';
        this.emit('stateChange', this.state);
        this.emit('disconnected', event);

        // Attempt to reconnect if not manually disconnected
        if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.config.maxReconnectAttempts
        ) {
            this.scheduleReconnect();
        }
    }

    private handleError(error: Event): void {
        this.state = 'error';
        this.emit('stateChange', this.state);
        this.emit('error', error);
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
            if (this.token) {
                this.reconnectAttempts++;
                this.connect(this.token);
            }
        }, this.config.reconnectInterval);
    }

    private clearTimers(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
}

// Create singleton instance
const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost/ws';
const wsService = new WebSocketService({
    baseUrl: wsBaseUrl,
    reconnectInterval: 3000, // 3 seconds
    maxReconnectAttempts: 5,
    pingInterval: 30000, // 30 seconds
});

export default wsService;
