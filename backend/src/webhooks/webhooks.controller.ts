import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks')
export class WebhooksController {
    constructor(
        private readonly webhooksService: WebhooksService,
        private readonly configService: ConfigService,
    ) { }

    @Post('upi-sms')
    async handleUpiSms(
        @Headers('x-api-key') apiKey: string,
        @Body() payload: { sender: string; message: string; userId: string },
    ) {
        console.log(`[Webhook] Incoming request from sender: ${payload?.sender}`);
        const validApiKey = this.configService.get<string>('UPI_WEBHOOK_API_KEY');

        if (!apiKey || apiKey !== validApiKey) {
            console.error(`[Webhook] Unauthorized: API Key mismatch`);
            throw new UnauthorizedException('Invalid API Key');
        }

        if (!payload.message || !payload.userId) {
            console.error(`[Webhook] Bad Request: Missing message or userId`);
            throw new BadRequestException('Message and userId are required');
        }

        const result = await this.webhooksService.processUpiSms(payload);

        if (!result.success) {
            console.warn(`[Webhook] Processing failed: ${result.reason}`);
            throw new BadRequestException(result);
        }

        return result;
    }
}
