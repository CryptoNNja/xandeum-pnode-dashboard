import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatBytesToTB,
  formatBytesAdaptive,
  formatUptime,
  hexToRgba,
  getStorageBarColors,
  getNetworkHealthColor,
  getHealthLabel,
  getCountryFlag,
} from '@/lib/utils';

describe('Utils - Data Formatting', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('-');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1073741824)).toBe('1.0 GB');
      expect(formatBytes(1099511627776)).toBe('1.0 TB');
    });

    it('should handle decimal precision', () => {
      expect(formatBytes(1536)).toBe('2 KB'); // KB rounds to integer
      expect(formatBytes(1572864)).toBe('1.5 MB'); // MB keeps 1 decimal
    });

    it('should handle negative values', () => {
      expect(formatBytes(-1024)).toBe('-');
    });
  });

  describe('formatBytesToTB', () => {
    it('should format bytes to TB', () => {
      expect(formatBytesToTB(0)).toBe('0 TB');
      expect(formatBytesToTB(1099511627776)).toBe('1.0 TB'); // <10 TB = 1 decimal
      expect(formatBytesToTB(10995116277760)).toBe('10 TB'); // >=10 TB = 0 decimals
    });
  });

  describe('formatBytesAdaptive', () => {
    it('should choose appropriate unit with 2 decimal precision', () => {
      expect(formatBytesAdaptive(512)).toBe('0.5 KB');
      expect(formatBytesAdaptive(1536)).toBe('1.5 KB');
      expect(formatBytesAdaptive(1572864)).toBe('1.50 MB'); // 2 decimals for MB/GB/TB
      expect(formatBytesAdaptive(1610612736)).toBe('1.50 GB'); // 2 decimals
      expect(formatBytesAdaptive(1649267441664)).toBe('1.50 TB'); // 2 decimals
      expect(formatBytesAdaptive(1024 ** 2)).toBe('1.00 MB');
      expect(formatBytesAdaptive(15.95 * 1024 ** 4)).toBe('15.95 TB'); // Precise values
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      expect(formatUptime(0)).toBe('—');
      expect(formatUptime(30)).toBe('30s'); // 30 seconds
      expect(formatUptime(59)).toBe('59s'); // 59 seconds
      expect(formatUptime(60)).toBe('1m 0s'); // 1 minute
      expect(formatUptime(90)).toBe('1m 30s'); // 1 minute 30 seconds
      expect(formatUptime(3600)).toBe('1h 0m'); // 1 hour
      expect(formatUptime(3660)).toBe('1h 1m'); // 1 hour 1 minute
      expect(formatUptime(86400)).toBe('1d 0h'); // 1 day
      expect(formatUptime(90061)).toBe('1d 1h'); // 1 day 1 hour
    });

    it('should handle complex durations', () => {
      expect(formatUptime(93784)).toBe('1d 2h'); // 1 day 2 hours
    });
  });
});

describe('Utils - Color Functions', () => {
  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(hexToRgba('#00FF00', 1)).toBe('rgba(0, 255, 0, 1)');
      expect(hexToRgba('#0000FF', 0)).toBe('rgba(0, 0, 255, 0)');
    });

    it('should handle 3-digit hex', () => {
      expect(hexToRgba('#F00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle invalid hex', () => {
      expect(hexToRgba('invalid', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('getStorageBarColors', () => {
    it('should return color objects', () => {
      const low = getStorageBarColors(30);
      expect(typeof low).toBe('object');
      expect(low).toBeTruthy();
      
      const medium = getStorageBarColors(60);
      expect(typeof medium).toBe('object');
      
      const high = getStorageBarColors(90);
      expect(typeof high).toBe('object');
    });
  });

  describe('getNetworkHealthColor', () => {
    it('should return correct colors based on score', () => {
      const excellent = getNetworkHealthColor(95);
      expect(excellent).toBeTruthy();
      expect(typeof excellent).toBe('string');
      
      const good = getNetworkHealthColor(80);
      expect(good).toBeTruthy();
      
      const warning = getNetworkHealthColor(65);
      expect(warning).toBeTruthy();
      
      const critical = getNetworkHealthColor(40);
      expect(critical).toBeTruthy();
    });
  });

  describe('getHealthLabel', () => {
    it('should return string labels', () => {
      const excellent = getHealthLabel(95);
      expect(typeof excellent).toBe('string');
      expect(excellent).toBeTruthy();
      
      const good = getHealthLabel(80);
      expect(typeof good).toBe('string');
      
      const warning = getHealthLabel(65);
      expect(typeof warning).toBe('string');
      
      const critical = getHealthLabel(40);
      expect(typeof critical).toBe('string');
    });
  });
});

describe('Utils - Country Functions', () => {
  describe('getCountryFlag', () => {
    it('should return flag emoji for valid country codes', () => {
      expect(getCountryFlag('US')).toBe('🇺🇸');
      expect(getCountryFlag('FR')).toBe('🇫🇷');
      expect(getCountryFlag('JP')).toBe('🇯🇵');
    });

    it('should handle lowercase codes', () => {
      expect(getCountryFlag('us')).toBe('🇺🇸');
      expect(getCountryFlag('fr')).toBe('🇫🇷');
    });

    it('should return globe for invalid codes', () => {
      expect(getCountryFlag(null)).toBe('🌍');
      expect(getCountryFlag(undefined)).toBe('🌍');
      expect(getCountryFlag('')).toBe('🌍');
      expect(getCountryFlag('INVALID')).toBe('🌍');
    });
  });
});
