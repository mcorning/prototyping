<template>
  <v-container fluid>
    {{ uniqueVisitorNames }}
    <v-switch v-model="expand" label="Expand Visitors"></v-switch>

    <v-data-iterator
      :items="items"
      :items-per-page.sync="itemsPerPage"
      :page="page"
      :sort-by="sortBy.toLowerCase()"
      :sort-desc="sortDesc"
      :single-expand="expand"
      hide-default-footer
    >
      <template v-slot:header>
        <v-toolbar class="mb-2" color="indigo darken-5" dark flat>
          <v-toolbar-title>Unique Visitor IDs Today</v-toolbar-title>
          <v-btn-toggle v-model="sortDesc" mandatory>
            <v-btn large depressed color="blue" :value="false">
              <v-icon>mdi-arrow-up</v-icon>
            </v-btn>
            <v-btn large depressed color="blue" :value="true">
              <v-icon>mdi-arrow-down</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-toolbar>
      </template>

      <template v-slot:default="props">
        <v-row>
          <v-col
            v-for="item in props.items"
            :key="item"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card>
              <v-list dense>
                <v-list-item>
                  <v-list-item-content>Visitor:</v-list-item-content>
                  <v-list-item-content class="align-end">{{
                    item
                  }}</v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <template v-slot:footer>
        <v-toolbar class="mt-2" color="indigo" dark flat>
          <v-toolbar-title class="subheading">This is a footer</v-toolbar-title>
        </v-toolbar>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script>
export default {
  props: ['uniqueVisitorNames'],
  computed: {
    numberOfPages() {
      return Math.ceil(this.items.length / this.itemsPerPage);
    },
    items() {
      return this.uniqueVisitorNames;
    },
  },
  data: () => ({
    expand: false,

    sortDesc: false,
    sortBy: 'visitor',
    itemsPerPage: 4,
    page: 1,

    // items: ['Tao', 'Tao2'],
  }),
  methods: {
    nextPage() {
      if (this.page + 1 <= this.numberOfPages) this.page += 1;
    },
    formerPage() {
      if (this.page - 1 >= 1) this.page -= 1;
    },
    updateItemsPerPage(number) {
      this.itemsPerPage = number;
    },
  },
};
</script>
