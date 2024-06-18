// utils/readExcel.ts
import * as XLSX from "xlsx";

export function readExcel(file: File): Promise<{ x: number; y: number }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<{ x: number; y: number }>(
        worksheet
      );
      resolve(json);
    };
    reader.onerror = (event) => {
      reject(event);
    };
    reader.readAsArrayBuffer(file);
  });
}
