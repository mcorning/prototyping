<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/soteriaLogoCovidRed.jpg" />
    <LocalContactTracing />
  </div>
</template>

<script>
// @ is an alias to /src
import LocalContactTracing from '@/components/LocalContactTracing';
export default {
  name: 'Home',
  components: {
    LocalContactTracing,
  },
};
</script>
