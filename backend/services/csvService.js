/**
 * @fileoverview CSV parsing service for bulk customer imports.
 * Handles reading, validating, and transforming CSV data into customer records.
 */

const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Parse a CSV buffer into an array of customer objects.
 * Validates each row and collects errors for invalid rows.
 *
 * Expected CSV columns (case-insensitive, trimmed):
 *   name, phone, loanId (or loan_id), dueAmount (or due_amount), dueDate (or due_date)
 *
 * @param {Buffer} buffer - The CSV file buffer from multer
 * @returns {Promise<{customers: Object[], errors: Object[]}>} Parsed customers and per-row errors
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const customers = [];
    const errors = [];
    let rowIndex = 0;

    // Create a readable stream from the buffer
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null); // Signal end of stream

    readable
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            // Normalize headers: trim, lowercase, and map common variants
            const normalized = header.trim().toLowerCase().replace(/[\s_-]+/g, '');
            const headerMap = {
              name: 'name',
              phone: 'phone',
              phonenumber: 'phone',
              loanid: 'loanId',
              loan_id: 'loanId',
              dueamount: 'dueAmount',
              due_amount: 'dueAmount',
              amount: 'dueAmount',
              duedate: 'dueDate',
              due_date: 'dueDate',
              date: 'dueDate',
            };
            return headerMap[normalized] || normalized;
          },
        })
      )
      .on('data', (row) => {
        rowIndex++;

        // Validate required fields
        const rowErrors = [];

        if (!row.name || !row.name.trim()) {
          rowErrors.push('name is required');
        }
        if (!row.phone || !row.phone.trim()) {
          rowErrors.push('phone is required');
        }
        if (!row.loanId || !row.loanId.trim()) {
          rowErrors.push('loanId is required');
        }
        if (!row.dueAmount || isNaN(Number(row.dueAmount))) {
          rowErrors.push('dueAmount must be a valid number');
        }
        if (!row.dueDate || isNaN(Date.parse(row.dueDate))) {
          rowErrors.push('dueDate must be a valid date');
        }

        if (rowErrors.length > 0) {
          errors.push({
            row: rowIndex,
            data: row,
            errors: rowErrors,
          });
          return;
        }

        // Transform and sanitize the row
        customers.push({
          name: row.name.trim(),
          phone: normalizePhoneNumber(row.phone.trim()),
          loanId: row.loanId.trim().toUpperCase(),
          dueAmount: Number(row.dueAmount),
          dueDate: new Date(row.dueDate),
        });
      })
      .on('end', () => {
        console.log(
          `📄 CSV parsed: ${customers.length} valid rows, ${errors.length} errors`
        );
        resolve({ customers, errors });
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error.message);
        reject(error);
      });
  });
};

/**
 * Normalize a phone number to E.164-like format.
 * Strips non-digit characters (except leading +) and ensures proper formatting.
 *
 * @param {string} phone - Raw phone number string
 * @returns {string} Normalized phone number
 */
const normalizePhoneNumber = (phone) => {
  // Preserve leading + if present
  const hasPlus = phone.startsWith('+');

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If no leading + and the number is 10 digits, assume US and add +1
  if (!hasPlus && digits.length === 10) {
    digits = '1' + digits;
  }

  return '+' + digits;
};

module.exports = {
  parseCSV,
  normalizePhoneNumber,
};
