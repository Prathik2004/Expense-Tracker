import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { LendingService } from './lending.service';
import { CreateLendingDto } from './dto/create-lending.dto';
import { UpdateLendingDto } from './dto/update-lending.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('lending')
export class LendingController {
    constructor(private readonly lendingService: LendingService) { }

    @Post()
    create(@Request() req: any, @Body() createLendingDto: CreateLendingDto) {
        return this.lendingService.create(req.user.userId, createLendingDto);
    }

    @Get()
    findAll(@Request() req: any, @Query() query: any) {
        return this.lendingService.findAll(req.user.userId, query);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateLendingDto: UpdateLendingDto) {
        return this.lendingService.update(req.user.userId, id, updateLendingDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.lendingService.remove(req.user.userId, id);
    }
}
