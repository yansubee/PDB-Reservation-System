/**
 * 予約メール解析・ログ保存・カレンダー登録一括システム
 * 【更新日時】2026年3月24日 16:00
 * 【更新内容】
 * 1. 未読メールのみ処理し、完了後に既読化（is:unread, markRead）
 * 2. Hotel名の抽出バグを修正（"Hotel ]" -> "Hotel"）
 * 3. 同日の同名カレンダー予定の重複登録防止（isEventExists）
 * 4. ランク短縮にDMとINを追加
 */

const CALENDAR_ID = 'ponidiversbrunei@gmail.com';
const SEARCH_QUERY = 'from:system@smoothcontact.jp "【New Book】" is:unread'; 

function main() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("予約ログ");
  if (!sheet) {
    sheet = ss.insertSheet("予約ログ");
    sheet.appendRow(["処理日時", "予約種別", "Ref番号", "代表者名", "人数", "日付", "本数", "状況"]);
    sheet.setFrozenRows(1);
  }

  const threads = GmailApp.search(SEARCH_QUERY, 0, 5);
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  
  threads.forEach(thread => {
    const msg = thread.getMessages().pop();
    const body = msg.getPlainBody();
    const subject = msg.getSubject();
    
    const isSTW = subject.includes("STW_Dive");
    const stwRef = isSTW ? extractValue(body, "Ref") : "";
    const hotel = extractValue(body, "Hotel"); 
    
    const pickUpTime = "07:15"; 
    
    const note = extractValue(body, "Note");
    
    const divers = extractDivers(body);
    if (divers.length === 0) return;
    const pax = divers.length;

    let allDaysProcessed = true; 

    for (let i = 1; i <= 5; i++) {
      const dateStr = extractValue(body, `Day${i}_Dive_Day`);
      if (!dateStr) continue;
      
      const diveCountRaw = extractValue(body, `Day${i}_Dive`);
      const diveCountNum = diveCountRaw.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9]/g, "");
      const diveCountLabel = (diveCountNum || "0") + " Dives";
      
      const eventDate = new Date(dateStr);

      let honorific = isSTW ? "STW" : (divers[0].gender === "Female" ? "Ms." : "Mr.");
      const eventTitle = `${diveCountLabel} / ${pax} Pax / ${honorific} ${divers[0].surname}`;

      if (isEventExists(calendar, eventDate, eventTitle)) {
        Logger.log("重複のためスキップ: " + eventTitle);
        continue;
      }

      let description = "";
      if (isSTW) description += `STW Ref. ${stwRef}\n\n`;
      
      description += `【Hotel】 ${hotel || "Poni Homestay"}\n`;
      description += `【Pick Up】 ${pickUpTime} / ${pax} Pax\n\n`;

      divers.forEach((d, idx) => {
        description += `--- Diver ${idx + 1} ---\n`;
        description += `${d.fullName}\n`;           
        description += `${d.gender} / ${d.age}\n`;  
        description += `${d.rank} / ${d.log} dives\n`; 
        description += `LAST DIVE : ${d.lastDive}\n`;
        
        if (d.rental === "YES") {
          description += `Rental: YES\n${d.height}cm / ${d.weight}kg / ${d.foot}cm\n`;
        } else {
          description += `Rental: NO\n`;
        }
        description += `\n`;
      });
      if (note) description += `【Note】\n${note}`;

      try {
        calendar.createAllDayEvent(eventTitle, eventDate, {description: description});
        sheet.appendRow([new Date(), isSTW ? "STW" : "Direct", stwRef, divers[0].fullName, pax, dateStr, diveCountNum, "完了"]);
      } catch (e) {
        Logger.log("エラー: " + e.message);
        allDaysProcessed = false;
      }
    }

    if (allDaysProcessed) {
      thread.markRead();
    }
  });
}

function isEventExists(calendar, date, title) {
  const events = calendar.getEventsForDay(date);
  return events.some(e => e.getTitle() === title);
}

function extractValue(body, label) {
  const regex = new RegExp("\\[\\s*" + label + "\\s*\\]\\s*([^\\r\\n]+)", "i");
  const match = body.match(regex);
  return match ? match[1].trim() : "";
}

function extractDivers(body) {
  const divers = [];
  const nameRegex = /\[ Diver_(\d+)_Name \]\s*(.+)/g;
  let match;
  while ((match = nameRegex.exec(body)) !== null) {
    const id = match[1];
    const fullName = match[2].trim().toUpperCase();
    if (!fullName) continue;

    divers.push({
      fullName: fullName,
      surname: fullName.split(/\s+/)[0], 
      gender: extractValue(body, `Diver_${id}_Gender`),
      age: extractValue(body, `Diver_${id}_Age`),
      rank: shortenRank(extractValue(body, `Diver_${id}_C-Card`)),
      log: extractValue(body, `Diver_${id}_Dive_Log`),
      lastDive: extractValue(body, `Diver_${id}_Last_Dive`),
      rental: extractValue(body, `Diver_${id}_Rental Equipment`), 
      height: extractValue(body, `Diver_${id}_Height`),
      weight: extractValue(body, `Diver_${id}_Weight`),
      foot: extractValue(body, `Diver_${id}_Shoe_Size`)
    });
  }
  return divers;
}

function shortenRank(rank) {
  if (!rank) return "";
  const r = rank.toUpperCase();
  if (r.includes("ADVANCED")) return "AOW";
  if (r.includes("RESCUE")) return "RED";
  if (r.includes("OPEN")) return "OW";
  if (r.includes("DIVEMASTER")) return "DM";
  if (r.includes("INSTRUCTOR")) return "IN";
  return rank;
}
