<template>
  <v-list nav role="group">
    <v-list-item to="/" exact prepend-icon="mdi-home" title="Home" data-testid="nav-home" />
    <v-list-item
      to="/contacts"
      prepend-icon="mdi-account-supervisor"
      title="Contacts"
      data-testid="nav-contacts"
    />
  </v-list>
</template>
