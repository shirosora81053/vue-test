/// <reference types="vite/client" />
// Vueファイルのモジュール宣言
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}
