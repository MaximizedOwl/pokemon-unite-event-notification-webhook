const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { diffLines } = require('diff');
const axios = require('axios');

const getWebhookUrl = async () => {
  // .env ファイルから環境変数を読み込む

  require('dotenv').config();
  // DISCORD_WEBHOOK_URL 環境変数を取得
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  console.log(webhookUrl);

  // WEBHOOK_URL が設定されているか確認
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not defined in the .env file.');
    process.exit(1); // エラーコードでプロセスを終了
  }

  // ここで webhookUrl を使用して何かしらの処理を行う

  return webhookUrl;
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

    let lastHeight = await driver.executeScript(
      'return document.body.scrollHeight'
    );

    while (true) {
      await driver.executeScript(
        'window.scrollTo(0, document.body.scrollHeight);'
      );
      await driver.sleep(2000); // スクロールが完了するまで待機
      console.log(`スクロールが完了するまで待機しています。`);

      const newHeight = await driver.executeScript(
        'return document.body.scrollHeight'
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
        if (href.includes('https://tonamel.com/competition')) {
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
  fs.writeFileSync('data/hrefs.txt', scrapingResult.join('\n'), 'utf-8');
  console.log('href属性を hrefs.txt に保存しました。');
};

/* 
  差分計算
*/
async function compareAndOverwriteFiles(preHrefsPath, hrefsPath) {
  // ファイルからテキストを読み込む関数
  const readTextFromFile = async (filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  };

  // ファイルからテキストを読み込む
  const hrefsFile = await readTextFromFile(hrefsPath);
  const preHrefsFile = await readTextFromFile(preHrefsPath);

  // ファイルの差分を取得
  const diffResult = await diffLines(preHrefsFile, hrefsFile);

  let differences = [];
  // 差分を表示
  await diffResult.forEach((part) => {
    if (part.added) {
      console.log(`Added: ${part.value}`);
      console.log(`typeof: ${typeof part.value}`);
      differences.push(part.value);
    } else if (part.removed) {
      console.log(`Removed: ${part.value}`);
    } else {
      console.log(`Unchanged: ${part.value}`);
    }
  });

  // hrefsFileをpreHrefsPathに上書き
  fs.writeFileSync(preHrefsPath, hrefsFile);

  console.log(`differences: ` + differences);
  console.log('差分を取得し、hrefs.txtを更新しました。');

  return differences;
}

/* 
  webhookへのリクエスト
*/
const connectWebhook = async (differences) => {
  const webhookUrl = await getWebhookUrl();

  console.log();

  const message = `新着のイベントがあります。
  ${differences.forEach((element) => {
    return element + '\n';
  })}`;

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
  const url = `https://tonamel.com/competitions?game=streetfighter6&region=JP`;
  const scrapingResult = await scraping(url);
  await writingForFile(scrapingResult);

  const hrefsPath = 'data/hrefs.txt';
  const preHrefsPath = 'data/preHrefs.txt';

  const differences = await compareAndOverwriteFiles(preHrefsPath, hrefsPath);

  console.log(`differences.length: ` + differences.length);

  (await differences.length) > 0
    ? await connectWebhook(differences)
    : console.log(`新着イベントはありませんでした。`);
};

/* 
  処理をまとめた関数の実行
*/
main();
