import { formatDateTime } from './date.js';
import { BOOKING_STATUS, BOOKING_STATUS_GROUPS } from '../constants/statuses.js';
import { APP_BRANDING } from '../constants/branding.js';
import { REPORT_FILENAME_PREFIX, REPORT_SHEET_NAMES } from '../constants/reports.js';
/**
 * YOUNGONE Meeting Room report. Creates real Office Open XML (.xlsx) files
 * without external npm dependencies. This also keeps the development install
 * portable when only src/ is copied to another machine.
 * All external text is explicitly emitted as inline strings, never formulas.
 */

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const columnName = (number) => {
  let result = '';
  for (let value = number; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
};
const xml = (value) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, ' ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const safeText = (value) => String(value ?? '').slice(0, 32767);
const textCell = (address, value, style = 6) =>
  `<c r="${address}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(safeText(value))}</t></is></c>`;
const numberCell = (address, value, style = 6) =>
  `<c r="${address}" s="${style}" t="n"><v>${Number.isFinite(Number(value)) ? Number(value) : 0}</v></c>`;
const blankCell = (address, style) => `<c r="${address}" s="${style}" t="inlineStr"><is><t></t></is></c>`;
const rowXml = (number, cells, height = 24) =>
  `<row r="${number}" ht="${height}" customHeight="1">${cells.join('')}</row>`;
const band = (row, lastColumn, firstText, style, height = 26) => rowXml(row,
  Array.from({ length: lastColumn }, (_, index) => index === 0
    ? textCell(`${columnName(index + 1)}${row}`, firstText, style)
    : blankCell(`${columnName(index + 1)}${row}`, style)), height);
const excelDateSerial = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const calendar = new Date(timestamp);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  return (timestamp - Date.UTC(1899, 11, 30)) / 86400000;
};
const displayDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'All dates';
};
const displayTimestamp = (value) => value ? formatDateTime(value) : '';
const statusStyle = (status) => ({ APPROVED: 12, COMPLETED: 12, PENDING: 13, REJECTED: 14, CANCELLED: 15 }[status] || 6);

const headerCells = (labels, rowNumber) => rowXml(rowNumber,
  labels.map((label, index) => textCell(`${columnName(index + 1)}${rowNumber}`, label, 5)), 32);

function summaryXml(rows, filters, roomName, requesterName, exportedAt) {
  const statusOrder = BOOKING_STATUS_GROUPS.REPORT_ORDER;
  const count = (status) => rows.filter((row) => row.status === status).length;
  const roomCounts = new Map();
  rows.forEach((row) => roomCounts.set(row.room || 'Unknown room', (roomCounts.get(row.room || 'Unknown room') || 0) + 1));
  const rankedRooms = [...roomCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
  const summary = [];
  summary.push(band(1, 8, APP_BRANDING.reportHeader, 1, 40));
  summary.push(band(2, 8, 'BOOKING REPORT   ·   OVERVIEW', 2, 29));
  summary.push(band(3, 8, '', 2, 14));
  summary.push(rowXml(5, [textCell('A5', 'REPORT PERIOD', 4), textCell('C5', `${displayDate(filters.fromDate)}  –  ${displayDate(filters.toDate)}`, 6), textCell('F5', 'GENERATED', 4), textCell('G5', exportedAt, 6)], 27));
  summary.push(rowXml(6, [textCell('A6', 'ROOM', 4), textCell('C6', roomName, 6), textCell('F6', 'REQUESTER', 4), textCell('G6', requesterName, 6)], 26));
  summary.push(rowXml(7, [textCell('A7', 'STATUS FILTER', 4), textCell('C7', filters.status || 'All statuses', 6)], 26));
  summary.push(rowXml(9, [textCell('A9', 'TOTAL BOOKINGS', 17), textCell('C9', 'APPROVED + COMPLETED', 17), textCell('E9', 'PENDING', 17), textCell('G9', 'REJECTED + CANCELLED', 17)], 28));
  summary.push(rowXml(10, [numberCell('A10', rows.length, 18), numberCell('C10', count(BOOKING_STATUS.APPROVED) + count(BOOKING_STATUS.COMPLETED), 18), numberCell('E10', count(BOOKING_STATUS.PENDING), 18), numberCell('G10', count(BOOKING_STATUS.REJECTED) + count(BOOKING_STATUS.CANCELLED), 18)], 45));
  summary.push(rowXml(13, [textCell('A13', 'STATUS BREAKDOWN', 4), textCell('E13', 'TOP ROOMS · BY BOOKING COUNT', 4)], 28));
  summary.push(rowXml(14, [textCell('A14', 'Status', 5), textCell('B14', 'Bookings', 5), textCell('C14', 'Share', 5), textCell('E14', 'Room', 5), textCell('G14', 'Bookings', 5)], 32));
  const rowCount = Math.max(statusOrder.length, rankedRooms.length);
  for (let index = 0; index < rowCount; index += 1) {
    const line = 15 + index;
    const entries = [];
    if (index < statusOrder.length) {
      const status = statusOrder[index];
      entries.push(textCell(`A${line}`, status, statusStyle(status)));
      entries.push(numberCell(`B${line}`, count(status), index % 2 ? 7 : 6));
      entries.push(numberCell(`C${line}`, rows.length ? count(status) / rows.length : 0, 21));
    }
    if (index < rankedRooms.length) {
      entries.push(textCell(`E${line}`, rankedRooms[index][0], index % 2 ? 7 : 6));
      entries.push(numberCell(`G${line}`, rankedRooms[index][1], index % 2 ? 7 : 6));
    }
    summary.push(rowXml(line, entries, 26));
  }
  const footnoteRow = Math.max(26, 16 + rowCount);
  summary.push(rowXml(footnoteRow, [textCell(`A${footnoteRow}`, 'This report includes all matching bookings, not only the current table page. Booking IDs and room codes are intentionally hidden.', 20)], 38));
  const cols = [23, 14, 25, 4, 31, 20, 22, 25];
  return `<worksheet xmlns="${NS}"><sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>`
    + `<cols>${cols.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${summary.join('')}</sheetData>`
    + `<mergeCells count="${6 + 1}">` + [
      'A1:H1', 'A2:H2', 'A3:H3', 'C5:E5', 'C6:E6', 'G5:H5', `A${footnoteRow}:H${footnoteRow}`
    ].map((ref) => `<mergeCell ref="${ref}"/>`).join('') + '</mergeCells>'
    + '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'
    + '</worksheet>';
}

function detailsXml(rows, filters, roomName, requesterName) {
  const headers = ['No.', 'Meeting', 'Booked By', 'Account', 'Email', 'Department', 'Room', 'Meeting Date', 'Time', 'People', 'Status', 'Requested At', 'Approved By', 'Reject Reason'];
  const sheetRows = [
    band(1, 14, APP_BRANDING.reportHeader, 1, 39),
    band(2, 14, 'DETAILED BOOKING REPORT', 2, 30),
    band(3, 14, '', 2, 12),
    band(4, 14, `Period: ${displayDate(filters.fromDate)} – ${displayDate(filters.toDate)}     |     Room: ${roomName}     |     Requested by: ${requesterName}     |     Status: ${filters.status || 'All'}`, 3, 28),
    band(5, 14, `Total records: ${rows.length}     •     Use Excel header filters to explore the detail.`, 20, 26),
    headerCells(headers, 6)
  ];
  rows.forEach((item, index) => {
    const number = index + 7;
    const baseStyle = index % 2 === 0 ? 6 : 7;
    const serialDate = excelDateSerial(item.date);
    const cellValue = [
      numberCell(`A${number}`, index + 1, baseStyle),
      textCell(`B${number}`, item.title, baseStyle),
      textCell(`C${number}`, item.user, baseStyle),
      textCell(`D${number}`, item.account, baseStyle),
      textCell(`E${number}`, item.email, baseStyle),
      textCell(`F${number}`, item.department, baseStyle),
      textCell(`G${number}`, item.room, baseStyle),
      serialDate === null ? textCell(`H${number}`, item.date, baseStyle) : numberCell(`H${number}`, serialDate, index % 2 ? 9 : 8),
      textCell(`I${number}`, item.time, baseStyle),
      numberCell(`J${number}`, item.participants, baseStyle),
      textCell(`K${number}`, item.status, statusStyle(item.status)),
      textCell(`L${number}`, displayTimestamp(item.createdAt), baseStyle),
      textCell(`M${number}`, item.approvedBy, baseStyle),
      textCell(`N${number}`, item.rejectReason, baseStyle)
    ];
    sheetRows.push(rowXml(number, cellValue, 27));
  });
  const lastRow = Math.max(7, rows.length + 6);
  const colWidths = [7, 34, 22, 20, 29, 20, 22, 17, 18, 11, 18, 22, 22, 38];
  return `<worksheet xmlns="${NS}"><sheetViews><sheetView showGridLines="0" workbookViewId="0">`
    + '<pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A7" sqref="A7"/>'
    + `</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>`
    + `<cols>${colWidths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${sheetRows.join('')}</sheetData>`
    + '<mergeCells count="5"><mergeCell ref="A1:N1"/><mergeCell ref="A2:N2"/><mergeCell ref="A3:N3"/><mergeCell ref="A4:N4"/><mergeCell ref="A5:N5"/></mergeCells>'
    + `<autoFilter ref="A6:N${lastRow}"/>`
    + '<printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>'
    + '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>'
    + '</worksheet>';
}

// Group bookings by a stable user identifier so identical names are not merged.
function groupBookingsByUser(rows) {
  const groups = new Map();
  rows.forEach((item) => {
    const account = String(item.account || '').trim();
    const displayName = String(item.user || '').trim();
    const identity = item.userId ? `id:${item.userId}`
      : account ? `account:${account.toLowerCase()}`
        : `name:${displayName.toLowerCase() || 'unknown'}`;
    let group = groups.get(identity);
    if (!group) {
      group = {
        user: displayName || account || 'Unknown user', account, email: item.email || '',
        department: item.department || '', total: 0, statuses: {},
        firstRequest: '', lastRequest: '', firstMeeting: '', lastMeeting: ''
      };
      groups.set(identity, group);
    }
    // Preserve an existing historical account even if the user profile has changed.
    if (!group.account && account) group.account = account;
    if (!group.email && item.email) group.email = item.email;
    if (!group.department && item.department) group.department = item.department;
    group.total += 1;
    group.statuses[item.status] = (group.statuses[item.status] || 0) + 1;

    const requested = String(item.createdAt || '');
    if (requested) {
      if (!group.firstRequest || requested < group.firstRequest) group.firstRequest = requested;
      if (!group.lastRequest || requested > group.lastRequest) group.lastRequest = requested;
    }
    const meeting = item.date ? `${item.date} ${String(item.time || '').split(' - ')[0]}` : '';
    if (meeting) {
      if (!group.firstMeeting || meeting < group.firstMeeting) group.firstMeeting = meeting;
      if (!group.lastMeeting || meeting > group.lastMeeting) group.lastMeeting = meeting;
    }
  });
  return [...groups.values()].sort((a, b) => b.total - a.total
    || a.user.localeCompare(b.user) || a.account.localeCompare(b.account));
}

// User-level totals include every exported booking, including cancelled requests.
function userSummaryXml(rows, filters, exportedAt) {
  const summaries = groupBookingsByUser(rows);
  const headers = [
    'No.', 'Booked By', 'Account', 'Email', 'Department', 'Total Bookings',
    'Approved', 'Completed', 'Pending', 'Rejected', 'Cancelled',
    'First Requested At', 'Last Requested At', 'First Meeting', 'Last Meeting'
  ];
  const totalColumns = headers.length;
  const output = [
    band(1, totalColumns, APP_BRANDING.reportHeader, 1, 39),
    band(2, totalColumns, 'BOOKING BY USER  |  REQUEST COUNTS', 2, 30),
    band(3, totalColumns, `Report period: ${displayDate(filters.fromDate)} – ${displayDate(filters.toDate)}     |     Generated: ${exportedAt}`, 3, 30),
    band(4, totalColumns, `Users: ${summaries.length}     |     Total bookings: ${rows.length}     |     Counts include all matching statuses.`, 20, 27),
    headerCells(headers, 6)
  ];
  summaries.forEach((item, index) => {
    const row = index + 7;
    const style = index % 2 ? 7 : 6;
    const count = (status) => item.statuses[status] || 0;
    output.push(rowXml(row, [
      numberCell(`A${row}`, index + 1, style),
      textCell(`B${row}`, item.user, style),
      textCell(`C${row}`, item.account, style),
      textCell(`D${row}`, item.email, style),
      textCell(`E${row}`, item.department, style),
      numberCell(`F${row}`, item.total, style),
      numberCell(`G${row}`, count(BOOKING_STATUS.APPROVED), style),
      numberCell(`H${row}`, count(BOOKING_STATUS.COMPLETED), style),
      numberCell(`I${row}`, count(BOOKING_STATUS.PENDING), style),
      numberCell(`J${row}`, count(BOOKING_STATUS.REJECTED), style),
      numberCell(`K${row}`, count(BOOKING_STATUS.CANCELLED), style),
      textCell(`L${row}`, displayTimestamp(item.firstRequest), style),
      textCell(`M${row}`, displayTimestamp(item.lastRequest), style),
      textCell(`N${row}`, displayTimestamp(item.firstMeeting), style),
      textCell(`O${row}`, displayTimestamp(item.lastMeeting), style)
    ], 27));
  });
  const widths = [7, 24, 21, 30, 22, 17, 14, 14, 13, 13, 14, 23, 23, 23, 23];
  return `<worksheet xmlns="${NS}"><sheetViews><sheetView showGridLines="0" workbookViewId="0">`
    + '<pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A7" sqref="A7"/>'
    + '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>'
    + `<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${output.join('')}</sheetData>`
    + '<mergeCells count="4"><mergeCell ref="A1:O1"/><mergeCell ref="A2:O2"/><mergeCell ref="A3:O3"/><mergeCell ref="A4:O4"/></mergeCells>'
    + `<autoFilter ref="A6:O${Math.max(7, summaries.length + 6)}"/>`
    + '<pageMargins left="0.25" right="0.25" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>'
    + '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>'
    + '</worksheet>';
}

// Show exactly when every request was submitted and when the meeting is scheduled.
function bookingTimelineXml(rows, filters) {
  const headers = [
    'No.', 'Booked By', 'Account', 'Department', 'Meeting Title', 'Room',
    'Meeting Date', 'Start Time', 'End Time', 'Requested At', 'Status',
    'Participants', 'Email', 'Approved By'
  ];
  const timeline = [...rows].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    || String(b.date || '').localeCompare(String(a.date || '')));
  const output = [
    band(1, 14, APP_BRANDING.reportHeader, 1, 39),
    band(2, 14, 'BOOKING TIMELINE  |  WHO REQUESTED WHICH ROOM AND WHEN', 2, 30),
    band(3, 14, `Report period: ${displayDate(filters.fromDate)} – ${displayDate(filters.toDate)}     |     Status: ${filters.status || 'All statuses'}`, 3, 29),
    band(4, 14, `Total requests: ${timeline.length}     |     Requested At is submission time; Meeting Date/Time is the scheduled meeting.`, 20, 27),
    headerCells(headers, 6)
  ];
  timeline.forEach((item, index) => {
    const row = index + 7;
    const style = index % 2 ? 7 : 6;
    const [start = '', end = ''] = String(item.time || '').split(/\s+-\s+/);
    const serial = excelDateSerial(item.date);
    output.push(rowXml(row, [
      numberCell(`A${row}`, index + 1, style),
      textCell(`B${row}`, item.user || item.account || 'Unknown user', style),
      textCell(`C${row}`, item.account, style),
      textCell(`D${row}`, item.department, style),
      textCell(`E${row}`, item.title, style),
      textCell(`F${row}`, item.room, style),
      serial === null ? textCell(`G${row}`, item.date, style) : numberCell(`G${row}`, serial, index % 2 ? 9 : 8),
      textCell(`H${row}`, start, style),
      textCell(`I${row}`, end, style),
      textCell(`J${row}`, displayTimestamp(item.createdAt), style),
      textCell(`K${row}`, item.status, statusStyle(item.status)),
      numberCell(`L${row}`, item.participants, style),
      textCell(`M${row}`, item.email, style),
      textCell(`N${row}`, item.approvedBy, style)
    ], 27));
  });
  const widths = [7, 23, 20, 22, 35, 24, 17, 15, 15, 23, 17, 16, 30, 23];
  return `<worksheet xmlns="${NS}"><sheetViews><sheetView showGridLines="0" workbookViewId="0">`
    + '<pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A7" sqref="A7"/>'
    + '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>'
    + `<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${output.join('')}</sheetData>`
    + '<mergeCells count="4"><mergeCell ref="A1:N1"/><mergeCell ref="A2:N2"/><mergeCell ref="A3:N3"/><mergeCell ref="A4:N4"/></mergeCells>'
    + `<autoFilter ref="A6:N${Math.max(7, timeline.length + 6)}"/>`
    + '<pageMargins left="0.25" right="0.25" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>'
    + '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>'
    + '</worksheet>';
}

function stylesXml() {
  const font = (color, opts = '') => `<font><sz val="${opts.includes('large') ? 20 : opts.includes('kpi') ? 22 : 11}"/><name val="Aptos"/>${opts.includes('bold') ? '<b/>' : ''}${opts.includes('italic') ? '<i/>' : ''}<color rgb="FF${color}"/></font>`;
  const fonts = [
    font('263D58'), font('FFFFFF', 'large bold'), font('DCE9F8'), font('FFFFFF', 'bold'),
    font('17365D', 'bold'), font('64748B'), font('17365D', 'kpi bold'), font('2A4C74', 'bold'),
    font('17603E', 'bold'), font('9A580A', 'bold'), font('A2262A', 'bold'), font('64748B', 'italic')
  ];
  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    ...['17365D', '2563EB', 'EDF4FE', 'F7FAFE', 'DFF6EA', 'FFF2D6', 'FCE9E9', 'EEF1F6'].map((color) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`)
  ];
  const noBorder = '<border><left/><right/><top/><bottom/><diagonal/></border>';
  const lineBorder = '<border><left/><right/><top/><bottom style="hair"><color rgb="FFE4EAF2"/></bottom><diagonal/></border>';
  const fullBorder = '<border><left style="hair"><color rgb="FFDBE6F3"/></left><right style="hair"><color rgb="FFDBE6F3"/></right><top/><bottom style="thin"><color rgb="FFCFDDEC"/></bottom><diagonal/></border>';
  const xf = (fontId, fillId = 0, borderId = 0, numFmtId = 0, align = '') =>
    `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${numFmtId ? ' applyNumberFormat="1"' : ''}>` +
    (align ? `<alignment horizontal="${align}" vertical="center" wrapText="1"/>` : '<alignment vertical="center" wrapText="1"/>') + '</xf>';
  const formats = [
    xf(0), xf(1, 2), xf(2, 2), xf(5, 4), xf(4, 4, 1), xf(3, 3, 2),
    xf(0, 0, 1), xf(0, 5, 1), xf(0, 0, 1, 164, 'center'), xf(0, 5, 1, 164, 'center'),
    xf(0, 0, 1, 0, 'center'), xf(0, 5, 1, 0, 'center'),
    xf(8, 6, 1), xf(9, 7, 1), xf(10, 8, 1), xf(5, 9, 1),
    xf(4, 4), xf(4, 4), xf(6, 4), xf(5, 0, 0), xf(11, 0), xf(0, 0, 1, 165)
  ];
  return XML_DECL + `<styleSheet xmlns="${NS}"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts>`
    + `<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills>`
    + `<borders count="3">${noBorder}${lineBorder}${fullBorder}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
    + `<cellXfs count="${formats.length}">${formats.join('')}</cellXfs>`
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
}

// ZIP "store" writer; avoiding XLSX dependencies keeps source portable.
const encode = (value) => new TextEncoder().encode(value);
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let i = 0; i < 8; i += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
const crc32 = (bytes) => {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};
const set16 = (view, offset, value) => view.setUint16(offset, value, true);
const set32 = (view, offset, value) => view.setUint32(offset, value, true);
function createZip(files) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files)) {
    const name = encode(path);
    const data = encode(content);
    const checksum = crc32(data);
    const head = new Uint8Array(30 + name.length);
    const hv = new DataView(head.buffer);
    set32(hv, 0, 0x04034B50); set16(hv, 4, 20); set16(hv, 6, 0x0800);
    set16(hv, 8, 0); set32(hv, 14, checksum); set32(hv, 18, data.length); set32(hv, 22, data.length);
    set16(hv, 26, name.length); head.set(name, 30);
    locals.push(head, data);
    const dir = new Uint8Array(46 + name.length);
    const dv = new DataView(dir.buffer);
    set32(dv, 0, 0x02014B50); set16(dv, 4, 20); set16(dv, 6, 20);
    set16(dv, 8, 0x0800); set32(dv, 16, checksum);
    set32(dv, 20, data.length); set32(dv, 24, data.length);
    set16(dv, 28, name.length); set32(dv, 42, offset); dir.set(name, 46);
    central.push(dir);
    offset += head.length + data.length;
  }
  const centralSize = central.reduce((acc, section) => acc + section.length, 0);
  const footer = new Uint8Array(22);
  const fv = new DataView(footer.buffer);
  set32(fv, 0, 0x06054B50);
  set16(fv, 8, central.length); set16(fv, 10, central.length);
  set32(fv, 12, centralSize); set32(fv, 16, offset);
  const output = new Uint8Array(offset + centralSize + footer.length);
  let cursor = 0;
  for (const part of [...locals, ...central, footer]) { output.set(part, cursor); cursor += part.length; }
  return output;
}

/** Pure function, also unit-testable in Node without a DOM. */
export function buildBookingReportWorkbook({ rows, filters, rooms = [], requesters = [], exportedAt = new Date().toISOString() }) {
  const roomName = rooms.find((room) => room.id === filters.room)?.name || (filters.room ? String(filters.room) : 'All rooms');
  const requesterName = requesters.find((item) => item.id === filters.requester)?.name || (filters.requester ? String(filters.requester) : 'All users');
  const generatedDate = displayTimestamp(exportedAt);
  const worksheets = [
    summaryXml(rows, filters, roomName, requesterName, generatedDate),
    detailsXml(rows, filters, roomName, requesterName),
    userSummaryXml(rows, filters, generatedDate),
    bookingTimelineXml(rows, filters)
  ];
  const worksheetParts = worksheets.map((_, index) => `/xl/worksheets/sheet${index + 1}.xml`);
  const files = {
    '[Content_Types].xml': XML_DECL + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + worksheetParts.map((part) => `<Override PartName="${part}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels': XML_DECL + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': XML_DECL + `<workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>`
      + REPORT_SHEET_NAMES.map((name, index) => `<sheet name="${xml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')
      + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>',
    'xl/_rels/workbook.xml.rels': XML_DECL + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + worksheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${worksheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': stylesXml()
  };
  worksheets.forEach((content, index) => { files[`xl/worksheets/sheet${index + 1}.xml`] = XML_DECL + content; });
  return createZip(files);
}

/** Export the whole filtered set, not only rows visible on the current page. */
export function downloadBookingReportXlsx(args) {
  const content = buildBookingReportWorkbook(args);
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = `${REPORT_FILENAME_PREFIX}_${args.filters.fromDate || 'all'}_${args.filters.toDate || 'all'}.xlsx`;
  document.body.appendChild(element);
  element.click();
  element.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return element.download;
}
