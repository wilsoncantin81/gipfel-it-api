import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('ai')
  export class AiController {
  constructor(private readonly service: AiService) {}
  @Post('improve-text')
  async improveText(@Body() body: { text: string; context?: string; type?: string }) {
    return this.service.improveText(body?.text, body?.context, body?.type);
  }
}
