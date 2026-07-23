import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { google } from 'googleapis';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { SystemConfig, SystemConfigDocument } from '../schemas/system-config.schema';

@Injectable()
export class GoogleSheetsSyncService {
  private readonly logger = new Logger(GoogleSheetsSyncService.name);
  private readonly spreadsheetId: string;
  private readonly sheetName = 'Transactions';
  private readonly sheetHeaders = [
    'Date',
    'Month',
    'Year',
    'Type',
    'Category',
    'Description',
    'Payment Method',
    'Amount',
    'MongoId',
  ];

  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(SystemConfig.name) private readonly systemConfigModel: Model<SystemConfigDocument>,
    private readonly configService: ConfigService,
  ) {
    this.spreadsheetId = this.normalizeSpreadsheetId(this.configService.get<string>('GOOGLE_SHEET_ID') || '');
    this.logger.log(`Google Sheets spreadsheet ID resolved to: ${this.spreadsheetId || '(not configured)'}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async syncDaily(): Promise<any> {
    this.logger.log('Google Sheets cron triggered');
    try {
      const result = await this.sync('cron');
      this.logger.log(`Google Sheets cron completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Google Sheets cron failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async sync(trigger: 'manual' | 'cron' = 'manual'): Promise<any> {
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not configured');
    }

    const auth = await this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const sheetId = await this.ensureSheet(sheets, spreadsheet.data.spreadsheetId!);

    const [transactions, existingRows, currentMongoIds] = await Promise.all([
      this.loadTransactions(trigger),
      this.loadSheetRows(sheets),
      this.loadMongoIds(),
    ]);

    const currentMongoIdSet = new Set(currentMongoIds);
    const rowIndexByMongoId = new Map(existingRows.map((row, index) => [row[8], index + 2]));
    const rowsToAppend: string[][] = [];
    const rowsToUpdate: Array<{ range: string; values: string[][] }> = [];
    const rowsToDelete: number[] = [];

    for (const transaction of transactions) {
      const row = this.composeTransactionRow(transaction);
      const mongoId = transaction._id?.toString();
      const existingRowIndex = rowIndexByMongoId.get(mongoId);

      if (existingRowIndex) {
        rowsToUpdate.push({
          range: `${this.sheetName}!A${existingRowIndex}:I${existingRowIndex}`,
          values: [row],
        });
        rowIndexByMongoId.delete(mongoId);
      } else {
        rowsToAppend.push(row);
      }
    }

    for (const [mongoId, index] of rowIndexByMongoId.entries()) {
      if (!mongoId || currentMongoIdSet.has(mongoId)) {
        continue;
      }
      rowsToDelete.push(index);
    }

    if (rowsToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: rowsToUpdate.map(update => ({ range: update.range, values: update.values })),
        },
      });
    }

    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:I`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rowsToAppend,
        },
      });
    }

    if (rowsToDelete.length > 0) {
      const sortedRows = [...rowsToDelete].sort((a, b) => b - a);
      for (const rowIndex of sortedRows) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowIndex - 1, endIndex: rowIndex } } }],
          },
        });
      }
    }

    await this.setLastSyncTime();

    return {
      inserted: rowsToAppend.length,
      updated: rowsToUpdate.length,
      deleted: rowsToDelete.length,
      synced: true,
    };
  }

  async syncManual(): Promise<any> {
    return this.sync('manual');
  }

  private normalizeSpreadsheetId(value: string): string {
    const trimmed = (value || '').trim().replace(/^['"]|['"]$/g, '');
    if (!trimmed) {
      return '';
    }

    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match?.[1]) {
      return match[1];
    }

    return trimmed;
  }

  private async getAuthClient() {
    const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    if (!clientEmail || !privateKey) {
      throw new Error('Google service account credentials are not configured');
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await auth.authorize();
    return auth;
  }

  private async ensureSheet(sheets: any, spreadsheetId: string): Promise<number> {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = response.data.sheets?.find((item: any) => item.properties?.title === this.sheetName);

    if (sheet) {
      return sheet.properties!.sheetId!;
    }

    const createResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: this.sheetName } } }],
      },
    });

    const createdSheetId = createResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (!createdSheetId) {
      throw new Error('Unable to create the Transactions sheet');
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.sheetName}!A1:I1`,
      valueInputOption: 'RAW',
      requestBody: { values: [this.sheetHeaders] },
    });

    return createdSheetId;
  }

  private async loadTransactions(trigger: 'manual' | 'cron' = 'manual'): Promise<TransactionDocument[]> {
    const lastSyncTime = await this.getLastSyncTime();
    const query = this.buildTransactionQuery(lastSyncTime, trigger);

    return this.transactionModel.find(query).sort({ date: 1 }).exec();
  }

  private buildTransactionQuery(lastSyncTime: Date | null, trigger: 'manual' | 'cron' = 'manual'): any {
    if (trigger === 'cron') {
      return {};
    }

    if (!lastSyncTime) {
      return {};
    }

    return { updatedAt: { $gte: lastSyncTime } };
  }

  private async loadMongoIds(): Promise<string[]> {
    const documents = await this.transactionModel.find({}).select('_id').lean().exec();
    return documents.map(document => document._id?.toString() || '').filter(Boolean);
  }

  private async loadSheetRows(sheets: any): Promise<Array<string[]>> {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A:Z`,
    });

    const rows = (response.data.values || []).slice(1);
    return rows.map((row: any[]) => row as string[]);
  }

  private async getLastSyncTime(): Promise<Date | null> {
    const config = await this.systemConfigModel.findOne({ key: 'google_sheets_last_sync' }).lean().exec();
    if (!config?.value?.lastSyncTime) {
      return null;
    }
    return new Date(config.value.lastSyncTime);
  }

  private async setLastSyncTime(): Promise<void> {
    await this.systemConfigModel.updateOne(
      { key: 'google_sheets_last_sync' },
      { $set: { key: 'google_sheets_last_sync', value: { lastSyncTime: new Date().toISOString() } } },
      { upsert: true },
    );
  }

  private composeTransactionRow(transaction: TransactionDocument): string[] {
    const date = transaction.date ? new Date(transaction.date) : new Date();
    return [
      formatDate(date),
      formatMonth(date),
      String(date.getFullYear()),
      capitalize(transaction.type || ''),
      transaction.category || '',
      transaction.description || '',
      (transaction as any).paymentMethod || '',
      transaction.amount || 0,
      transaction._id?.toString() || '',
    ];
  }
}

function formatDate(date: Date): string {
  return `${date.getDate()}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
}

function formatMonth(date: Date): string {
  return `${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
