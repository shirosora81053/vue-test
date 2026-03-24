<template>
  <div class="contact-container">
    <h1>お問い合わせ</h1>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="name">お名前</label>
        <input type="text" id="name" v-model="formData.name" required />
      </div>
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input type="email" id="email" v-model="formData.email" required />
      </div>
      <div class="form-group">
        <label for="message">メッセージ</label>
        <textarea id="message" v-model="formData.message" required></textarea>
      </div>
      <button type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting">送信中...</span>
        <span v-else>送信する</span>
      </button>
    </form>
    <div v-if="submitStatus" :class="['status-message', statusClass]">
      {{ submitStatus }}
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue';

  // フォームデータの状態管理
  const formData = reactive({
    name: '',
    email: '',
    message: ''
  });

  // 送信状態の管理
  const isSubmitting = ref(false);
  const submitStatus = ref('');
  const statusClass = ref('');

  // 環境変数からWebhook URLを取得
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

  // フォーム送信処理
  const submitForm = async () => {
    isSubmitting.value = true;
    submitStatus.value = '';
    statusClass.value = '';

    // Discordに送信するペイロードの構築
    const payload = {
      content: "新しいお問い合わせを受信しました",
      embeds: [
        {
          title: "お問い合わせ内容",
          color: 3447003,
          fields: [
            { name: "お名前", value: formData.name, inline: true },
            { name: "メールアドレス", value: formData.email, inline: true },
            { name: "メッセージ", value: formData.message }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      // Webhook URLが設定されていない場合の例外処理
      if (!webhookUrl) {
        throw new Error('Webhook URLが設定されていません。');
      }

      // Discord WebhookへのPOSTリクエスト
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // HTTPステータスエラーの例外処理
      if (!response.ok) {
        throw new Error(`送信に失敗しました: ${response.status} ${response.statusText}`);
      }

      // 送信成功時の処理
      submitStatus.value = 'お問い合わせを送信しました。';
      statusClass.value = 'success';

      // フォームのリセット
      formData.name = '';
      formData.email = '';
      formData.message = '';

    } catch (error) {
      // 例外発生時の処理
      console.error('Webhook送信エラー:', error);
      submitStatus.value = 'エラーが発生しました。時間をおいて再度お試しください。';
      statusClass.value = 'error';
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<style scoped>

  /* スタイル定義 */
  .contact-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
  }

  .form-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  input,
  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }

  textarea {
    height: 100px;
    resize: vertical;
  }

  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .status-message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 4px;
  }

  .success {
    background-color: #d4edda;
    color: #155724;
  }

  .error {
    background-color: #f8d7da;
    color: #721c24;
  }
</style>