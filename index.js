const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { diffChars } = require('diff');

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
  // ファイルの読み込み
  const preHrefsFile = fs.readFileSync(preHrefsPath, 'utf-8');
  const hrefsFile = fs.readFileSync(hrefsPath, 'utf-8');

  // // ファイルの差分を取得
  const differences = diffChars(preHrefsFile, hrefsFile);

  // 差分の表示
  differences.forEach((part) => {
    // 差分がある場合のみ表示
    if (part.added || part.removed) {
      console.log(part.value);
    }
  });

  // A'をAに上書き
  fs.writeFileSync(preHrefsPath, hrefsFile);

  console.log('差分を取得し、Aを更新しました。');
}

/* 
  処理をまとめた関数
*/
const main = async () => {
  const url = `https://tonamel.com/competitions?game=streetfighter6&region=JP`;
  const scrapingResult = await scraping(url);
  await writingForFile(scrapingResult);

  const hrefsPath = 'data/hrefs.txt';
  const preHrefsPath = 'data/preHrefs.txt';

  await compareAndOverwriteFiles(preHrefsPath, hrefsPath);
};

/* 
  webhookへのリクエスト
*/

/* 
  処理をまとめた関数の実行
*/
main();
