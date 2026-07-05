import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

function createDirectoryIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getFileName() {
  // Get the current date and time
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Set the filename with the timestamp
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
export async function createWorkbook() {
  console.green(`Generating excel :)`);

  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const workbook = new ExcelJS.Workbook();

    // IG worksheet
    const igSheet = workbook.addWorksheet('IG');
    igSheet.columns = [
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Percent', key: 'percent', width: 10 },
      { header: 'Long/Short', key: 'longShort', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 24 },
    ];
    rawData.RAW_IG.forEach((row) => igSheet.addRow(row));

    // MYFXBOOK worksheet
    const myfxbookSheet = workbook.addWorksheet('MYFXBOOK');
    myfxbookSheet.columns = [
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Short Percent', key: 'shortPercent', width: 14 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 24 },
    ];
    rawData.RAW_MYFXBOOK.forEach((row) => myfxbookSheet.addRow(row));

    // Save the workbook to a file
    const outputDirectory = path.join(process.cwd(), 'excel');
    createDirectoryIfNotExists(outputDirectory);
    await workbook.xlsx.writeFile(path.join(outputDirectory, `${getFileName()}.xlsx`));
    // await workbook.xlsx.writeFile(`excel/${getFileName()}.xlsx`);
    console.magenta('Excel file created.');
  } catch (e) {
    console.red('Error on createWorkbook', e.message);
  } finally {
    // setTimeout(createWorkbook, rawData.CONSTANT[0].interval_excel);
  }
}
