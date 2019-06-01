const preShiftSheetId = ""; //申請シフト記述用スプレッドシートID

/*------------------------------------------------------------------------------
GET
仕様：　画面ロード時にログインしているユーザーを元にスプレッドシート work_schedule_applied にから申請済みのシフト日程を取得する
引数：　e.parameter.
userName;//選択したユーザー名
------------------------------------------------------------------------------*/
function doGet(e) {
  /* スプレッドシート */
  const spreadSheet = SpreadsheetApp.openById(preShiftSheetId);
  //シート読み取り
  const sheet = spreadSheet.getSheetByName("work_schedule_applied"); // work_schedule_appliedという名前のスプレッドシートをもちいります

  var requestDays = [];

  const param = e.parameter;
  const column = Number(param.column); // 走査をする列
  const line = Number(param.line); // 走査を開始する行

  /* 選択したユーザーの既に申請しているシフト一覧を取得 */
  var dayColStartIndex = 1;
  var dayColumnNum = 1;
  // ↓ getSheetValues(startRow, startColumn, numRows, numColumns)
  var dayColumn = sheet.getSheetValues(line, column, 62, dayColumnNum);

  //スプレッドシートに記入されているの日分走査
  for (var j = 1; j < dayColumn.length; j++) {
    //２ヶ月分のデータを取得
    var nowLine = Number(j) + Number(line);
    if (sheet.getRange(nowLine, column + 1).getValue() === "～") {
      var lookDay = sheet.getRange(nowLine, 1).getValue(); //スプレッドシートの中で今見ている日
      /* スプレッドシートの日付はDateTime形式なのでそれを "yyyy/mm/dd"の形式に変形する準備  */
      var year = lookDay.getFullYear(); //年取得
      var month = lookDay.getMonth() + 1; //月取得
      month += "";
      if (month.length === 1) {
        month = "0" + month; //１桁の数字は０をくっつけて２桁にする
      }
      var day = lookDay.getDate(); //日取得
      day += "";
      if (day.length === 1) {
        day = "0" + day; //１桁の数字は０をくっつけて２桁にする
      }
      var date = year + "/" + month + "/" + day; // "yyyy/mm/dd"の形式に変形

      var ofWeek = sheet.getRange(nowLine, 2).getValue();
      var startTime = sheet
        .getRange(nowLine, column)
        .getValue()
        .toLocaleString()
        .split(" ")[1]
        .substring(0, 5); //出勤時間
      var endTime = sheet
        .getRange(nowLine, column + 2)
        .getValue()
        .toLocaleString()
        .split(" ")[1]
        .substring(0, 5); //退勤時間
      var shiftSheetStatus = sheet.getRange(nowLine, column + 3).getValue();
      var shiftStatus = -1; //見ているシフトが承認済か否か　0->未承認シフト　１->承認シフト
      if (shiftSheetStatus === "未承認") {
        shiftStatus = 0; //未承認シフト
      } else {
        shiftStatus = 1; //承認シフト
      }
      var shiftTime = {
        ofWeek: ofWeek,
        date: date,
        startTime: startTime,
        endTime: endTime,
        isApproved: shiftStatus
      };

      requestDays.push(shiftTime);
    }
  }
  return ContentService.createTextOutput(JSON.stringify(requestDays));
}

/*------------------------------------------------------------------------------
POST
仕様：　シフト申請ボタンを押されたら、選択したユーザー・日時を元にスプレッドシート work_schedule_applied にその情報を書き込む
引数：　e.parameter.
userName;//選択したユーザー名
selectDays;//選択した日付
startTime;//選択した出勤時間
endTime;//選択した退勤時間
------------------------------------------------------------------------------*/
function doPost(e) {
  /* スプレッドシート */
  const spreadSheet = SpreadsheetApp.openById(preShiftSheetId);
  //シート読み取り
  const sheet = spreadSheet.getSheetByName("work_schedule_applied");

  const param = e.parameter;

  //名前抽出
  const userName = param.userName; //選択したユーザー名
  //日時抽出
  const selectDays = param.selectDays; //選択した日付
  const selectDaysArray = selectDays.split(","); //選択した日付を配列化
  const startTime = param.startTime; //選択した出勤時間
  const endTime = param.endTime; //選択した退勤時間
  //列行抽出
  const line = Number(param.line); //
  const column = Number(param.column); //シフト申請APIを飛ばしてきたユーザーのスプレッドシート内でのカラム番号

  /* 選択した日付の行を走査 */
  var dayColStartIndex = 1;
  var dayColumnNum = 1;
  var dayColumn = sheet.getSheetValues(
    line,
    dayColStartIndex,
    62,
    dayColumnNum
  );
  selectDaysArray.forEach(function(elementDay) {
    //選択した日分ループ
    elementDay = elementDay.trim(); //前後の空白を削除
    for (var j = 1; j < dayColumn.length; j++) {
      //スプレッドシートの日
      var nowLine = Number(j) + line; //スプレッドシートの中で見ている日の"行"
      var lookDay = dayColumn[j][0]; //スプレッドシートの中で今見ている日

      /* スプレッドシートの日付はDateTime形式なのでそれを "yyyy/mm/dd"の形式に変形する準備  */
      var year = lookDay.getFullYear(); //年取得
      var month = lookDay.getMonth() + 1; //月取得
      month += "";
      if (month.length === 1) {
        month = "0" + month; //１桁の数字は０をくっつけて２桁にする
      }
      var day = lookDay.getDate(); //日取得
      day += "";
      if (day.length === 1) {
        day = "0" + day; //１桁の数字は０をくっつけて２桁にする
      }
      var date = year + "/" + month + "/" + day; // "yyyy/mm/dd"の形式に変形

      if (date === elementDay) {
        //申請スプレッドシートのうち一致している日時の行番号を取得
        /*取得できた列と行に選択した時間を入力*/
        sheet.getRange(nowLine, column).setValue(startTime);
        sheet.getRange(nowLine, column + 1).setValue("～");
        sheet.getRange(nowLine, column + 2).setValue(endTime);
        sheet.getRange(nowLine, column + 3).setValue("未承認");
        break;
      }
    }
  });

  return ContentService.createTextOutput("Success");
}
