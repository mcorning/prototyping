<template>
  <v-speed-dial
    :top="top"
    :bottom="bottom"
    :right="right"
    :left="left"
    :direction="direction"
    :transition="transition"
  >
    <template v-slot:activator>
      <v-btn v-model="fab" color="primary darken-2" dark fab>
        <v-icon v-if="fab">
          mdi-close
        </v-icon>
        <v-icon v-else>
          {{ mainIcon }}
        </v-icon>
      </v-btn>
    </template>

    <div v-if="room" class="text-center">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on" class="text-center pb-3">
            <v-btn fab dark small color="green" @click="$emit('open')">
              <v-icon>mdi-door-open</v-icon>
            </v-btn>
          </span>
        </template>
        <span class="text-center"> Open Room</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on" class="text-center pb-3">
            <v-btn fab dark small color="orange" @click="$emit('close')">
              <v-icon>mdi-door-closed-lock</v-icon>
            </v-btn>
          </span>
        </template>
        <span>Close Room</span>
      </v-tooltip>
    </div>
    <v-btn fab dark small color="green" @click="$emit('added')">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-btn fab dark small color="orange" @click="$emit('deleted')">
      <v-icon>mdi-delete</v-icon>
    </v-btn>
  </v-speed-dial>
</template>

<script>
export default {
  props: {
    room: { type: Boolean, default: false },
    mainIcon: {
      type: String,
    },
  },
  data: () => ({
    direction: 'left',
    fab: false,
    hover: true,
    top: false,
    right: true,
    bottom: true,
    left: false,
    // transition: 'scale',
    transition: 'slide-y-reverse-transition',
  }),
};
</script>
