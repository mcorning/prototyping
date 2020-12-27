<template>
  <v-card>
    <v-card-title>First time (or starting over)?</v-card-title>
    <v-card-text
      >Visitors enter Rooms. Rooms, then, must have a public name that everybody
      will recognize.</v-card-text
    >
    <!-- <v-card-text>
      You can manage more than one Room, but you can only open one Room at a
      time.
    </v-card-text> -->
    <v-card-text>
      When you open a Room, the Server adds your Room to a list on Visitor pages
      so they can choose your Room and enter.
    </v-card-text>
    <v-text-field
      v-if="firstTime"
      label="Enter your Room name:"
      hint="Use a unique name you could use to invite in someone from your community."
      persistent-hint
      clearable
      @change="onNewRoom($event)"
    />
  </v-card>
</template>
