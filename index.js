const functions = require('@google-cloud/functions-framework');
const main = require('./src/main');

// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
functions.cloudEvent('execute', (cloudEvent) => {
  // 処理をまとめた関数の実行
  main();
});
