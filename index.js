const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

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
  fs.writeFileSync('hrefs.txt', scrapingResult.join('\n'), 'utf-8');
  console.log('href属性を hrefs.txt に保存しました。');
};

/* 
  処理をまとめた関数
*/
const main = async () => {
  const url = `https://tonamel.com/competitions?game=streetfighter6&region=JP`;
  const scrapingResult = await scraping(url);
  writingForFile(scrapingResult);
};

/* 
  処理をまとめた関数の実行
*/
main();
