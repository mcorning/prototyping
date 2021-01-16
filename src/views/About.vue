<template>
  <v-container>
    <v-card flat>
      <v-card-title class="text-h3">
        Safe in Sisters
      </v-card-title>
      <v-card-subtitle class="text-h5">An Oregon Initiative</v-card-subtitle>
      <!-- <span class="text-h6">Bottom Lihe Up Front</span> -->
      <v-card-text class="text-body-2">
        Local Contact Tracing can help communities like
        <a href="https://www.ci.sisters.or.us" target="_blank"
          >Sisters, Oregon</a
        ><strong> reopen their economies without reopening the pandemic</strong
        >. That is, LCT lets us balance the
        <strong>risk of infection</strong> with
        <strong>the risk of bankruptcy</strong>.
      </v-card-text>
    </v-card>
    <!-- <v-row align="center"> -->
    <v-card>
      <v-tabs v-model="tab" center-active background-color="secondary">
        <v-tab v-for="item in items" :key="item.tab">
          {{ item.tab }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item v-for="item in items" :key="item.tab">
          <v-card flat>
            <v-card-text v-html="item.content"> </v-card-text>

            <v-row v-if="!item.content" align="center">
              <v-item-group
                v-model="window"
                class="shrink mr-6"
                mandatory
                tag="v-flex"
              >
                <v-item
                  v-for="n in length"
                  :key="n"
                  v-slot:default="{ active, toggle }"
                >
                  <div>
                    <v-btn
                      class="mx-3"
                      :input-value="active"
                      icon
                      @click="toggle"
                    >
                      <v-icon>mdi-record</v-icon>
                    </v-btn>
                  </div>
                </v-item>
              </v-item-group>

              <v-col>
                <v-window v-model="window" class="elevation-1 ml-0" vertical>
                  <v-window-item v-for="n in length" :key="n">
                    <v-card flat class="ml-3">
                      <v-card-text>
                        <v-row class="mb-4" align="center">
                          <v-avatar color="grey" class="mr-4 white--text">{{
                            n
                          }}</v-avatar>
                          <strong class="title"> {{ getText(n, 'h') }}</strong>
                          <v-spacer></v-spacer>
                          <v-btn icon>
                            <v-icon>mdi-account</v-icon>
                          </v-btn>
                        </v-row>
                        <span v-html="getText(n, 't')"></span>
                      </v-card-text>
                    </v-card>
                  </v-window-item>
                </v-window>
              </v-col>
            </v-row>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-container>
</template>
<script>
export default {
  data: () => ({
    length: 3,
    window: 0,
    show: false,
    howItWorks: [
      {
        h: 'Setup',
        t: `
<ol>
<li>An individual uses their mobile device to connect to a web site that renders the Visitor app (see QR code below) </li>
<li>They enter their nickname in app  </li>
  <li>They go to a public space and ask the proprietor to use the business computer or mobile device to connect to a web site that renders the Room app </li>
  <li>The business enters a name for their public space that everyone nearby can recognize </li>
</ol>`,
      },

      {
        h: 'Daily Use',
        t: `
<ol>
  <li>Whenever a Visitor visits a public space that uses the LCT Room app, the Visitor uses the LCT Visitor app to checkin with the Room app 
    <ol>
      <li>Ensuring their nickname is selected</li>
       <li>Visitor selects the appropriate Room from a list of open Rooms (the public space must have its Room app open)</li>
       <li>Visitor clicks the Check-in button</li>
    </ol>
  </li>
  <li>If the visitor goes into quarantine later
    <ol> 
      <li>Visitor opens the LCT Visitor app </li>
      <li>Clicks the Warn Rooms button</li>
    </ol>
  </li>
</ol>`,
      },
      {
        h: 'COVID-19 Exposure Protocol',
        t: `
<ol>
  <li>LCT Visitor app 
    <ol>
      <li>Collects from local storage the Rooms visited in the last 14 days </li>
      <li>Sends a message to the LCT server with the list of visited Rooms </li>
    </ol>
  </li>
  <li>The LCT Server 
    <ol>
      <li>Stores the list of Room visits in memory</li> 
      <li>Sends a message to each visited Room with the visit dates </li>
    </ol>
  </li>
  <li>The LCT Room app 
    <ol>
      <li>Scans its record of visits (stored locally on the Room’s device) over the last 14 days look </li>
      <li>Sends an exposure alert to the LCT Visitor app of each Visitor’s in the Room on the same day as the person now in quarantine </li>
    </ol>
  </li>
  <li>LCT Visitor app 
    <ol>
        <li>Renders an alert on the mobile device warning of possible exposure </li>
        <li>The Warning recommends the Visitor get tested </li>
        <li>If the test returns positive 
          <ol>
            <li>The Visitor hits the Warn Rooms button on the LCT Visitor app </li>
            <li>The same workflow continues </li>
            <li>The Visitor goes into quarantine and doesn’t use the LCT Visitor app for 14 days.</li>
          </ol>
        </li>
      </ol>
    </li>
  </li>
</ol>`,
      },
    ],

    tab: null,
    items: [
      {
        tab: 'Introduction',
        content: `
<p class="text-body-2">
  At the onset of the COVID-19 pandemic in the spring of 2020, the Soteria
  Institute conceived a novel strategy to crush a novel coronavirus. This
  was a full stack strategy that included, COVID-19 symptom tracking,
  verifiable credentials, and contact tracing.
</p>
<p class="text-body-2">
  After three months of development and socialization, we realized our
  first strategic approach was too sophisticated, especially for people
  unfamiliar with some of that technology. In the summer of 2020 we
  flipped our priorities to be
</p>
<p class="text-body-2">Tracing -> Testing -> Treatment </p>
<p class="text-body-2">
  We set about to produce a novel contact tracing system that was simple
  yet effective. After several months of trial and error, we have produced
  two web applications. One app is for public spaces: Another is for
  individuals who visit these public spaces.
</p>`,
      },
      { tab: 'How LCT Works', content: '' },
      {
        tab: 'LCT Capabilities',
        content: `
<span class="text-h6">Tracing</span>
<ul>
  <li> Local Contact Tracing (LCT) is, well, local. It is owned and operated by citizens within specific geographic locales</li>
  <li>The LCT Visitor app uses no personal identifying information (no given names and no phone numbers)</li>
  <li>There is no centralized data store (all data is stored locally on constituent’s mobile device)</li>
  <li>LCT does not depend on
    <ul>
      <li>GPS</li>
      <li>Bluetooth</li>
      <li>The Government</li>
    </ul>
   </li>
  <li>LCT works to the extent that Rooms and Visitors work LCT</li>
  <li> Whole communities can become aware of exposure in the time it takes to get a positive test result from one person</li>
  <li>Human contact tracing systems can integrate with LCT to measurably reduce human effort</li>
</ul>

<span class="text-h6">Testing</span>
<p class="text-body-2">
LCT can integrate with local COVID-19 testing systems
</p>     

<span class="text-h6">Treatment</span>
<p class="text-body-2">
LCT warnings can be triggered by physician’s for patients testing positive and being treated for COVID-19
</p>`,
      },
      {
        tab: 'Be a Beta Tester',
        content: `
<span class="text-h6">Get the Apps</span>

<p class="text-body-2">
You can help us test and improve the latest developer versions of LCT by
scanning these QR codes with your mobile phone’s camera:
</p>

<span class="text-h6">Add to Home Screen</span>

<p class="text-body-2">
On iPhones, you can add the web site to your Home screen by clicking the
icon at the bottom middle of Safari, then scrolling down to the Add to
Home Screen option. 
</p>

<p class="text-body-2">
On Android, there is a button in the same
bottom-middle position. At the bottom of the options is Add to screen.
Now, each time you want to use LCT, you can do it with a single click.
Stay safe out there…
</p>`,
      },
    ],
  }),
  methods: {
    getText(n, e) {
      let x = this.howItWorks[n - 1];
      let text = x[e];
      console.log(n - 1, text);

      return text;
    },
  },
};
</script>
