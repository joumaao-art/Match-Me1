export const CV_MAX_BYTES = 10 * 1024 * 1024;
const formats: Record<string, readonly string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
};

/** File chooser metadata validation; server/storage policy remains authoritative. */
export function validateCvFile(file: Pick<File, 'name' | 'size' | 'type'>): void {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!formats[extension] || !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > CV_MAX_BYTES) {
    throw new Error('CV must be a non-empty PDF, DOC, DOCX or TXT, at most 10 MB.');
  }
  // Some Android document providers omit MIME or return generic binary MIME.
  const mime = file.type.toLowerCase().split(';')[0].trim();
  if (mime && mime !== 'application/octet-stream' && !formats[extension].includes(mime)) {
    throw new Error('CV file type does not match its filename.');
  }
}
