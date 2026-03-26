# PDB予約管理システム GASコーディングルール

このドキュメントは、Poni Divers Bali（PDB）の予約管理システムをGoogle Apps Script（GAS）で開発する際の**絶対に守るべきルール**をまとめたものです。

---

## 1. カレンダー詳細表記ルール

### 1.1 Pick Up時刻の判定
- **カレンダー名が `JP Book BRUNEI`** → Pick Up時刻は `07:15` 固定
- **それ以外のカレンダー** → Pick Up時刻は `TBC`（To Be Confirmed）

### 1.2 認定レベル表記
カレンダー詳細欄で使用する略称（PADI資格の英語略称）：
```
OW, AOW, RED, DM, IN
```

### 1.3 性別表記
- カレンダー詳細欄：`M` / `F`

### 1.4 ダイバー名の表記
- 形式：`Mr. YAMADA` / `Ms. YAMADA`
- 性別が `M` → `Mr.`
- 性別が `F` → `Ms.`
- 名字は**大文字**

### 1.5 年齢の表示
- 表示する
- 形式：`M / 35`（性別 / 年齢）

### 1.6 ログ本数の表記
- 形式：`AOW / 50 Dives`
- 認定レベル + ` / ` + 本数 + ` Dives`

### 1.7 LAST DIVE の日付フォーマット
- `YYYY-MM-DD` 形式（例：`2024-03-26`）

### 1.8 人数（PAX）の表記
- 形式：`2 PAX`（数字 + スペース + PAX）

### 1.9 レンタル種別の表記
- **英語表記のみ**
- 使用する表記：`Full Set`, `BCD`, `REG`, `MASK&SNL`, `SUITS`, `FINS`

### 1.10 サイズ情報の表示
- データソース：
  - `data.height`（身長）
    - `data.weight`（体重）
      - `data.footSize`（足のサイズ）
      - 表示形式：**改行区切り**（1項目1行）
      - 例：
      ```
      172cm
      80kg
      25cm
      ```

      ### 1.11 カレンダー詳細欄の完全フォーマット

      ```
      【Pick Up】 07:15 / 2 PAX
      【Hotel】 ホテル名

      --- Diver 1 ---
      Mr. YAMADA
      M / 35
      AOW / 50 Dives
      LAST DIVE : 2024-03-26

      Rental: Full Set (詳細)
      172cm
      80kg
      25cm

      --- Diver 2 ---
      Ms. TANAKA
      F / 28
      RED / 30 Dives
      LAST DIVE : 2024-03-20

      Rental: BCD
      168cm
      65kg
      24cm

      【Note】
      > 備考欄の内容
      ```

      ### 1.12 空行のルール
      - **ホテル名の後**：空行あり（`\n\n`）
      - **LAST DIVE の後**：空行あり（`\n\n`）
      - **レンタル行とサイズ情報の間**：空行**なし**（`\n`のみ）
      - **サイズ情報の後**：空行あり（`\n\n`）

      ---

      ## 2. 関数設計ルール

      ### 2.1 createCalendarDescription 関数
      ```javascript
      function createCalendarDescription(data, calendarName)
      ```

      **引数：**
      - `data`: 予約データオブジェクト
      - `calendarName`: 書き込み先カレンダー名（例：`"JP Book BRUNEI"`）

      **必須プロパティ（data）：**
      ```javascript
      {
        pax: "2",                    // 人数
          hotel: "ホテル名",
            nameEng: "YAMADA",           // 名字（英字）
              gender: "M",                 // 性別（M/F）
                age: "35",                   // 年齢
                  rank: "AOW",                 // 認定レベル
                    logs: "50",                  // ログ本数
                      lastDive: "2024-03-26",      // 最終ダイブ日（YYYY-MM-DD）
                        rental: "Full Set",          // レンタル種別
                          rentalDetail: "詳細",        // レンタル詳細
                            height: "172cm",             // 身長
                              weight: "80kg",              // 体重
                                footSize: "25cm",            // 足のサイズ
                                  remarks: "備考",             // 備考
                                    diver2: {
                                        name: "TANAKA",            // Diver 2の名字
                                            gender: "F",
                                                age: "28",
                                                    rank: "RED",
                                                        logs: "30",
                                                            lastDive: "2024-03-20",
                                                                rental: "BCD",
                                                                    height: "168cm",
                                                                        weight: "65kg",
                                                                            footSize: "24cm"
                                                                              }
                                                                              }
                                                                              ```

                                                                              ---

                                                                              ## 3. 予約番号採番ルール

                                                                              ### 3.1 予約経路ごとの採番方法
                                                                              - **SmoothContact** → `PDB-YYYYMMDD-連番`
                                                                              - **Veltra** → そのまま使用
                                                                              - **OKABAN** → `OKA-YYYYMMDD-連番`

                                                                              ### 3.2 ステータス表記（D列）
                                                                              - `確定`
                                                                              - `リクエスト中`
                                                                              - `キャンセル`

                                                                              ---

                                                                              ## 4. 重要な注意事項

                                                                              ### 4.1 コード修正時の鉄則
                                                                              - **「コード書き出して」という明示的な指示があるまで、コードを書き出さない**
                                                                              - 修正案や提案は必ず**文章で対話**してから実装する
                                                                              - 会話・対話を最優先する

                                                                              ### 4.2 データ型の注意
                                                                              - 数値は文字列として扱う（例：`"35"`, `"50"`）
                                                                              - 日付は `YYYY-MM-DD` 形式の文字列

                                                                              ### 4.3 空欄処理
                                                                              - サイズ情報が空の場合は `.filter(s => s)` で除外
                                                                              - 備考欄が空の場合は `(特記事項なし)` と表示

                                                                              ---

                                                                              ## 5. 開発環境

                                                                              - **プラットフォーム**: Google Apps Script
                                                                              - **言語**: JavaScript（ES5/ES6）
                                                                              - **CMS**: BiND UP（ウェブサイト用）

                                                                              ---

                                                                              ## 更新履歴

                                                                              - 2025-03-27: 初版作成
