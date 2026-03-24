<template>
  <Header class="mb-3" />
  <BContainer fluid>
    <h1 class="mt-3">Cron式ジェネレーター</h1>

    <BRow class="mb-4 align-items-center">
      <BCol md="3">
        <label for="start-time-input" class="fw-bold">起算開始時刻</label>
      </BCol>
      <BCol md="4">
        <BFormInput id="start-time-input" v-model="calculationStartTime" type="datetime-local" class="form-control">
        </BFormInput>
      </BCol>
      <BCol md="3">
        <BButton variant="outline-info" @click="reloadCurrentTime" class="w-100">現在時刻を再読み込み</BButton>
      </BCol>
      <BCol md="2">
        <small class="text-muted">（次回実行を計算する起点）</small>
      </BCol>
    </BRow>

    <hr>

    <BRow class="mb-2 align-items-end">
      <BCol class="text-center fw-bold" v-for="field in fields" :key="field.key">
        {{ field.label }} ({{ field.range }})
      </BCol>
      <BCol md="12"></BCol>
    </BRow>

    <BRow>
      <BCol v-for="field in fields" :key="field.key">
        <BInputGroup class="mb-1">
          <BFormInput v-model="field.value" :placeholder="field.placeholder" class="form-control" :state="field.isValid"
            type="text"></BFormInput>
          <BInputGroupAppend>
            <BButton variant="outline-secondary" @click="field.value = '*'">*</BButton>
          </BInputGroupAppend>
        </BInputGroup>
        <BFormText v-if="!field.isValid" class="text-danger small">
          {{ field.errorMessage }}
        </BFormText>
      </BCol>
    </BRow>

    <BRow class="mb-4">
      <BCol md="12">
        <small class="text-warning">
          <strong class="fw-bold">半角英数</strong>で入力してください。（全角文字はエラーとなります）
        </small>
      </BCol>
    </BRow>

    <BRow class="mb-4">
      <BCol md="12" class="text-end">
        <BButton variant="outline-primary" size="sm" @click="pasteCronExpression" class="me-2">
          <i class="bi bi-clipboard-check"></i> Cronを貼り付け
        </BButton>
        <BButton variant="outline-danger" size="sm" @click="resetAllToAsterisk">
          クリア
        </BButton>
      </BCol>
    </BRow>

    <hr>

    <BAlert show variant="primary" class="mt-4 generated-cron-box">
      <BRow class="align-items-center">

        <BCol md="11">
          <h4 class="alert-heading">生成されたCron式</h4>
          <p class="h3 fw-bold text-primary text-monospace text-break">{{ generatedCronExpression }}</p>
          <small>
            * フィールド順: <strong class="fw-bold">分 時 日 月 曜日</strong> (0=日曜, 7=日曜)
          </small>
        </BCol>

        <BCol md="1" class="text-center ps-0">
          <BButton variant="success" size="sm" @click="copyCronExpression" class="copy-icon-button">
            <i class="bi bi-clipboard"></i>
          </BButton>
        </BCol>
      </BRow>
    </BAlert>

    <BRow class="mt-4">

      <BCol md="6">
        <BAlert show :variant="hasError ? 'danger' : (isCalculating ? 'warning' : 'info')">
          <h4 class="alert-heading">実行予定</h4>
          <div v-if="!hasError">
            <div v-if="isCalculating">
              <div class="text-center my-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">実行予定を計算中...</p>
              </div>
            </div>
            <BTable v-else small striped :items="nextRuns"></BTable>
          </div>
          <p v-else class="fw-bold">
            入力エラーがあるため、実行予定を算出できません。
          </p>
          <small class="text-muted">
            起算開始時刻: <strong class="fw-bold">{{ displayStartTime }}</strong> から計算
          </small>
        </BAlert>
      </BCol>

      <BCol md="6">
        <BAlert show :variant="hasError ? 'danger' : 'success'">
          <h4 class="alert-heading">実行タイミング</h4>
          <p v-if="!hasError">{{ interpretation }}</p>
          <p v-else class="fw-bold">
            入力エラーがあるため、実行タイミングを解析できません。エラーを修正してください。
          </p>
        </BAlert>
      </BCol>

    </BRow>

    <h3 class="mt-5">指定方法の説明</h3>
    <table class="table table-striped table-hover">
      <thead class="bg-dark text-white">
        <tr>
          <th scope="col">記号</th>
          <th scope="col">説明</th>
          <th scope="col">例</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in syntaxItems" :key="item.記号">
          <td v-html="item.記号"></td>
          <td v-html="item.説明"></td>
          <td v-html="item.例"></td>
        </tr>
      </tbody>
    </table>

    <div v-if="showCopyNotification" class="position-fixed top-0 end-0 mt-3 me-3 z-3 w-auto">
      <BAlert show variant="success" class="m-0 shadow-lg" style="min-width: 300px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
          class="bi bi-check-circle-fill me-2" viewBox="0 0 16 16">
          <path
            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.497 5.253 7.425a.75.75 0 0 0-1.06 1.056l2.775 2.557a.75.75 0 0 0 1.082-.02L11.05 6.91a.75.75 0 0 0-.02-1.08z" />
        </svg>
        Cron式をクリップボードにコピーしました！
      </BAlert>
    </div>
  </BContainer>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watchEffect, type Ref } from 'vue';
  import Header from '@/components/Header.vue';

  // --- 型定義 ---

  /** Cronフィールドを表すオブジェクトのインターフェース */
  interface Field {
    key: 'minute' | 'hour' | 'day' | 'month' | 'weekday';
    label: string;
    range: string;
    placeholder: string;
    value: string;
    min: number;
    max: number;
    isValid: boolean | null;
    errorMessage: string;
  }

  /** 実行予定の結果オブジェクトのインターフェース */
  interface RunResult {
    実行日時: string;
  }

  /** バリデーション結果のインターフェース */
  interface ValidationResult {
    isOk: boolean;
    message: string;
  }

  /** 曜日のマッピング */
  const DAY_NAMES: string[] = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜'];


  // --- 状態 (State) ---

  /** 現在時刻を 'YYYY-MM-DDTHH:MM' 形式で取得する */
  const getNowAsDateTimeLocal = (): string => {
    const now: Date = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    const year: number = now.getFullYear();
    const month: string = (now.getMonth() + 1).toString().padStart(2, '0');
    const day: string = now.getDate().toString().padStart(2, '0');
    const hour: string = now.getHours().toString().padStart(2, '0');
    const minute: string = now.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const calculationStartTime: Ref<string> = ref<string>(getNowAsDateTimeLocal());
  const nextRuns: Ref<RunResult[]> = ref<RunResult[]>([]);
  const isCalculating: Ref<boolean> = ref<boolean>(false);
  const showCopyNotification: Ref<boolean> = ref<boolean>(false); // コピー通知の状態

  const reloadCurrentTime = (): void => {
    calculationStartTime.value = getNowAsDateTimeLocal();
  }

  // Cronフィールドの定義
  const fields: Field[] = reactive<Field[]>([
    { key: 'minute', label: '分', range: '0-59', placeholder: '例: *, 0-30, */5', value: '*', min: 0, max: 59, isValid: null, errorMessage: '' },
    { key: 'hour', label: '時', range: '0-23', placeholder: '例: *, 9-17, 8,12', value: '*', min: 0, max: 23, isValid: null, errorMessage: '' },
    { key: 'day', label: '日', range: '1-31', placeholder: '例: *, 1,15, 1-7', value: '*', min: 1, max: 31, isValid: null, errorMessage: '' },
    { key: 'month', label: '月', range: '1-12', placeholder: '例: *, 1,3,5', value: '*', min: 1, max: 12, isValid: null, errorMessage: '' },
    { key: 'weekday', label: '曜日', range: '0-7', placeholder: '例: *, 1-5, 0 (日曜)', value: '*', min: 0, max: 7, isValid: null, errorMessage: '' },
  ])

  // 説明テーブルのデータ
  const syntaxItems: Array<{ 記号: string, 説明: string, 例: string }> = [
    { 記号: '*', 説明: '全ての値（毎）', 例: '<code class="text-monospace">* * * * *</code> (毎分実行)' },
    { 記号: '1,5,10', 説明: 'カンマ区切りの複数の値', 例: '<code class="text-monospace">1,5,10 * * * *</code> (毎時1, 5, 10分)' },
    { 記号: '1-7', 説明: '範囲指定', 例: '<code class="text-monospace">0 9-17 * * *</code> (9時から17時まで毎時0分)' },
    { 記号: '*/5', 説明: 'ステップ値。5で割り切れる値', 例: '<code class="text-monospace">*/5 * * * *</code> (5分ごと)' },
    { 記号: '1-56/5', 説明: '範囲とステップ値の複合', 例: '<code class="text-monospace">1-56/5 * * * *</code> (1分から56分まで5分ごと)' },
  ]

  // --- メソッド ---

  /** すべての入力を * に戻す */
  const resetAllToAsterisk = (): void => {
    fields.forEach((field: Field) => {
      field.value = '*';
    });
  }

  /** Cron式をクリップボードにコピーする */
  const copyCronExpression = (): void => {
    const cron: string = generatedCronExpression.value;

    const tempInput: HTMLTextAreaElement = document.createElement('textarea');
    tempInput.value = cron;
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
      document.execCommand('copy');
      // ポップアップ通知を表示
      showCopyNotification.value = true;
      setTimeout((): void => {
        showCopyNotification.value = false;
      }, 5000); // 5秒間表示
    } catch (err) {
      console.error('コピーに失敗:', err);
    }

    document.body.removeChild(tempInput);
  }

  /**
   * Cron式をクリップボードから貼り付けて各フィールドに設定する
   * NOTE: この関数内で navigator.clipboard.readText() を使用する場合、
   * 環境によっては HTTPS やユーザー操作の制限を受けることがあります。
   */
  const pasteCronExpression = async (): Promise<void> => {
    try {
      if (!navigator.clipboard) {
        alert('お使いのブラウザはクリップボードAPIをサポートしていません。');
        return;
      }
      const text: string = await navigator.clipboard.readText();
      const cronParts: string[] = text.trim().split(/\s+/);

      if (cronParts.length !== 5) {
        alert('貼り付けた文字列が有効な5フィールドのCron式ではありません。');
        return;
      }

      fields.forEach((field: Field, index: number) => {
        // null/undefinedチェックとtrimを行う
        field.value = cronParts[index] ? cronParts[index]!.trim() : '*';
      });

      // 貼り付け成功のフィードバックが必要であればここに実装
    } catch (err) {
      console.error('貼り付けに失敗:', err);
      alert('クリップボードからの貼り付けに失敗しました。ブラウザの権限設定を確認してください。');
    }
  }


  /** バリデーションロジック */
  const validateField = (val: string, min: number, max: number): ValidationResult => {
    const v: string = val.trim();
    if (v === '*') return { isOk: true, message: '' };

    // 全角文字や不正な文字のチェック
    // 許可文字: 0-9, -, /, *, ,
    if (v.match(/[^0-9\-\/,\*]/)) {
      return { isOk: false, message: '全角文字や不正な文字が含まれています。半角英数で指定してください。' };
    }

    const parts: string[] = v.split(',');

    for (const part of parts) {
      if (!part.trim()) continue;

      const stepMatch: RegExpMatchArray | null = part.match(/^(.+?)\/(\d+)$/);
      let checkPart: string = part;
      if (stepMatch) {
        checkPart = stepMatch[1]!;
        const stepValue: number = parseInt(stepMatch[2]!);
        if (isNaN(stepValue) || stepValue <= 0) return { isOk: false, message: 'ステップ値は1以上で指定してください。' };
      }

      // 値、範囲、アスタリスクのチェック
      if (checkPart !== '*' && !/^\d+$/.test(checkPart) && !checkPart.includes('-')) {
        return { isOk: false, message: '数値、範囲(-)、ステップ(/)、カンマ(,)、アスタリスク(*)のみ使用可能です。' };
      }

      const rangeMatch: RegExpMatchArray | null = checkPart.match(/^(-?\d+)-(-?\d+)$/);
      if (rangeMatch) {
        const start: number = parseInt(rangeMatch[1]!);
        const end: number = parseInt(rangeMatch[2]!);
        if (isNaN(start) || isNaN(end) || start > end) {
          return { isOk: false, message: '範囲指定の形式が不正です（例: 1-5）。' };
        }
        if (start < min || end > max) {
          return { isOk: false, message: `範囲は ${min} から ${max} の間で指定してください。` };
        }
      }
      else if (checkPart !== '*' && /^\d+$/.test(checkPart)) {
        const num: number = parseInt(checkPart);
        if (num < min || num > max) {
          return { isOk: false, message: `値は ${min} から ${max} の間で指定してください。` };
        }
      }
    }

    return { isOk: true, message: '' };
  };

  /** Cronフィールドをパースし、有効な値のSetを返す */
  const parseCronField = (value: string, min: number, max: number): Set<number> => {
    const validValues: Set<number> = new Set<number>();
    const v: string = value.trim();

    if (v === '*') {
      for (let i = min; i <= max; i++) {
        validValues.add(i);
      }
      // 曜日の7は0と同じなので特別扱い
      if (max === 7 && min === 0) validValues.add(0);
      return validValues;
    }

    const parts: string[] = v.split(',');
    for (const part of parts) {
      if (!part.trim()) continue;

      let start: number = min;
      let end: number = max;
      let step: number = 1;

      const stepMatch: RegExpMatchArray | null = part.match(/^(.+?)\/(\d+)$/);
      let checkPart: string = part;

      if (stepMatch) {
        checkPart = stepMatch[1]!;
        step = parseInt(stepMatch[2]!);
        if (isNaN(step) || step <= 0) continue;

        if (checkPart === '*') {
          start = min;
          end = max;
        }
      }

      const rangeMatch: RegExpMatchArray | null = checkPart.match(/^(-?\d+)-(-?\d+)$/);
      if (rangeMatch) {
        start = Math.max(min, parseInt(rangeMatch[1]!));
        end = Math.min(max, parseInt(rangeMatch[2]!));
      }
      else if (checkPart !== '*') {
        const num: number = parseInt(checkPart);
        if (!isNaN(num) && num >= min && num <= max) {
          start = num;
          end = num;
        } else {
          continue;
        }
      }

      // 値を追加
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) {
          validValues.add(i);
        }
      }

      // 曜日の7は0と同じなので特別扱い
      if (max === 7 && min === 0) {
        if (validValues.has(7)) validValues.add(0);
        if (validValues.has(0)) validValues.add(7);
      }
    }

    return validValues;
  };

  /** 実行予定計算ロジック */
  const calculateNextRuns = (cronExpression: string, startDateTime: Date): RunResult[] => {
    if (hasError.value) return [];

    const parts: string[] = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minuteStr, hourStr, dayOfMonthStr, monthStr, dayOfWeekStr] = parts;
    const count: number = 5;
    const runs: RunResult[] = [];

    // 各フィールドの有効な値をパース
    const validMinutes: Set<number> = parseCronField(minuteStr!, fields[0]!.min, fields[0]!.max);
    const validHours: Set<number> = parseCronField(hourStr!, fields[1]!.min, fields[1]!.max);
    const validDaysOfMonth: Set<number> = parseCronField(dayOfMonthStr!, fields[2]!.min, fields[2]!.max);
    const validMonths: Set<number> = parseCronField(monthStr!, fields[3]!.min, fields[3]!.max);
    const validDaysOfWeek: Set<number> = parseCronField(dayOfWeekStr!, fields[4]!.min, fields[4]!.max);

    // 日と曜日の両方に * 以外の指定がある場合 (OR条件)
    const isDayOfMonthSpecified: boolean = dayOfMonthStr !== '*';
    const isDayOfWeekSpecified: boolean = dayOfWeekStr !== '*';

    let currentDate: Date = new Date(startDateTime);
    let attempts: number = 0;
    const MAX_ATTEMPTS: number = 525600; // 約1年分の分数 (無限ループ防止)

    while (runs.length < count && attempts < MAX_ATTEMPTS) {
      attempts++;

      // 現在の時刻/日付情報
      const currentMinute: number = currentDate.getMinutes();
      const currentHour: number = currentDate.getHours();
      const currentDayOfMonth: number = currentDate.getDate();
      const currentMonth: number = currentDate.getMonth() + 1; // 1-12
      const currentDayOfWeek: number = currentDate.getDay(); // 0=日, 1=月, ..., 6=土

      // 1. 分、時、月、年のチェック
      const minuteMatch: boolean = validMinutes.has(currentMinute);
      const hourMatch: boolean = validHours.has(currentHour);
      const monthMatch: boolean = validMonths.has(currentMonth);

      if (minuteMatch && hourMatch && monthMatch) {
        // 2. 日と曜日のチェック
        let dayMatch: boolean = false;

        if (!isDayOfMonthSpecified && !isDayOfWeekSpecified) {
          // 両方 * の場合
          dayMatch = true;
        } else if (isDayOfMonthSpecified && isDayOfWeekSpecified) {
          // 両方指定の場合 (Vixie CronのORロジック: どちらかにマッチすればOK)
          const domMatch: boolean = validDaysOfMonth.has(currentDayOfMonth);
          const dowMatch: boolean = validDaysOfWeek.has(currentDayOfWeek);
          dayMatch = domMatch || dowMatch;
        } else if (isDayOfMonthSpecified) {
          // 日のみ指定
          dayMatch = validDaysOfMonth.has(currentDayOfMonth);
        } else if (isDayOfWeekSpecified) {
          // 曜日のみ指定
          dayMatch = validDaysOfWeek.has(currentDayOfWeek);
        }

        if (dayMatch) {
          runs.push({
            '実行日時': currentDate.toLocaleString('ja-JP', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              weekday: 'short'
            })
          });
        }
      }

      // 次の分へ進める
      currentDate.setMinutes(currentDate.getMinutes() + 1);
    }

    if (runs.length < count) {
      console.warn(`Warning: Could only find ${runs.length} runs within ${MAX_ATTEMPTS} attempts. The schedule may be very sparse.`);
    }

    return runs;
  };


  /** Cronフィールドの解説を生成するヘルパー関数 */
  const interpretPart = (val: string, unit: string, isWeekday: boolean = false): string => {
    const v: string = val.trim();
    if (v === '*') return `毎${unit}`;

    const stepMatch: RegExpMatchArray | null = v.match(/^(.+?)\/(\d+)$/);
    if (stepMatch) {
      const base: string = stepMatch[1]!;
      const step: string = stepMatch[2]!;

      if (base === '*') return `${unit}を${step}ごと`;

      const baseInterpretation: string = interpretPart(base, unit, isWeekday);
      if (baseInterpretation.startsWith('毎')) {
        return baseInterpretation.replace('毎', '毎') + `を${step}ごと`;
      }
      return `${baseInterpretation}の範囲内で${step}${unit}ごと`;
    }

    if (v.includes('-')) {
      const [startStr, endStr] = v.split('-');
      const start: number = parseInt(startStr!);
      const end: number = parseInt(endStr!);
      const s: string = isWeekday ? DAY_NAMES[start]! : startStr! + unit;
      const e: string = isWeekday ? DAY_NAMES[end]! : endStr! + unit;
      return `${s}から${e}まで`;
    }

    const parts: string[] = v.split(',');
    if (parts.length > 1) {
      const formattedParts: string = parts.map((p: string): string => isWeekday ? DAY_NAMES[parseInt(p)]! : p + unit).join(', ');
      return formattedParts;
    }

    const num: number = parseInt(v);
    return isWeekday && !isNaN(num) ? DAY_NAMES[num]! : v + unit;
  }

  /** 全てのCronフィールドの解説を結合する */
  const interpretAll = (): string => {
    const [minute, hour, day, month, weekday]: string[] = fields.map((f: Field): string => f.value.trim());

    const minStr: string = minute === '*' ? '' : `毎時${interpretPart(minute!, '分')}`;
    const hourStr: string = hour === '*' ? '' : `${minStr}${minStr ? 'に' : ''}${interpretPart(hour!, '時')}`;
    const dayStr: string = day === '*' ? '' : `${interpretPart(day!, '日')}`;
    const monthStr: string = month === '*' ? '' : `${interpretPart(month!, '月')}`;
    const weekdayStr: string = weekday === '*' ? '' : `${interpretPart(weekday!, '', true)}`;


    if (weekday !== '*') {
      if (hour === '*' && minute === '*') {
        return `毎週${weekdayStr}の毎分実行されます。`;
      } else if (day !== '*') {
        // 日と曜日の両方指定がある場合 (OR条件で解釈)
        return `${monthStr}${monthStr ? 'の' : '毎月の'}${dayStr}に該当する日、または${weekdayStr}に該当する日、${hourStr}${minStr ? interpretPart(minute!, '分') : 'の毎分'}に実行。`;
      } else {
        return `毎週${weekdayStr}の${hourStr}${hourStr ? 'に' : ''}${minStr}${minStr ? '' : 'の毎分'}に実行されます。`;
      }
    }

    if (month !== '*') {
      const primaryUnit: string = monthStr;
      const secondaryUnit: string = `${dayStr}${dayStr ? 'の' : '毎日の'}${hourStr}${hourStr ? 'に' : '毎時の'}${minStr ? interpretPart(minute!, '分') : '毎分'}`;
      return `${primaryUnit}の${secondaryUnit}に実行されます。`;
    } else if (day !== '*') {
      const primaryUnit: string = '毎月';
      const secondaryUnit: string = `${dayStr}の${hourStr}${hourStr ? 'に' : '毎時の'}${minStr ? interpretPart(minute!, '分') : '毎分'}`;
      return `${primaryUnit}${secondaryUnit}に実行されます。`;
    } else if (hour !== '*') {
      const primaryUnit: string = '毎日';
      const secondaryUnit: string = `${hourStr}${minStr ? 'の' + interpretPart(minute!, '分') : 'の毎分'}`;
      return `${primaryUnit}${secondaryUnit}に実行されます。`;
    } else if (minute !== '*') {
      const primaryUnit: string = '毎時';
      const secondaryUnit: string = interpretPart(minute!, '分');
      return `${primaryUnit}${secondaryUnit}に実行されます。`;
    }

    return '毎分実行されます。';
  };

  // --- 計算プロパティ (Computed) ---

  const generatedCronExpression = computed<string>(() => {
    return fields.map((f: Field): string => f.value.trim()).join(' ')
  })

  const hasError = computed<boolean>(() => {
    return fields.some((f: Field): boolean => f.isValid === false)
  })

  const interpretation = computed<string>(() => {
    if (hasError.value) {
      return '入力エラーがあるため、実行タイミングを解析できません。';
    }
    return interpretAll();
  })

  const startCalculationDate = computed<Date>(() => {
    if (!calculationStartTime.value) return new Date();
    // 1分進めて、次の分の開始時刻から計算を始める
    const date: Date = new Date(calculationStartTime.value);
    date.setMinutes(date.getMinutes() + 1);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  });

  const displayStartTime = computed<string>(() => {
    if (!calculationStartTime.value) return '時刻未入力';
    const date: Date = new Date(calculationStartTime.value);
    return date.toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'short'
    });
  });


  // --- 副作用 (Watch) ---

  watchEffect((): void => {
    // 1. バリデーションの実行
    fields.forEach((field: Field): void => {
      const { isOk, message }: ValidationResult = validateField(field.value, field.min, field.max);
      field.isValid = isOk;
      field.errorMessage = message;
    });

    // 2. エラーがない場合のみ計算を実行（時間がかかるため非同期化）
    if (!hasError.value && calculationStartTime.value) {
      isCalculating.value = true;
      // 計算ロジックがUIをブロックしないように非同期実行
      setTimeout((): void => {
        try {
          nextRuns.value = calculateNextRuns(generatedCronExpression.value, startCalculationDate.value);
        } catch (e) {
          console.error("Cron計算エラー:", e);
          nextRuns.value = [];
        } finally {
          isCalculating.value = false;
        }
      }, 100);
    } else {
      nextRuns.value = [];
      isCalculating.value = false;
    }
  });
</script>