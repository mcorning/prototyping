import { Model } from '@vuex-orm/core';

export default class State extends Model {
  static entity = 'state';

  static fields() {
    return {
      id: this.number(0), // without a fvixed id, update() creates a record
      defaultVue: this.string(''),
      incubationPeriod: this.string(''),
      managerId: this.string(''),
      organization: this.string(''),
      roomId: this.string(''),
      yourId: this.string(''),
      zipcode: this.string(''),
    };
  }
  static async updateOrg(val) {
    let p = await this.$update({
      data: { id: 0, organization: val },
    });
    return p;
  }

  static async changeRoomId(val) {
    let p = await this.$update({
      data: { id: 0, roomId: val },
    });
    return p;
  }
  static async updateDefaultVue(val) {
    let p = await this.$update({
      data: { id: 0, defaultVue: val },
    });
    return p;
  }

  static async updateManagerId(val) {
    let p = await this.$update({
      data: { id: 0, roomId: val },
    });
    return p;
  }
  static async changeYourId(val) {
    let p = await this.$update({
      data: { id: 0, yourId: val },
    });
    return p;
  }
}
