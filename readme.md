# ローカルでの実行方法

自分の Notion メモより抜粋。

### cloudevent のテスト手順

1. 実行したいコードを書く
2. package.json 内に`npm start` で functions framework を含む npx コマンドが実行されるように記述。

   ```json
   "scripts": {
     "start": "npx functions-framework --target=YOUR_FUNCTION_NAME [--signature-type=YOUR_SIGNATURE_TYPE]"
   }
   ```

3. `npm start` でプログラム起動
   下記が表示されれば OK

   ```bash
   $ npm start

   > pokemon-unite-event-notification-webhook@1.0.0 start
   > npx functions-framework --source=index --target=execute [--signature-type=cloudevent ]

   Serving function...
   Function: execute
   Signature type: cloudevent
   URL: http://localhost:8080/
   ```

4. 別のターミナルを起動し、前手順で起動したポートにめがけて curl コマンドを利用しリクエストを投げる。
   下記はドキュメント（`https://cloud.google.com/functions/docs/running/calling?hl=ja#cloudevent_functions`）のサンプルのリクエストを投げる。

   ```bash
   curl localhost:8080 \
     -X POST \
     -H "Content-Type: application/json" \
     -H "ce-id: 123451234512345" \
     -H "ce-specversion: 1.0" \
     -H "ce-time: 2020-01-02T12:34:56.789Z" \
     -H "ce-type: google.cloud.pubsub.topic.v1.messagePublished" \
     -H "ce-source: //pubsub.googleapis.com/projects/MY-PROJECT/topics/MY-TOPIC" \
     -d '{
           "message": {
             "data": "d29ybGQ=",
             "attributes": {
                 "attr1":"attr1-value"
             }
           },
           "subscription": "projects/MY-PROJECT/subscriptions/MY-SUB"
         }'
   ```

これでプログラムが実行されれば OK。

# 環境

- OS: Windows10
- Node.js: v16.13.0
