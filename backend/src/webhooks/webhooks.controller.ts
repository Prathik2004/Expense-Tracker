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
        const validApiKey = this.configService.get<string>('UPI_WEBHOOK_API_KEY');

        if (!apiKey || apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        if (!payload.message || !payload.userId) {
            throw new BadRequestException('Message and userId are required');
        }

        return this.webhooksService.processUpiSms(payload);
    }
}
