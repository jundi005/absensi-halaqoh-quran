// Ganti dengan ID Spreadsheet Anda
const SHEET_ID = 'ID_SPREADSHEET_ANDA';
const SHEET_NAMES = {
    SANTRI: 'Santri',
    MUSAMMI: 'Musammi',
    LAPORAN: 'Laporan'
};

// Helper untuk response dengan CORS
function withCors(output) {
    return output
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*")
        .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Main GET endpoint
function doGet(e) {
    try {
        const sheetName = e.parameter.sheet;
        const filters = {
            type: e.parameter.type,
            startDate: e.parameter.startDate,
            endDate: e.parameter.endDate,
            class: e.parameter.class,
            time: e.parameter.time,
            status: e.parameter.status
        };
        const data = getDataFromSheet(sheetName, filters);
        return withCors(ContentService.createTextOutput(JSON.stringify(data)));
    } catch (err) {
        return withCors(ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message })));
    }
}

// Main POST endpoint
function doPost(e) {
    try {
        const payload = JSON.parse(e.postData.contents);
        const sheetName = payload.sheet;
        const data = payload.data;
        const result = saveDataToSheet(sheetName, data);
        return withCors(ContentService.createTextOutput(JSON.stringify(result)));
    } catch (err) {
        return withCors(ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message })));
    }
}

// Filtered data loader
function getDataFromSheet(sheetName, filters = {}) {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (!data[0]) return [];

    const headers = data[0].map(h => (h || '').toString().trim());
    let filteredData = data.slice(1); // Exclude header

    // Apply filters
    if (filters.type) {
        const typeCol = headers.indexOf('Type') !== -1 ? headers.indexOf('Type') : headers.indexOf('type');
        if (typeCol >= 0) filteredData = filteredData.filter(row => (row[typeCol] || '') == filters.type);
    }
    if (filters.startDate && filters.endDate) {
        const dateCol = headers.indexOf('Date') !== -1 ? headers.indexOf('Date') : headers.indexOf('date');
        if (dateCol >= 0) {
            filteredData = filteredData.filter(row => {
                const rowDate = new Date(row[dateCol]);
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                return rowDate >= startDate && rowDate <= endDate;
            });
        }
    }
    if (filters.class) {
        // Support both 'Class' and 'Class/Type' column
        let classCol = headers.indexOf('Class');
        if (classCol < 0) classCol = headers.indexOf('Class/Type');
        if (classCol < 0) classCol = headers.indexOf('class');
        if (classCol >= 0) filteredData = filteredData.filter(row => (row[classCol] || '') == filters.class);
    }
    if (filters.time) {
        const timeCol = headers.indexOf('Time') !== -1 ? headers.indexOf('Time') : headers.indexOf('time');
        if (timeCol >= 0) filteredData = filteredData.filter(row => (row[timeCol] || '') == filters.time);
    }
    if (filters.status) {
        const statusCol = headers.indexOf('Status') !== -1 ? headers.indexOf('Status') : headers.indexOf('status');
        if (statusCol >= 0) filteredData = filteredData.filter(row => (row[statusCol] || '') == filters.status);
    }

    // Format data as array of object
    const result = filteredData.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header.replace(/\s/g, '').replace('/', '').toLowerCase()] = row[i];
            obj[header] = row[i]; // keep original for backward compatibility
        });
        return obj;
    });

    return result;
}

// Data saver
function saveDataToSheet(sheetName, data) {
    try {
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) throw new Error('Sheet not found: ' + sheetName);

        // Ambil header
        const headers = sheet.getDataRange().getValues()[0];
        const headerMap = headers.map(h => (h || '').toString().trim().toLowerCase());

        // Data always as array
        const values = Array.isArray(data) ? data : [data];
        const rows = values.map(item => {
            // Map data ke urutan kolom di sheet
            return headerMap.map(col => {
                // fallback: gunakan key yang sama persis jika ada
                let value = item[col] || item[col.toLowerCase()] || '';
                if (!value) {
                    // fallback untuk nama umum
                    if (col === 'timestamp') value = item.timestamp || new Date().toISOString();
                    if (col === 'date') value = item.date;
                    if (col === 'name') value = item.name;
                    if (col === 'class' || col === 'class/type') value = item.class || item['class/type'] || item.type;
                    if (col === 'type' || col === 'category') value = item.type || item.category || '';
                    if (col === 'time') value = item.time;
                    if (col === 'status') value = item.status;
                    if (col === 'notes') value = item.notes || '';
                }
                return value;
            });
        });

        // Append all rows
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headerMap.length).setValues(rows);

        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        return { success: false, message: error.toString() };
    }
}

// Inisialisasi sheets dan header
function setupSheets() {
    const ss = SpreadsheetApp.openById(SHEET_ID);

    // Santri
    let sheet = ss.getSheetByName(SHEET_NAMES.SANTRI);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAMES.SANTRI);
        sheet.appendRow([
            'Timestamp', 'Date', 'Name', 'Class', 'Time', 'Status', 'Notes', 'Type'
        ]);
    }

    // Musammi
    sheet = ss.getSheetByName(SHEET_NAMES.MUSAMMI);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAMES.MUSAMMI);
        sheet.appendRow([
            'Timestamp', 'Date', 'Name', 'Type', 'Time', 'Status', 'Notes', 'Category'
        ]);
    }

    // Laporan
    sheet = ss.getSheetByName(SHEET_NAMES.LAPORAN);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAMES.LAPORAN);
        sheet.appendRow([
            'Timestamp', 'Date', 'Name', 'Class/Type', 'Time', 'Status', 'Notes', 'Category'
        ]);
    }

    // Hapus sheet default jika masih ada
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet) {
        ss.deleteSheet(defaultSheet);
    }
}