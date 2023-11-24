const fs = require('fs');
const { Builder, By } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { diffLines } = require('diff');
const axios = require('axios');
const {
  COMPETIITON_URL,
  HREFS_PATH,
  PREHREFS_PATH,
  TONAMEL_URL,
  EXEC_SCRIPT_GET_SCROLLHEIGHT,
  EXEC_SCRIPT_SCROLLING,
  ENCODING_TYPE,
} = require('./constants');

/* 
  .env ファイルから環境変数を読み込む
  DISCORD_WEBHOOK_URL 環境変数を取得
*/
const getWebhookUrl = async () => {
  require('dotenv').config();
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  // DISCORD_WEBHOOK_URL が設定されているか確認
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL .env ファイルで定義されていません。');
    process.exit(1); // エラーコードでプロセスを終了
  } else {
    return DISCORD_WEBHOOK_URL;
  }
};

/* 
  スクレイピング処理
*/
const scraping = async (url) => {
  // Firefoxドライバーを初期化
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options().headless()) // headlessモードで実行する場合
    .build();

  try {
    await driver.get(url);
    console.log(`${url} から情報を取得します。`);

    let lastHeight = await driver.executeScript(EXEC_SCRIPT_GET_SCROLLHEIGHT);

    while (true) {
      await driver.executeScript(EXEC_SCRIPT_SCROLLING);
      await driver.sleep(2000); // スクロールが完了するまで待機
      console.log(`スクロールが完了するまで待機しています。`);

      const newHeight = await driver.executeScript(
        EXEC_SCRIPT_GET_SCROLLHEIGHT
      );
      if (newHeight === lastHeight) {
        break;
      }
      lastHeight = newHeight;
    }
    console.log(`ページスクロール完了`);

    // class=main内のaタグのhref属性を取得
    const hrefElements = await driver.findElements(By.css('.main a'));
    const hrefs = await Promise.all(
      hrefElements.map(async (element) => {
        const href = await element.getAttribute('href');

        // 余分なリンクを削除（"https://tonamel.com/organize/new_competition"とかが入ってくる）
        if (href.includes(COMPETIITON_URL)) {
          console.log(href);
          return href.trim();
        } else {
          console.log(href);
          return null;
        }
      })
    );

    return hrefs;
  } finally {
    // ブラウザを終了
    await driver.quit();
    console.log('Browser終了');
  }
};

/* 
  取得したhref属性をファイルに書き込む
*/
const writingForFile = (scrapingResult) => {
  fs.writeFileSync(HREFS_PATH, scrapingResult.join('\n'), ENCODING_TYPE);
  console.log('href属性を hrefs.txt に保存しました。');
};

/* 
  差分計算
*/
async function compareAndOverwriteFiles() {
  // ファイルからテキストを読み込む関数
  const readTextFromFile = async (filePath) => {
    return fs.readFileSync(filePath, ENCODING_TYPE);
  };

  // ファイルからテキストを読み込む
  const hrefsFile = await readTextFromFile(HREFS_PATH);
  const preHrefsFile = await readTextFromFile(PREHREFS_PATH);

  // ファイルの差分を取得
  const diffResult = await diffLines(preHrefsFile, hrefsFile);

  let resultList = [];
  // 差分を表示
  await diffResult.forEach((part) => {
    if (part.added) {
      console.log(`Added: ${part.value}`);
      resultList.push(part.value);
    } else if (part.removed) {
      console.log(`Removed: ${part.value}`);
    } else {
      console.log(`Unchanged: ${part.value}`);
    }
  });

  // hrefsFileをpreHrefsPathに上書き
  fs.writeFileSync(PREHREFS_PATH, hrefsFile);

  console.log('差分を取得し、hrefs.txtを更新しました。');

  let differencesList = [];

  // 更新がなかった場合「undefined」が入ってくる
  if (resultList[0] != undefined) {
    // resultListには要素の1つ目に末尾に改行コードを含んだURLが文字列として入っている
    // 配列の最後に改行コード分の空白が入ってしまうので改行分を削除
    const differencesStr = resultList[0].replace(/\n$/, '');

    // differencesを改行コードで分け配列に格納
    differencesList = differencesStr.split('\n');

    console.log(`differencesList: ` + differencesList);
  }

  return differencesList; // 何も追加がなければ空の配列が返る
}

/* 
  webhookへのリクエスト
*/
const connectWebhook = async (differencesList) => {
  const webhookUrl = await getWebhookUrl();

  let message = '新着のイベントがあります。\n'; // 最初のメッセージを設定

  // 配列の要素をテンプレート構文とforEachでメッセージに追加
  differencesList.forEach((element) => {
    message += `${element}\n`; // 各要素の後に改行を追加
  });

  console.log('message: ' + message);

  // axiosで送る
  try {
    // POSTリクエストでDiscordにmessageを送信
    const response = await axios.post(
      webhookUrl,
      { content: message } // このオブジェクトがJSONとして送信される
    );
    // データ送信が成功するとレスポンスが来る
    console.log('レスポンスを受信しました：' + response.data);
    console.log('POSTに成功しました。');
  } catch (error) {
    // ネットワークに接続できてない・サーバーが落ちてる・URLが違うなど
    console.log('POSTに失敗しました。');
    console.error(error);
  }
};

/* 
  処理をまとめた関数
*/
const main = async () => {
  const scrapingResult = await scraping(TONAMEL_URL);
  await writingForFile(scrapingResult);

  const differencesList = await compareAndOverwriteFiles();

  console.log(`differences.length: ` + differencesList.length);

  (await differencesList.length) > 0
    ? await connectWebhook(differencesList)
    : console.log(`新着イベントはありませんでした。`);
};

module.exports = main;
