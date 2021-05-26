import { ChannelItemType } from '../../../models/interfaces';

export const configToChannel = (config: any): ChannelItemType => {
  return {
    ...config.config,
    config_id: config.config_id,
    created_time_ms: config.created_time_ms,
    last_updated_time_ms: config.last_updated_time_ms,
  };
};

export const configListToChannels = (configs: any[]): ChannelItemType[] => {
  return configs.map((config)=>configToChannel(config)) || []
}