import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ timestamps: true })
export class SystemConfig {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ type: Object })
  value: any;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
