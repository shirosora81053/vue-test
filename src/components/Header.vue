<template>
  <BNavbar toggleable="sm" variant="secondary">
    <BNavbarBrand tag="h1" href="/"><i class="bi bi-house-door me-2"></i>Home App</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem to="/" active-class="active">Home</BNavItem>
        <BNavItemDropdown text="ツール" right>
          <BDropdownItem to="/tools/cron-generator">Cron式ジェネレーター</BDropdownItem>
        </BNavItemDropdown>
        <!-- <BNavItemDropdown text="BOOTH" right>
          <BDropdownItem to="/booth/orderHistory">注文履歴</BDropdownItem>
          <BDropdownItem to="/booth/orderCsvImport">受注CSV取込</BDropdownItem>
        </BNavItemDropdown> -->
        <BNavItem to="/inquiry">お問い合わせ</BNavItem>
      </BNavbarNav>
      <BNavbarNav class="ms-auto mb-2 mb-lg-0"> </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts"></script>