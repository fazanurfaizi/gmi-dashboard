import type { Db, Tx } from '~~/server/utils/db'
import { procurements, installations, notes } from '~~/server/database/schema'
import { and, eq } from 'drizzle-orm'

export function syncProcurementData(db: Db, data: any[], year: number) {
  const records = data
    .filter((row: any) => row['No'] && row['Kode Proyek'])
    .map((row: any) => ({
      year: year,
      status: row['Status'],
      no: typeof row['No'] === 'number' ? row['No'] : parseInt(row['No']) || 0,
      projectCode: row['Kode Proyek'],
      projectName: row['Nama Project'],
      location: row['Lokasi Project'],
      pm: row['PM'],
      admin: row['Admin'],
      epc: row['EPC'],
      notes: row['Ket']
    }))

  if (records.length === 0) return

  // db.transaction((tx: Tx) => {
  // })
  db.delete(procurements).where(eq(procurements.year, year)).run()
  db.insert(procurements).values(records).run()
}

export function syncInstallationData(db: Db, rawData: any[][], year: number) {
  // Structure Mapping:
  // Index 0-2 (Rows 1-3): Empty
  // Index 3   (Row 4):    Header 1 (Dates: 01/12/2025...)
  // Index 4   (Row 5):    Header 2 (Sub-headers: Project/Keuangan...)
  // Index 5+  (Row 6+):   Data Rows

  if (rawData.length < 6) return

  const headerRow1 = rawData[3]
  const headerRow2 = rawData[4]
  const dataRows = rawData.slice(5)

  if (headerRow1 && headerRow2) {
    const staticEndIndex = headerRow1.findIndex(c => c && c.toString().toLowerCase().includes('type atap'))
    const dynamicStartIndex = staticEndIndex + 1

    const records: any[] = []

    for (const row of dataRows) {
      if (!row[0]) continue

      const staticData = {
        year: year,
        status: row[0],
        no: parseInt(row[1]) || 0,
        bastAndRetentionDate: parseTextDate(row[2]),
        bastDocumentDate: parseTextDate(row[3]),
        projectCode: row[4],
        projectName: row[5],
        location: row[6],
        capacity: parseFloat(row[7]) || 0,
        unit: row[8],
        pm: row[9],
        admin: row[10],
        sm: row[11],
        plan_oh: row[12],
        actual_oh: row[13],
        manpowerUpdate: row[14],
        epc: row[15],
        developer: row[16],
        roofType: row[17],
      }

      const progressData: Record<string, any> = {}

      // Track the current date across merged cells
      let currentDateKey = ''

      if (dynamicStartIndex > 0) {
        for (let i = dynamicStartIndex; i < row.length; i++) {
          // Check Row 4 for Date (it might be merged, so only appears once every 2 cols)
          if (headerRow1[i]) {
            const rawHeader = headerRow1[i]

            // Check if XLSX parsed it as a Date object
            if (rawHeader instanceof Date) {
              const y = rawHeader.getFullYear()
              const m = String(rawHeader.getMonth() + 1).padStart(2, '0')
              const d = String(rawHeader.getDate()).padStart(2, '0')
              currentDateKey = `${y}-${m}-${d}`
            } else {
              // Fallback in case it's parsed as a standard string
              currentDateKey = String(rawHeader).trim()
            }

            if (!progressData[currentDateKey]) progressData[currentDateKey] = {}
          }

          // Check Row 5 for Category (Project vs Keuangan)
          const subCategory = headerRow2[i]
          const cellValue = row[i]

          if (currentDateKey && subCategory) {
            const key = subCategory.toString().toLowerCase().includes('keuangan') ? 'finance' : 'project'
            progressData[currentDateKey][key] = cellValue
          }
        }
      }

      records.push({
        ...staticData,
        progressData: progressData
      })
    }

    if (records.length === 0) return

    // db.transaction((tx: Tx) => {
    // })
    db.delete(installations).where(eq(installations.year, year)).run()
    db.insert(installations).values(records).run()
  }
}

export async function syncNotesData(db: Db, rawData: any[], currentYear: string) {
  if (!rawData || rawData.length === 0) {
    console.log('No data found in "Update To Do PM" sheet.');
    return;
  }

  const records: any[] = [];
  const isFirstRowHeader = rawData[0] && rawData[0].__EMPTY_1 === 'PM' && rawData[0].__EMPTY_2 === 'Nama Proyek';
  const startIndex = isFirstRowHeader ? 1 : 0;

  let lastSeenPm = 'Unknown';
  let lastSeenYear = currentYear;
  let lastSeenDate: Date | null = null;

  for (let i = startIndex; i < rawData.length; i++) {
    const row = rawData[i];

    const rawDate = row.__EMPTY;
    const pm = row.__EMPTY_1;
    const projectName = row.__EMPTY_2;
    const noteText = row.__EMPTY_3;
    const yearValue = row.__EMPTY_4;

    let noteDateObj: Date | null = null;
    if (rawDate) {
      let tempDate: Date | null = null;

      if (rawDate instanceof Date) {
        tempDate = rawDate;
      } else if (typeof rawDate === 'string') {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          tempDate = parsedDate;
        }
      }

      if (tempDate) {
        const userTimezoneOffset = tempDate.getTimezoneOffset() * 60000;
        noteDateObj = new Date(tempDate.getTime() - userTimezoneOffset);

        lastSeenDate = noteDateObj;
      }
    }
    if (!noteDateObj && lastSeenDate) {
      noteDateObj = lastSeenDate;
    }

    let currentPmValue = pm ? pm.toString().trim() : null;
    if (currentPmValue) {
      lastSeenPm = currentPmValue;
    } else {
      currentPmValue = lastSeenPm;
    }

    let noteYear: string;
    if (yearValue) {
      const parsedYear = yearValue.toString()
      if (!isNaN(parsedYear)) {
        lastSeenYear = parsedYear;
        noteYear = lastSeenYear;
      } else {
        noteYear = lastSeenYear;
      }
    } else {
      noteYear = lastSeenYear;
    }

    const cleanProjectName = projectName ? projectName.toString().trim() : null;
    const cleanNoteText = noteText ? noteText.toString().trim() : null;

    if (cleanProjectName || cleanNoteText) {
      records.push({
        noteDate: noteDateObj,
        pm: currentPmValue,
        project_name: cleanProjectName,
        notes: cleanNoteText,
        year: noteYear,
        syncedAt: new Date()
      });
    }
  }

  if (records.length === 0) return

  const uniqueCombos = Array.from(new Set(records.map(r => `${r.pm}|${r.project_name}|${r.year}`)));

  for (const combo of uniqueCombos) {
    const [p_pm, p_name, p_year] = combo.split('|');

    db.delete(notes).where(
      and(
        eq(notes.pm, p_pm || ''),
        eq(notes.project_name, p_name || ''),
        eq(notes.year, parseInt(p_year || '0'))
      )
    );
  }

  db.insert(notes).values(records).run()
}

function sanitizeValue(val: any) {
  if (val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  return val;
}

function parseTextDate(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    const d = String(value.getDate()).padStart(2, '0');
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }
  
  return String(value).trim();
}