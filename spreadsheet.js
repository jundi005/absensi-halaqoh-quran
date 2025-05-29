/**
 * Kirim data ke Google Sheet melalui Apps Script.
 * @param {Array|Object} data - Data yang akan dikirim (array of object atau object tunggal).
 * @param {string} sheetName - Nama sheet tujuan (harus sesuai di GAS.js).
 * @returns {Promise<Object>} - Response dari server { success, message }
 */
async function sendToSheet(data, sheetName) {
    try {
        const payload = {
            sheet: sheetName,
            data: data
        };
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error sendToSheet:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Ambil data dari Google Sheet melalui Apps Script dengan filter.
 * @param {string} sheetName - Nama sheet yang ingin diambil.
 * @param {Object} filters - Filter parameter (opsional).
 * @returns {Promise<Array>} - Array data (hasil parsing di GAS.js).
 */
async function getFromSheet(sheetName, filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('sheet', sheetName);
        for (const [key, value] of Object.entries(filters)) {
            if (value) queryParams.append(key, value);
        }
        const response = await fetch(`${scriptURL}?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        console.error('Error getFromSheet:', error);
        return [];
    }
}