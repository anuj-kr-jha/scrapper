import ExcelJS from 'exceljs';

// write computed result rows ({currency, shortPercent, status, createdAt}) to an .xlsx file.
export async function writeExcel(rows, filePath) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('MYFXBOOK');
  sheet.columns = [
    { header: 'Currency', key: 'currency', width: 12 },
    { header: 'Short Percent', key: 'shortPercent', width: 14 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Created At', key: 'createdAt', width: 26 },
  ];
  rows.forEach((row) => sheet.addRow(row));
  await workbook.xlsx.writeFile(filePath);
}
