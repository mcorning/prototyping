<template>
  <v-container>
    <v-card max-width="350" outlined>
      <v-card-title>Supporting Documents</v-card-title>

      <v-card-text
        ><a
          href="https://htmlpreview.github.io/?https://github.com/mcorning/prototyping/blob/master/out/Specification.html"
          target="_blank"
          >LCT Specification</a
        ></v-card-text
      >
    </v-card>
    <v-card max-width="350" outlined>
      <H3 class="pl-3">
        Welcome to Local Contact Tracing
      </H3>
      <v-card-subtitle>Contact Tracing for the rest of us</v-card-subtitle>
      <v-card-text class="pt-4"
        >If you came to visit after reading the
        <a
          href="https://trinsic.id/simplifying-ssi-based-solutions-to-focus-on-adoption/"
          target="_blank"
          >Trinsic Newsletter</a
        >
        or the
        <a
          href="https://us10.campaign-archive.com/?u=1e21ad08ed0422a5dac0b8eed&id=6eea8bc679"
          target="_blank"
          >CCI Newsletter</a
        >, thanks for stopping by.</v-card-text
      >
      <v-card-text
        >Since this project is still in beta, you might not be able to use all
        its capabilities yet.</v-card-text
      >
      <v-card-text
        >You will, however, always see this UI (though I change it dozens of
        times a day, so it might not look the same every time you
        visit).</v-card-text
      >
      <v-card-text>
        COVID-19 kills an American every 80 seconds. Time is not our ally. But
        the
        <a href="http://soteria.id" target="_blank"> Soteria Institute</a> is.
      </v-card-text>
      <v-card-text>
        <a href="https://soteriainstitute.org/donatesoteria" target="_blank"
          >Your donations</a
        >
        (financial or in kind) will help us bring this weapon online sooner to
        help us stop this virus in its tracks.</v-card-text
      >
      <v-card-text>
        So please, join our growing group of world-wide partners in this fight
        for our lives:
        <a href="https://enduringnet.org/" target="_blank">
          <v-img
            alt="Enduring Net Logo"
            class="shrink mr-2"
            contain
            src="@/assets/Enduring-Net-Logo-Portrait-Purple-RGB-BG.png"
          />
        </a>

        <a href="https://secours.io/" target="_blank">
          <v-img
            alt="Secours Logo"
            class="shrink mr-2"
            contain
            src="@/assets/Secours.ioLogo400X310.png"
            max-height="175"
          /> </a
        >.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
// @ is an alias to /src
export default {
  name: 'Home',
  components: {},
};
</script>
