import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get('predict')
  predict(@Request() req: any, @Query('q') q: string) {
    return this.transactionsService.predict(req.user.userId, q);
  }

  @Post()
  create(@Request() req: any, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get('summary')
  getSummary(@Request() req: any, @Query('month') month: string, @Query('year') year: string) {
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.transactionsService.getSummary(req.user.userId, currentMonth, currentYear);
  }

  @Get('export/csv')
  async exportCsv(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const { data } = await this.transactionsService.findAll(req.user.userId, { ...query, limit: 10000 });

    const csvRows = [
      ['Date', 'Type', 'Category', 'Amount', 'Description'],
      ...data.map(t => [
        t.date.toISOString(),
        t.type,
        t.category,
        t.amount,
        t.description || ''
      ])
    ];

    const csvString = csvRows.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvString);
  }

  @Get('export/pdf')
  async exportPdf(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const { data } = await this.transactionsService.findAll(req.user.userId, { ...query, limit: 10000 });
    console.log(`[Export] Generating PDF for user ${req.user.userId} with ${data.length} transactions`);
    const buffer = await this.transactionsService.generatePdfReport(req.user.userId, data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    res.send(buffer);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: any) {
    return this.transactionsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(req.user.userId, id, updateTransactionDto);
  }


  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.remove(req.user.userId, id);
  }
}
