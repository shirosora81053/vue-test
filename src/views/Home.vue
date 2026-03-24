<template>
  <Header class="mb-3" />
  <BContainer fluid>
    <BCard no-body>
      <BTabs card>
        <BTab title="お知らせ" active>
          <BCardText></BCardText>
        </BTab>
        <BTab title="通知">
          <BCardText></BCardText>
        </BTab>
      </BTabs>
    </BCard>
  </BContainer>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue';
</script>