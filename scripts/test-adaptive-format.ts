// Quick test to demonstrate adaptive formatting

const TB_IN_BYTES = 1024 ** 4;

const formatBytesAdaptive = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const GB_IN_BYTES = 1024 ** 3;
  const MB_IN_BYTES = 1024 ** 2;

  if (bytes >= TB_IN_BYTES) {
    const tbValue = bytes / TB_IN_BYTES;
    return tbValue >= 10 ? `${tbValue.toFixed(0)} TB` : `${tbValue.toFixed(1)} TB`;
  }

  if (bytes >= GB_IN_BYTES) {
    const gbValue = bytes / GB_IN_BYTES;
    return gbValue >= 10 ? `${gbValue.toFixed(0)} GB` : `${gbValue.toFixed(1)} GB`;
  }

  if (bytes >= MB_IN_BYTES) {
    const mbValue = bytes / MB_IN_BYTES;
    return mbValue >= 10 ? `${mbValue.toFixed(0)} MB` : `${mbValue.toFixed(1)} MB`;
  }

  const kbValue = bytes / 1024;
  return kbValue >= 10 ? `${kbValue.toFixed(0)} KB` : `${kbValue.toFixed(1)} KB`;
};

const formatBytesToTB = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 TB";
  const tbValue = bytes / TB_IN_BYTES;
  return tbValue >= 10 ? `${tbValue.toFixed(0)} TB` : `${tbValue.toFixed(1)} TB`;
};

// Real data from your database
const totalCommitted = 5_978_455_968_138; // 5.44 TB
const totalUsed = 1_093_232;              // 1.04 MB
const available = totalCommitted - totalUsed;

console.log('📊 Storage Display Comparison:\n');
console.log('OLD FORMAT (always TB):');
console.log(`  Used:      ${formatBytesToTB(totalUsed)} / ${formatBytesToTB(totalCommitted)}`);
console.log(`  Available: ${formatBytesToTB(available)}`);
console.log('');
console.log('NEW FORMAT (adaptive):');
console.log(`  Used:      ${formatBytesAdaptive(totalUsed)} / ${formatBytesToTB(totalCommitted)}`);
console.log(`  Available: ${formatBytesAdaptive(available)}`);
console.log('');
console.log('✅ Improvement:');
console.log('   Old: "0.0 TB" → invisible usage');
console.log('   New: "1.0 MB" → clearly visible!');
